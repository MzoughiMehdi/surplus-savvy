import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationId, action } = await req.json();
    if (!reservationId) throw new Error("Missing reservationId");
    if (!action || !["capture", "cancel"].includes(action)) throw new Error("Invalid action");

    // Auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get reservation with payment_intent_id
    const { data: reservation, error: resErr } = await supabaseAdmin
      .from("reservations")
      .select("id, payment_intent_id, restaurant_id, status, config_id")
      .eq("id", reservationId)
      .single();

    if (resErr || !reservation) throw new Error("Reservation not found");
    if (!reservation.payment_intent_id) throw new Error("No payment intent for this reservation");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    if (action === "capture") {
      // Capture the held payment
      const pi = await stripe.paymentIntents.capture(reservation.payment_intent_id);
      console.log("[CAPTURE-PAYMENT] Captured:", pi.id, pi.status);

      // Record payout
      const { data: settings } = await supabaseAdmin
        .from("platform_settings")
        .select("commission_rate")
        .limit(1)
        .single();

      const commissionRate = settings?.commission_rate ?? 50;
      const amount = (pi.amount || 0) / 100;
      const platformAmount = amount * commissionRate / 100;
      const restaurantAmount = amount - platformAmount;

      if (reservation.restaurant_id) {
        await supabaseAdmin.from("restaurant_payouts").insert({
          restaurant_id: reservation.restaurant_id,
          reservation_id: reservation.id,
          total_amount: amount,
          commission_rate: commissionRate,
          platform_amount: platformAmount,
          restaurant_amount: restaurantAmount,
          status: "pending",
          stripe_transfer_id: pi.id,
        });
      }

      return new Response(JSON.stringify({ success: true, action: "captured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Cancel the payment intent (release hold)
      await stripe.paymentIntents.cancel(reservation.payment_intent_id);
      console.log("[CAPTURE-PAYMENT] Cancelled hold:", reservation.payment_intent_id);

      return new Response(JSON.stringify({ success: true, action: "cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[CAPTURE-PAYMENT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
