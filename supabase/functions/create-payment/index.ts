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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { offerId, offerTitle, amount, restaurantId } = await req.json();
    if (!offerId || !amount) throw new Error("Missing offerId or amount");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Get commission rate
    const { data: settings } = await supabaseAdmin
      .from("platform_settings")
      .select("commission_rate")
      .limit(1)
      .single();

    const commissionRate = settings?.commission_rate ?? 50;

    // Get restaurant's Stripe Connect account
    let stripeAccountId: string | null = null;
    if (restaurantId) {
      const { data: restaurant } = await supabaseAdmin
        .from("restaurants")
        .select("stripe_account_id")
        .eq("id", restaurantId)
        .single();
      stripeAccountId = restaurant?.stripe_account_id ?? null;
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const amountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round(amountCents * commissionRate / 100);

    // Build session params
    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: offerTitle || "Panier anti-gaspi" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded",
      return_url: `${origin}/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        offer_id: offerId,
        user_id: user.id,
        restaurant_id: restaurantId || "",
      },
    };

    // If restaurant has a Connect account, use it for split payments
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: stripeAccountId,
        },
      };
      console.log("[CREATE-PAYMENT] Using Connect split:", {
        total: amountCents,
        platformFee: platformFeeCents,
        destination: stripeAccountId,
      });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record the payout split
    if (restaurantId) {
      const restaurantAmount = amount - (amount * commissionRate / 100);
      const platformAmount = amount * commissionRate / 100;

      await supabaseAdmin.from("restaurant_payouts").insert({
        restaurant_id: restaurantId,
        total_amount: amount,
        commission_rate: commissionRate,
        platform_amount: platformAmount,
        restaurant_amount: restaurantAmount,
        status: stripeAccountId ? "pending" : "pending",
        stripe_transfer_id: null,
      });
    }

    console.log("[CREATE-PAYMENT] Session created for offer:", offerId);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-PAYMENT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
