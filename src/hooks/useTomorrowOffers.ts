import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Offer } from "@/hooks/useOffers";

export const useTomorrowOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // 1. Fetch active configs with restaurant info
      const { data: configs, error: configErr } = await supabase
        .from("surprise_bag_config")
        .select("id, restaurant_id, base_price, daily_quantity, pickup_start, pickup_end, image_url, restaurants(name, image_url, address, postal_code, city, latitude, longitude, category, status)")
        .eq("is_active", true);

      if (configErr || !configs) {
        console.error("Error fetching tomorrow configs:", configErr);
        setLoading(false);
        return;
      }

      // 2. Fetch daily overrides for tomorrow
      const { data: overrides } = await supabase
        .from("daily_overrides")
        .select("restaurant_id, is_suspended, quantity, pickup_start, pickup_end")
        .eq("date", tomorrowStr);

      const overrideMap = new Map(
        (overrides ?? []).map((o) => [o.restaurant_id, o])
      );

      // 3. Count existing reservations for tomorrow per config
      const { data: reservationCounts } = await supabase
        .from("reservations")
        .select("config_id")
        .eq("pickup_date", tomorrowStr)
        .not("config_id", "is", null)
        .neq("status", "cancelled");

      const countByConfig: Record<string, number> = {};
      (reservationCounts ?? []).forEach((r: any) => {
        countByConfig[r.config_id] = (countByConfig[r.config_id] || 0) + 1;
      });

      // 4. Build offer list
      const mapped: Offer[] = configs
        .filter((c: any) => {
          const rest = c.restaurants;
          if (!rest || rest.status !== "approved") return false;
          const override = overrideMap.get(c.restaurant_id);
          if (override?.is_suspended) return false;
          return true;
        })
        .map((c: any) => {
          const rest = c.restaurants;
          const override = overrideMap.get(c.restaurant_id);
          const quantity = override?.quantity ?? c.daily_quantity;
          const reserved = countByConfig[c.id] || 0;
          const itemsLeft = Math.max(0, quantity - reserved);
          const pickupStart = (override?.pickup_start ?? c.pickup_start)?.slice(0, 5) ?? "18:00";
          const pickupEnd = (override?.pickup_end ?? c.pickup_end)?.slice(0, 5) ?? "20:00";
          const discountedPrice = Number((c.base_price * 0.4).toFixed(2));

          return {
            id: `tomorrow-${c.id}`,
            restaurantId: c.restaurant_id,
            restaurantName: rest.name ?? "Restaurant",
            restaurantImage: rest.image_url ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop",
            restaurantAddress: [rest.address, [rest.postal_code, rest.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
            category: rest.category ?? "meals",
            title: "Lot Anti-Gaspi",
            description: "Un assortiment surprise de nos meilleurs produits du jour",
            originalPrice: c.base_price,
            discountedPrice,
            pickupStart,
            pickupEnd,
            itemsLeft,
            image: c.image_url ?? rest.image_url ?? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
            latitude: rest.latitude ?? null,
            longitude: rest.longitude ?? null,
            isTomorrow: true,
            configId: c.id,
            pickupDate: tomorrowStr,
          } as Offer;
        })
        .filter((o: Offer) => o.itemsLeft > 0);

      setOffers(mapped);
      setLoading(false);
    };

    fetch();
  }, []);

  return { tomorrowOffers: offers, loadingTomorrow: loading };
};
