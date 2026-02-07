import { useState, useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import OfferCard from "@/components/OfferCard";
import OfferDetail from "@/components/OfferDetail";
import BottomNav from "@/components/BottomNav";
import ImpactBanner from "@/components/ImpactBanner";
import ExplorePage from "@/pages/ExplorePage";
import FavoritesPage from "@/pages/FavoritesPage";
import ProfilePage from "@/pages/ProfilePage";
import { mockOffers, type Offer } from "@/data/mockOffers";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const filteredOffers = useMemo(
    () =>
      selectedCategory === "all"
        ? mockOffers
        : mockOffers.filter((o) => o.category === selectedCategory),
    [selectedCategory]
  );

  if (selectedOffer) {
    return <OfferDetail offer={selectedOffer} onBack={() => setSelectedOffer(null)} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "explore":
        return <ExplorePage />;
      case "favorites":
        return <FavoritesPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return (
          <>
            <HeroSection onExplore={() => setActiveTab("explore")} />
            <ImpactBanner />
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
            <div className="px-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Disponible maintenant
                </h2>
                <span className="text-sm font-medium text-muted-foreground">
                  {filteredOffers.length} offres
                </span>
              </div>
              <div className="grid gap-4">
                {filteredOffers.map((offer, i) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onClick={setSelectedOffer}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {renderTab()}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
