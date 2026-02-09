import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FavRestaurant {
  restaurant_id: string;
  restaurants: {
    name: string;
    image_url: string | null;
    category: string;
    address: string;
  } | null;
}

const FavoritesPage = () => {
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite, loading: favLoading } = useFavorites();

  const { data: favRestaurants = [], isLoading } = useQuery({
    queryKey: ["favorite-restaurants", Array.from(favoriteIds)],
    queryFn: async () => {
      if (favoriteIds.size === 0) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("restaurant_id, restaurants(name, image_url, category, address)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as unknown as FavRestaurant[]) ?? [];
    },
    enabled: !!user && !favLoading && favoriteIds.size > 0,
  });

  const loading = favLoading || isLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Favoris</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {favoriteIds.size} restaurant{favoriteIds.size > 1 ? "s" : ""} sauvegardé{favoriteIds.size > 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : favoriteIds.size === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold text-foreground">
            Aucun favori pour l'instant
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez des offres à vos favoris pour les retrouver facilement
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-5 pt-2">
          {favRestaurants.map((fav) => (
            <div
              key={fav.restaurant_id}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm"
            >
              <img
                src={fav.restaurants?.image_url || "/placeholder.svg"}
                alt={fav.restaurants?.name ?? ""}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {fav.restaurants?.name}
                </p>
                <p className="text-xs text-muted-foreground">{fav.restaurants?.category}</p>
                <p className="truncate text-xs text-muted-foreground">{fav.restaurants?.address}</p>
              </div>
              <button
                onClick={() => toggleFavorite(fav.restaurant_id)}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
                aria-label="Retirer des favoris"
              >
                <Heart className="h-5 w-5 fill-destructive text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
