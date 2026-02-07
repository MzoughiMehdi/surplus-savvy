import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Stripe product/price mapping
export const PLANS = {
  basic: {
    product_id: "prod_Tw6HmbkdYzNV3c",
    price_id: "price_1SyE4WPrdr7HLEmYbLvrjNIR",
    name: "Basic",
    price: 29,
  },
  pro: {
    product_id: "prod_Tw6HzLDHsefI6s",
    price_id: "price_1SyE4dPrdr7HLEmYBfXG9D9r",
    name: "Pro",
    price: 59,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  planKey: PlanKey | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    planKey: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, productId: null, subscriptionEnd: null, planKey: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const planKey = Object.entries(PLANS).find(
        ([, v]) => v.product_id === data.product_id
      )?.[0] as PlanKey | undefined;

      setState({
        subscribed: data.subscribed,
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        planKey: planKey ?? null,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId: plan.price_id },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return { ...state, checkSubscription, startCheckout, openPortal };
};
