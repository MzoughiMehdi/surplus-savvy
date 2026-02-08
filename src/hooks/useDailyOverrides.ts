import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DailyOverride {
  id: string;
  restaurant_id: string;
  date: string;
  quantity: number | null;
  pickup_start: string | null;
  pickup_end: string | null;
  is_suspended: boolean;
}

export const useDailyOverrides = (restaurantId: string | undefined, month?: string) => {
  const [overrides, setOverrides] = useState<DailyOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverrides = useCallback(async () => {
    if (!restaurantId) return;
    let query = supabase
      .from("daily_overrides")
      .select("*")
      .eq("restaurant_id", restaurantId);

    if (month) {
      const start = `${month}-01`;
      const endDate = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0);
      const end = `${month}-${String(endDate.getDate()).padStart(2, "0")}`;
      query = query.gte("date", start).lte("date", end);
    }

    const { data } = await query.order("date");
    setOverrides((data as DailyOverride[]) || []);
    setLoading(false);
  }, [restaurantId, month]);

  useEffect(() => { fetchOverrides(); }, [fetchOverrides]);

  const upsertOverride = async (date: string, updates: Partial<Pick<DailyOverride, "quantity" | "pickup_start" | "pickup_end" | "is_suspended">>) => {
    if (!restaurantId) return;
    const existing = overrides.find((o) => o.date === date);
    if (existing) {
      const { error } = await supabase
        .from("daily_overrides")
        .update(updates)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("daily_overrides")
        .insert({ restaurant_id: restaurantId, date, ...updates });
      if (error) throw error;
    }
    await fetchOverrides();
  };

  const deleteOverride = async (date: string) => {
    if (!restaurantId) return;
    await supabase.from("daily_overrides").delete().eq("restaurant_id", restaurantId).eq("date", date);
    await fetchOverrides();
  };

  return { overrides, loading, upsertOverride, deleteOverride, refetch: fetchOverrides };
};
