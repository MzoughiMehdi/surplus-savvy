import { useState } from "react";
import { ArrowLeft, Clock, MapPin, Star, ShoppingBag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Offer } from "@/data/mockOffers";

interface OfferDetailProps {
  offer: Offer;
  onBack: () => void;
  dynamicRating?: { avg: number; count: number };
}

const OfferDetail = ({ offer, onBack, dynamicRating }: OfferDetailProps) => {
  const { user } = useAuth();
  const [reserving, setReserving] = useState(false);

  const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);

  const handleReserve = async () => {
    if (!user) {
      toast.error("Connectez-vous pour réserver");
      return;
    }
    if (offer.itemsLeft <= 0) {
      toast.error("Cette offre n'est plus disponible");
      return;
    }

    setReserving(true);

    try {
      // 1. First create the reservation in DB
      // Find a matching DB offer or create one
      let dbOfferId: string;
      let dbRestaurantId: string;

      const { data: dbOffers } = await supabase
        .from("offers")
        .select("id, restaurant_id")
        .eq("is_active", true)
        .limit(1);

      if (dbOffers && dbOffers.length > 0) {
        dbOfferId = dbOffers[0].id;
        dbRestaurantId = dbOffers[0].restaurant_id;
      } else {
        const { data: restaurants } = await supabase
          .from("restaurants")
          .select("id")
          .eq("status", "approved")
          .limit(1);

        if (!restaurants || restaurants.length === 0) {
          toast.error("Aucun restaurant disponible");
          setReserving(false);
          return;
        }

        const { data: newOffer, error: offerError } = await supabase.from("offers").insert({
          restaurant_id: restaurants[0].id,
          title: offer.title,
          description: offer.description,
          original_price: offer.originalPrice,
          discounted_price: offer.discountedPrice,
          quantity: offer.itemsLeft,
          items_left: offer.itemsLeft,
          pickup_start: offer.pickupStart,
          pickup_end: offer.pickupEnd,
          category: offer.category,
        }).select().single();

        if (offerError || !newOffer) {
          toast.error("Erreur lors de la réservation");
          setReserving(false);
          return;
        }
        dbOfferId = newOffer.id;
        dbRestaurantId = restaurants[0].id;
      }

      // Create reservation
      const { error: resError } = await supabase
        .from("reservations")
        .insert({ user_id: user.id, offer_id: dbOfferId, restaurant_id: dbRestaurantId });

      if (resError) {
        toast.error(resError.message);
        setReserving(false);
        return;
      }

      // 2. Then redirect to Stripe payment (same tab)
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
        body: {
          offerId: offer.id,
          offerTitle: offer.title,
          amount: offer.discountedPrice,
        },
      });

      if (paymentError || !paymentData?.url) {
        toast.error("Erreur lors du paiement");
        setReserving(false);
        return;
      }

      // Redirect to Stripe checkout on same tab — reservation already saved
      window.location.href = paymentData.url;
    } catch {
      toast.error("Erreur inattendue");
    }

    setReserving(false);
  };


  return (
    <div className="animate-fade-in-up min-h-screen bg-background pb-28">
      <div className="relative">
        <img src={offer.image} alt={offer.title} className="h-64 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <button
          onClick={onBack}
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform active:scale-90"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="absolute bottom-4 left-4 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
          -{discount}%
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <img
            src={offer.restaurantImage}
            alt={offer.restaurantName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
          />
          <div>
            <h2 className="text-base font-semibold text-foreground">{offer.restaurantName}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium text-foreground">{dynamicRating?.avg ?? offer.rating}</span>
              </div>
              <span>({dynamicRating?.count ?? offer.reviewCount} avis)</span>
              <span>·</span>
              <div className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {offer.distance}
              </div>
            </div>
          </div>
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">{offer.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{offer.description}</p>

        <div className="mt-5 rounded-xl bg-eco-light p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Créneau de retrait
          </div>
          <p className="mt-1 text-lg font-bold text-primary">
            Aujourd'hui, {offer.pickupStart} – {offer.pickupEnd}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-4">
          <div>
            <p className="text-xs text-muted-foreground">Prix original</p>
            <p className="text-sm text-muted-foreground line-through">€{offer.originalPrice.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vous payez</p>
            <p className="text-2xl font-bold text-primary">€{offer.discountedPrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <span>
            Plus que <strong className="text-accent">{offer.itemsLeft}</strong> paniers – dépêchez-vous !
          </span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-sm">
        <button
          onClick={handleReserve}
          disabled={reserving || offer.itemsLeft <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-center text-base font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {reserving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Réservation en cours...
            </>
          ) : (
            `Réserver pour €${offer.discountedPrice.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
};

export default OfferDetail;
