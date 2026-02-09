import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MANAGE-SUB-STATUS] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");
    logStep("Admin verified", { userId: userData.user.id });

    const { restaurantId, action } = await req.json();
    if (!restaurantId || !["pause", "resume"].includes(action)) {
      throw new Error("Invalid params: restaurantId and action (pause|resume) required");
    }

    // Get restaurant owner
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", restaurantId)
      .single();
    if (!restaurant) throw new Error("Restaurant not found");

    // Get owner email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("user_id", restaurant.owner_id)
      .maybeSingle();
    if (!profile?.email) throw new Error("Owner email not found");
    logStep("Owner found", { email: profile.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, skipping subscription management");
      return new Response(JSON.stringify({ success: true, message: "No Stripe customer found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Stripe customer found", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found, skipping");
      return new Response(JSON.stringify({ success: true, message: "No active subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subId = subscriptions.data[0].id;

    if (action === "pause") {
      await stripe.subscriptions.update(subId, {
        pause_collection: { behavior: "void" },
      });
      logStep("Subscription paused", { subId });
    } else {
      await stripe.subscriptions.update(subId, {
        pause_collection: null,
      } as any);
      logStep("Subscription resumed", { subId });
    }

    return new Response(JSON.stringify({ success: true, action, subscriptionId: subId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
