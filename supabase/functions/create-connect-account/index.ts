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
    const user = userData.user;

    const { restaurantId } = await req.json();
    if (!restaurantId) throw new Error("Missing restaurantId");

    // Verify ownership
    const { data: restaurant, error: restError } = await supabaseClient
      .from("restaurants")
      .select("id, owner_id, name, stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (restError || !restaurant) throw new Error("Restaurant not found");
    if (restaurant.owner_id !== user.id) throw new Error("Not the owner");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let accountId = restaurant.stripe_account_id;

    if (!accountId) {
      // Create a new Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { restaurant_id: restaurantId },
      });
      accountId = account.id;
      console.log("[CREATE-CONNECT] Created Stripe account:", accountId);

      // Save to DB
      const { error: updateError } = await supabaseClient
        .from("restaurants")
        .update({ stripe_account_id: accountId })
        .eq("id", restaurantId);

      if (updateError) {
        console.error("[CREATE-CONNECT] DB update error:", updateError);
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard`,
      return_url: `${origin}/dashboard`,
      type: "account_onboarding",
    });

    console.log("[CREATE-CONNECT] Onboarding link created for:", accountId);

    return new Response(JSON.stringify({ url: accountLink.url, accountId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-CONNECT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
