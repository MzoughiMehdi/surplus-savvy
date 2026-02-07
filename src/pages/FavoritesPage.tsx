import { Heart } from "lucide-react";

const FavoritesPage = () => {
  // TODO: Implement real favorites with a DB table
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Favoris</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vos restaurants et offres sauvegardés</p>
      </div>

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
    </div>
  );
};

export default FavoritesPage;
