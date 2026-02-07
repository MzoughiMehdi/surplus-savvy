import { useState, useMemo } from "react";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import OfferCard from "@/components/OfferCard";
import OfferDetail from "@/components/OfferDetail";
import { mockOffers, type Offer } from "@/data/mockOffers";

const ExplorePage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [sortBy, setSortBy] = useState<"distance" | "price" | "rating">("distance");

  const filteredOffers = useMemo(() => {
    let results = selectedCategory === "all"
      ? mockOffers
      : mockOffers.filter((o) => o.category === selectedCategory);

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
      if (sortBy === "rating") return b.rating - a.rating;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });
  }, [selectedCategory, search, sortBy]);

  if (selectedOffer) {
    return <OfferDetail offer={selectedOffer} onBack={() => setSelectedOffer(null)} />;
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
              onChange={(e) => setSortBy(e.target.value as "distance" | "price" | "rating")}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="distance">Distance</option>
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
        <div className="grid gap-4">
          {filteredOffers.map((offer, i) => (
            <OfferCard key={offer.id} offer={offer} onClick={setSelectedOffer} index={i} />
          ))}
          {filteredOffers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-3 font-display text-lg font-semibold text-foreground">Aucun résultat</p>
              <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier vos filtres</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
