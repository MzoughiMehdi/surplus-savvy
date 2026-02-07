import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantRating {
  avg: number;
  count: number;
}

/**
 * Fetches all restaurant average ratings in a single query.
 * Returns a map keyed by restaurant name for easy lookup with mock offers.
 */
export const useAllRestaurantRatings = () => {
  const [ratings, setRatings] = useState<Record<string, RestaurantRating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating, restaurant_id, restaurants:restaurant_id(name)")

      if (data && data.length > 0) {
        const grouped: Record<string, number[]> = {};
        for (const row of data) {
          const name = (row.restaurants as any)?.name;
          if (!name) continue;
          if (!grouped[name]) grouped[name] = [];
          grouped[name].push(row.rating);
        }
        const result: Record<string, RestaurantRating> = {};
        for (const [name, vals] of Object.entries(grouped)) {
          const sum = vals.reduce((a, b) => a + b, 0);
          result[name] = {
            avg: Math.round((sum / vals.length) * 10) / 10,
            count: vals.length,
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
