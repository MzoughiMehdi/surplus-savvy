import { useState, useMemo, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import NotificationBell from "@/components/NotificationBell";
import OfferCard from "@/components/OfferCard";
import OfferDetail from "@/components/OfferDetail";
import BottomNav from "@/components/BottomNav";
import ImpactBanner from "@/components/ImpactBanner";
import MapView from "@/components/MapView";
import ExplorePage from "@/pages/ExplorePage";
import FavoritesPage from "@/pages/FavoritesPage";
import ProfilePage from "@/pages/ProfilePage";
import OrdersPage from "@/pages/OrdersPage";
import { mockOffers, type Offer } from "@/data/mockOffers";
import { useAllRestaurantRatings } from "@/hooks/useAllRestaurantRatings";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showMap, setShowMap] = useState(false);
  const { ratings } = useAllRestaurantRatings();

  // Handle Stripe payment return — navigate to orders tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setActiveTab("orders");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const filteredOffers = useMemo(
    () =>
      selectedCategory === "all"
        ? mockOffers
        : mockOffers.filter((o) => o.category === selectedCategory),
    [selectedCategory]
  );

  if (selectedOffer) {
    return <OfferDetail offer={selectedOffer} onBack={() => setSelectedOffer(null)} dynamicRating={ratings[selectedOffer.restaurantName]} />;
  }

  if (showMap) {
    return (
      <MapView
        onBack={() => setShowMap(false)}
        onSelectOffer={(offer) => {
          setShowMap(false);
          setSelectedOffer(offer);
        }}
      />
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "explore":
        return <ExplorePage />;
      case "orders":
        return <OrdersPage />;
      case "favorites":
        return <FavoritesPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return (
          <>
            <HeroSection onExplore={() => setShowMap(true)} />
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
                    dynamicRating={ratings[offer.restaurantName]}
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
      {/* Floating notification bell */}
      <div className="fixed right-4 top-4 z-50">
        <NotificationBell />
      </div>
      {renderTab()}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
