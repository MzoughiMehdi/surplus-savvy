import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useSubmitReview = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (reservationId: string, restaurantId: string, rating: number) => {
    if (!user) { toast.error("Connectez-vous pour noter"); return false; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      reservation_id: reservationId,
      rating,
    });
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

  useEffect(() => {
    if (!restaurantId) return;
    supabase
      .rpc("get_restaurant_rating", { p_restaurant_id: restaurantId })
      .then(({ data }) => {
        if (data && data.length > 0 && data[0].avg_rating !== null) {
          setAvg(Number(data[0].avg_rating));
          setCount(Number(data[0].review_count));
        }
      });
  }, [restaurantId]);

  return { avg, count };
};

export const useUserReviewForReservation = (reservationId: string | undefined) => {
  const { user } = useAuth();
  const [review, setReview] = useState<{ rating: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !reservationId) { setLoading(false); return; }
    supabase
      .from("reviews")
      .select("rating")
      .eq("reservation_id", reservationId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setReview(data);
        setLoading(false);
      });
  }, [user, reservationId]);

  return { review, loading, setReview };
};
