import { useState } from "react";
import { Heart } from "lucide-react";
import OfferCard from "@/components/OfferCard";
import OfferDetail from "@/components/OfferDetail";
import { mockOffers, type Offer } from "@/data/mockOffers";

const FavoritesPage = () => {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Simule des favoris avec les 2 premières offres
  const favorites = mockOffers.slice(0, 2);

  if (selectedOffer) {
    return <OfferDetail offer={selectedOffer} onBack={() => setSelectedOffer(null)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Favoris</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vos restaurants et offres sauvegardés</p>
      </div>

      {favorites.length > 0 ? (
        <div className="px-5 pt-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {favorites.length} favori{favorites.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4">
            {favorites.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} onClick={setSelectedOffer} index={i} />
            ))}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default FavoritesPage;
