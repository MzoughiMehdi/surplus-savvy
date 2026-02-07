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
import { useOffers, type Offer } from "@/hooks/useOffers";
import { useAllRestaurantRatings } from "@/hooks/useAllRestaurantRatings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showMap, setShowMap] = useState(false);
  const { offers, loading, refetch } = useOffers();
  const { ratings } = useAllRestaurantRatings();
  const { user } = useAuth();

  // Handle Stripe payment return — create reservation AFTER successful payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const offerId = params.get("offer_id");
    const restaurantId = params.get("restaurant_id");

    if (paymentStatus === "success" && offerId && user) {
      // Create reservation only after confirmed payment
      const createReservation = async () => {
        const { error } = await supabase
          .from("reservations")
          .insert({
            user_id: user.id,
            offer_id: offerId,
            restaurant_id: restaurantId || "",
          });

        if (error) {
          console.error("Error creating reservation:", error);
          toast.error("Erreur lors de la création de la réservation");
        } else {
          toast.success("Paiement confirmé ! Votre réservation est prête.");
          refetch(); // Refresh offers to update stock
        }

        setActiveTab("orders");
        window.history.replaceState({}, "", window.location.pathname);
      };

      createReservation();
    } else if (paymentStatus === "cancelled") {
      toast.info("Paiement annulé");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user]);

  const filteredOffers = useMemo(
    () =>
      selectedCategory === "all"
        ? offers
        : offers.filter((o) => o.category === selectedCategory),
    [selectedCategory, offers]
  );

  if (selectedOffer) {
    return <OfferDetail offer={selectedOffer} onBack={() => setSelectedOffer(null)} dynamicRating={ratings[selectedOffer.restaurantName]} />;
  }

  if (showMap) {
    return (
      <MapView
        offers={offers}
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
        return <ExplorePage offers={offers} loadingOffers={loading} />;
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
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-4xl">🍽️</p>
                  <p className="mt-3 font-display text-lg font-semibold text-foreground">Aucune offre disponible</p>
                  <p className="mt-1 text-sm text-muted-foreground">Revenez plus tard pour découvrir de nouvelles offres</p>
                </div>
              ) : (
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
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="fixed right-4 top-4 z-50">
        <NotificationBell />
      </div>
      {renderTab()}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
