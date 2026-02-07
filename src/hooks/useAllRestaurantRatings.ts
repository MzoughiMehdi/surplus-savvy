import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantRating {
  avg: number;
  count: number;
}

/**
 * Fetches all restaurant average ratings via an aggregate RPC (no user_id exposed).
 * Returns a map keyed by restaurant name for easy lookup with mock offers.
 */
export const useAllRestaurantRatings = () => {
  const [ratings, setRatings] = useState<Record<string, RestaurantRating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await supabase.rpc("get_all_restaurant_ratings");

      if (data && data.length > 0) {
        const result: Record<string, RestaurantRating> = {};
        for (const row of data) {
          result[row.restaurant_name] = {
            avg: Number(row.avg_rating),
            count: Number(row.review_count),
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
