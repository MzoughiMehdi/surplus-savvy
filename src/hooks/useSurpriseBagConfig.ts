import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SurpriseBagConfig {
  id: string;
  restaurant_id: string;
  base_price: number;
  daily_quantity: number;
  pickup_start: string;
  pickup_end: string;
  is_active: boolean;
}

export const useSurpriseBagConfig = (restaurantId: string | undefined) => {
  const [config, setConfig] = useState<SurpriseBagConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from("surprise_bag_config")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();
    setConfig(data as SurpriseBagConfig | null);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const upsertConfig = async (updates: Partial<Omit<SurpriseBagConfig, "id" | "restaurant_id">>) => {
    if (!restaurantId) return;
    if (config) {
      const { error } = await supabase
        .from("surprise_bag_config")
        .update(updates)
        .eq("id", config.id);
      if (error) throw error;
      setConfig((c) => c ? { ...c, ...updates } : c);
    } else {
      const { data, error } = await supabase
        .from("surprise_bag_config")
        .insert({ restaurant_id: restaurantId, base_price: 10, daily_quantity: 5, pickup_start: "18:00", pickup_end: "20:00", ...updates })
        .select()
        .single();
      if (error) throw error;
      setConfig(data as SurpriseBagConfig);
    }
  };

  return { config, loading, upsertConfig, refetch: fetchConfig };
};
