import { useState, useMemo } from "react";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import OfferCard from "@/components/OfferCard";
import OfferDetail from "@/components/OfferDetail";
import TomorrowOffersSection from "@/components/TomorrowOffersSection";
import type { Offer } from "@/hooks/useOffers";
import { useAllRestaurantRatings } from "@/hooks/useAllRestaurantRatings";
import { useUserLocation, getDistanceKm } from "@/hooks/useUserLocation";

interface ExplorePageProps {
  offers: Offer[];
  loadingOffers: boolean;
  isFavorite: (restaurantId: string) => boolean;
  onToggleFavorite: (restaurantId: string) => void;
  tomorrowOffers?: Offer[];
}

const ExplorePage = ({ offers, loadingOffers, isFavorite, onToggleFavorite, tomorrowOffers = [] }: ExplorePageProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const { ratings } = useAllRestaurantRatings();
  const userLocation = useUserLocation();

  const getOfferDistance = (offer: Offer) => {
    if (!userLocation.latitude || !userLocation.longitude || !offer.latitude || !offer.longitude) return undefined;
    return getDistanceKm(userLocation.latitude, userLocation.longitude, offer.latitude, offer.longitude);
  };

  const filteredOffers = useMemo(() => {
    let results = selectedCategory === "all"
      ? offers
      : offers.filter((o) => o.category === selectedCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.restaurantName.toLowerCase().includes(q)
      );
    }

    return [...results].sort((a, b) => {
      if (sortBy === "price") return a.discountedPrice - b.discountedPrice;
      const rA = ratings[a.restaurantName]?.avg ?? 0;
      const rB = ratings[b.restaurantName]?.avg ?? 0;
      return rB - rA;
    });
  }, [selectedCategory, search, sortBy, ratings, offers]);

  if (selectedOffer) {
    return <OfferDetail offer={selectedOffer} onBack={() => setSelectedOffer(null)} dynamicRating={ratings[selectedOffer.restaurantName]} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Trouvez les meilleures offres autour de vous</p>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un restaurant ou un plat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" />
            À proximité
          </button>
          <div className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price" | "rating")}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="price">Prix</option>
              <option value="rating">Note</option>
            </select>
          </div>
        </div>
      </div>

      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      <div className="px-5">
        <p className="mb-3 text-sm text-muted-foreground">
          {filteredOffers.length} résultat{filteredOffers.length > 1 ? "s" : ""}
        </p>
        {loadingOffers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {filteredOffers.map((offer, i) => (
                <OfferCard key={offer.id} offer={offer} onClick={setSelectedOffer} index={i} dynamicRating={ratings[offer.restaurantName]} distanceKm={getOfferDistance(offer)} isFavorite={isFavorite(offer.restaurantId)} onToggleFavorite={onToggleFavorite} />
              ))}
              {filteredOffers.length === 0 && tomorrowOffers.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-4xl">🔍</p>
                  <p className="mt-3 font-display text-lg font-semibold text-foreground">Aucun résultat</p>
                  <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier vos filtres</p>
                </div>
              )}
            </div>
            <TomorrowOffersSection offers={tomorrowOffers} onSelectOffer={setSelectedOffer} />
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
