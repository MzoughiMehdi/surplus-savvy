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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { restaurantId } = await req.json();
    if (!restaurantId) throw new Error("Missing restaurantId");

    // Verify ownership and get stripe account
    const { data: restaurant, error: restError } = await supabaseClient
      .from("restaurants")
      .select("id, owner_id, stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (restError || !restaurant) throw new Error("Restaurant not found");
    if (restaurant.owner_id !== userData.user.id) throw new Error("Not the owner");
    if (!restaurant.stripe_account_id) throw new Error("No Stripe Connect account configured");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verify account has charges enabled
    const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);
    if (!account.charges_enabled) {
      return new Response(JSON.stringify({ transferred: 0, message: "Account not yet active" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get pending payouts without a valid stripe_transfer_id (or with a PI id instead of a transfer id)
    const { data: pendingPayouts, error: payoutsError } = await supabaseClient
      .from("restaurant_payouts")
      .select("id, restaurant_amount, stripe_transfer_id")
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending");

    if (payoutsError) throw new Error("Failed to fetch payouts");
    if (!pendingPayouts || pendingPayouts.length === 0) {
      return new Response(JSON.stringify({ transferred: 0, message: "No pending payouts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let transferred = 0;
    const errors: string[] = [];

    for (const payout of pendingPayouts) {
      try {
        const amountCents = Math.round(payout.restaurant_amount * 100);
        if (amountCents <= 0) continue;

        const transfer = await stripe.transfers.create({
          amount: amountCents,
          currency: "eur",
          destination: restaurant.stripe_account_id,
          metadata: { payout_id: payout.id },
        });

        await supabaseClient
          .from("restaurant_payouts")
          .update({ status: "completed", stripe_transfer_id: transfer.id })
          .eq("id", payout.id);

        transferred++;
        console.log("[TRANSFER-PENDING] Transferred:", transfer.id, "for payout:", payout.id);
      } catch (err: any) {
        console.error("[TRANSFER-PENDING] Error for payout", payout.id, err.message);
        errors.push(`${payout.id}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify({ transferred, total: pendingPayouts.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[TRANSFER-PENDING] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
