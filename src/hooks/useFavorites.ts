import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("restaurant_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setFavoriteIds(new Set(data.map((f) => f.restaurant_id)));
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  const isFavorite = useCallback(
    (restaurantId: string) => favoriteIds.has(restaurantId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (restaurantId: string) => {
      if (!user) {
        toast.error("Connectez-vous pour ajouter des favoris");
        return;
      }

      const wasFav = favoriteIds.has(restaurantId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(restaurantId);
        else next.add(restaurantId);
        return next;
      });

      if (wasFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurantId);

        if (error) {
          // Revert
          setFavoriteIds((prev) => new Set(prev).add(restaurantId));
          toast.error("Erreur lors de la suppression du favori");
        } else {
          toast("Retiré des favoris");
        }
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, restaurant_id: restaurantId });

        if (error) {
          // Revert
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(restaurantId);
            return next;
          });
          toast.error("Erreur lors de l'ajout aux favoris");
        } else {
          toast.success("Ajouté aux favoris ❤️");
        }
      }
    },
    [user, favoriteIds]
  );

  return { favoriteIds, isFavorite, toggleFavorite, loading };
}
