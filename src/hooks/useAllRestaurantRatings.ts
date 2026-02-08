import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantRating {
  avg: number;
  count: number;
  avgQuality: number | null;
  avgQuantity: number | null;
  avgPresentation: number | null;
}

export const useAllRestaurantRatings = () => {
  const [ratings, setRatings] = useState<Record<string, RestaurantRating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await (supabase.rpc as any)("get_all_restaurant_ratings");

      if (data && data.length > 0) {
        const result: Record<string, RestaurantRating> = {};
        for (const row of data) {
          result[row.restaurant_name] = {
            avg: Number(row.avg_rating),
            count: Number(row.review_count),
            avgQuality: row.avg_quality != null ? Number(row.avg_quality) : null,
            avgQuantity: row.avg_quantity != null ? Number(row.avg_quantity) : null,
            avgPresentation: row.avg_presentation != null ? Number(row.avg_presentation) : null,
          };
        }
        setRatings(result);
      }
      setLoading(false);
    };
    fetchRatings();
  }, []);

  return { ratings, loading };
};
