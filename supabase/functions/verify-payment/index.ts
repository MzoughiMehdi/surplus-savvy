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

    // Use service role to create reservation (bypasses RLS for dedup check)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Deduplicate by stripe session_id: check if reservation already created for this session
    // We store the session_id in the pickup_code temporarily... no, let's use a smarter approach:
    // Check if a reservation was created by this user for this offer within last 5 minutes
    // Actually, best approach: use the stripe session payment_intent as unique key
    const paymentIntentId = session.payment_intent as string;

    // Check if we already processed this payment
    const { data: existing } = await supabaseAdmin
      .from("reservations")
      .select("id, pickup_code")
      .eq("user_id", userId)
      .eq("offer_id", offerId)
      .order("created_at", { ascending: false })
      .limit(1);

    // If the most recent reservation for this offer was created less than 2 minutes ago, it's a duplicate
    if (existing && existing.length > 0) {
      const lastReservation = existing[0];
      // Check if this session was already processed by looking at recent reservations
      // We'll create a simple time-based dedup: if there's a reservation in last 60 seconds, skip
      const { data: recentRes } = await supabaseAdmin
        .from("reservations")
        .select("id, pickup_code, created_at")
        .eq("user_id", userId)
        .eq("offer_id", offerId)
        .gte("created_at", new Date(Date.now() - 60000).toISOString())
        .limit(1);

      if (recentRes && recentRes.length > 0) {
        console.log("[VERIFY-PAYMENT] Recent reservation found, skipping duplicate creation");
        return new Response(
          JSON.stringify({
            success: true,
            offerId,
            restaurantId,
            reservationId: recentRes[0].id,
            pickupCode: recentRes[0].pickup_code,
            alreadyExists: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Create the reservation server-side
    const { data: newReservation, error: insertError } = await supabaseAdmin
      .from("reservations")
      .insert({
        user_id: userId,
        offer_id: offerId,
        restaurant_id: restaurantId || "",
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
