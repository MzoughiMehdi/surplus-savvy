import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReviewRatings {
  rating: number;
  rating_quality: number;
  rating_quantity: number;
  rating_presentation: number;
}

export const useSubmitReview = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (
    reservationId: string,
    restaurantId: string,
    quality: number,
    quantity: number,
    presentation: number,
  ) => {
    if (!user) { toast.error("Connectez-vous pour noter"); return false; }
    const globalRating = Math.round((quality + quantity + presentation) / 3);
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      reservation_id: reservationId,
      rating: globalRating,
      rating_quality: quality,
      rating_quantity: quantity,
      rating_presentation: presentation,
    } as any);
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("Vous avez déjà noté cette commande");
      else toast.error(error.message);
      return false;
    }
    toast.success("Merci pour votre note !");
    return true;
  };

  return { submitReview, submitting };
};

export const useRestaurantRating = (restaurantId: string | undefined) => {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [avgQuality, setAvgQuality] = useState<number | null>(null);
  const [avgQuantity, setAvgQuantity] = useState<number | null>(null);
  const [avgPresentation, setAvgPresentation] = useState<number | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    supabase
      .rpc("get_restaurant_rating", { p_restaurant_id: restaurantId })
      .then(({ data }: any) => {
        if (data && data.length > 0 && data[0].avg_rating !== null) {
          setAvg(Number(data[0].avg_rating));
          setCount(Number(data[0].review_count));
          setAvgQuality(data[0].avg_quality != null ? Number(data[0].avg_quality) : null);
          setAvgQuantity(data[0].avg_quantity != null ? Number(data[0].avg_quantity) : null);
          setAvgPresentation(data[0].avg_presentation != null ? Number(data[0].avg_presentation) : null);
        }
      });
  }, [restaurantId]);

  return { avg, count, avgQuality, avgQuantity, avgPresentation };
};

export const useUserReviewForReservation = (reservationId: string | undefined) => {
  const { user } = useAuth();
  const [review, setReview] = useState<ReviewRatings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !reservationId) { setLoading(false); return; }
    supabase
      .from("reviews")
      .select("rating, rating_quality, rating_quantity, rating_presentation")
      .eq("reservation_id", reservationId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setReview(data);
        setLoading(false);
      });
  }, [user, reservationId]);

  return { review, loading, setReview };
};
