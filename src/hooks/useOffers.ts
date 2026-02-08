import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Offer {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  restaurantAddress: string;
  category: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  pickupStart: string;
  pickupEnd: string;
  itemsLeft: number;
  image: string;
}

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("offers")
      .select("*, restaurants(name, image_url, address)")
      .eq("is_active", true)
      .gt("items_left", 0)
      .eq("date", today)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching offers:", error);
      setLoading(false);
      return;
    }

    const mapped: Offer[] = (data ?? []).map((o: any) => ({
      id: o.id,
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurants?.name ?? "Restaurant",
      restaurantImage: o.restaurants?.image_url ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop",
      restaurantAddress: o.restaurants?.address ?? "",
      category: o.category ?? "meals",
      title: o.title,
      description: o.description ?? "",
      originalPrice: Number(o.original_price),
      discountedPrice: Number(o.discounted_price),
      pickupStart: o.pickup_start?.slice(0, 5) ?? "",
      pickupEnd: o.pickup_end?.slice(0, 5) ?? "",
      itemsLeft: o.items_left,
      image: o.image_url ?? o.restaurants?.image_url ?? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    }));

    setOffers(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return { offers, loading, refetch: fetchOffers };
};

export const categories = [
  { id: "all", label: "Tout", icon: "🍽️" },
  { id: "meals", label: "Repas", icon: "🥘" },
  { id: "bakery", label: "Boulangerie", icon: "🥐" },
  { id: "sushi", label: "Sushi", icon: "🍣" },
  { id: "grocery", label: "Épicerie", icon: "🥬" },
  { id: "dessert", label: "Desserts", icon: "🍰" },
];
