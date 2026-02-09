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
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing sessionId");

    // Auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("[VERIFY-PAYMENT] Session status:", session.status, "for", sessionId);

    if (session.status !== "complete") {
      return new Response(
        JSON.stringify({ success: false, status: session.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const offerId = session.metadata?.offer_id;
    const restaurantId = session.metadata?.restaurant_id;
    const userId = session.metadata?.user_id || user.id;
    const paymentIntentId = session.payment_intent as string;

    // Use service role to create reservation (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Deduplicate by checking if a reservation with this stripe session already exists
    const { data: existing } = await supabaseAdmin
      .from("reservations")
      .select("id, pickup_code")
      .eq("stripe_session_id", sessionId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("[VERIFY-PAYMENT] Recent reservation found, skipping duplicate creation");
      return new Response(
        JSON.stringify({
          success: true,
          offerId,
          restaurantId,
          reservationId: existing[0].id,
          pickupCode: existing[0].pickup_code,
          alreadyExists: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create the reservation server-side
    const { data: newReservation, error: insertError } = await supabaseAdmin
      .from("reservations")
      .insert({
        user_id: userId,
        offer_id: offerId,
        restaurant_id: restaurantId || "",
        stripe_session_id: sessionId,
      })
      .select("id, pickup_code")
      .single();

    if (insertError) {
      console.error("[VERIFY-PAYMENT] Reservation insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("[VERIFY-PAYMENT] Reservation created:", newReservation.id, "pickup_code:", newReservation.pickup_code);

    // Record the payout split after successful payment
    if (restaurantId) {
      const { data: settings } = await supabaseAdmin
        .from("platform_settings")
        .select("commission_rate")
        .limit(1)
        .single();

      const commissionRate = settings?.commission_rate ?? 50;
      const amount = (session.amount_total || 0) / 100;
      const platformAmount = amount * commissionRate / 100;
      const restaurantAmount = amount - platformAmount;

      await supabaseAdmin.from("restaurant_payouts").insert({
        restaurant_id: restaurantId,
        reservation_id: newReservation.id,
        total_amount: amount,
        commission_rate: commissionRate,
        platform_amount: platformAmount,
        restaurant_amount: restaurantAmount,
        status: "pending",
        stripe_transfer_id: paymentIntentId || null,
      });

      console.log("[VERIFY-PAYMENT] Payout recorded for restaurant:", restaurantId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        offerId,
        restaurantId,
        reservationId: newReservation.id,
        pickupCode: newReservation.pickup_code,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[VERIFY-PAYMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
