import { Clock, Star, ShoppingBag, MapPin, Heart } from "lucide-react";
import type { Offer } from "@/hooks/useOffers";

interface OfferCardProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
  index: number;
  dynamicRating?: { avg: number; count: number };
  distanceKm?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (restaurantId: string) => void;
}

const getStockColor = (itemsLeft: number) => {
  if (itemsLeft >= 3) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (itemsLeft === 2) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
};

const formatPickupTime = (time: string) => time.replace(":", "h");

const getUrgencyInfo = (pickupStart: string, pickupEnd: string): { type: "starting" | "ending"; minutes: number } | null => {
  const now = new Date();
  const [sh, sm] = pickupStart.split(":").map(Number);
  const [eh, em] = pickupEnd.split(":").map(Number);
  const start = new Date();
  start.setHours(sh, sm, 0, 0);
  const end = new Date();
  end.setHours(eh, em, 0, 0);

  if (now >= start && now < end) {
    const remaining = Math.round((end.getTime() - now.getTime()) / 60000);
    if (remaining <= 60) return { type: "ending", minutes: remaining };
    return null;
  }

  if (now < start) {
    const until = Math.round((start.getTime() - now.getTime()) / 60000);
    if (until <= 60) return { type: "starting", minutes: until };
  }

  return null;
};

const OfferCard = ({ offer, onClick, index, dynamicRating, distanceKm, isFavorite, onToggleFavorite }: OfferCardProps) => {
  const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);
  const rating = dynamicRating?.avg ?? 0;
  const reviewCount = dynamicRating?.count ?? 0;
  const urgency = getUrgencyInfo(offer.pickupStart, offer.pickupEnd);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(offer.restaurantId);
  };

  return (
    <button
      onClick={() => onClick(offer)}
      className="group w-full animate-fade-in-up text-left"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="overflow-hidden rounded-2xl glass-card shadow-sm transition-all hover:shadow-lg active:scale-[0.98]">
        <div className="relative">
          <img
            src={offer.image}
            alt={offer.title}
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <div className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
              -{discount}%
            </div>
            {distanceKm != null && (
              <div className="flex items-center gap-1 rounded-xl bg-card/90 px-2.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm shadow">
                <MapPin className="h-3 w-3 text-primary" />
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
              </div>
            )}
          </div>

          {onToggleFavorite && (
            <button
              onClick={handleFavorite}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm shadow-md transition-transform active:scale-90"
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
              />
            </button>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <img
                src={offer.restaurantImage}
                alt={offer.restaurantName}
                className="h-8 w-8 rounded-full border-2 border-card object-cover shadow"
              />
              <span className="text-xs font-semibold text-primary-foreground drop-shadow">{offer.restaurantName}</span>
            </div>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-card/90 px-2 py-1 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span className="text-xs font-bold text-foreground">{rating}</span>
                <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold leading-snug text-foreground">
            🎁 {offer.title}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            {/* Pickup slot badge */}
            <div className="flex items-center gap-1.5">
            {urgency?.type === "ending" ? (
                <div className="flex items-center gap-1 rounded-lg bg-destructive/15 px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-bold text-destructive">
                    Encore {urgency.minutes}min
                  </span>
                </div>
              ) : urgency?.type === "starting" ? (
                <div className="flex items-center gap-1 rounded-lg bg-accent/15 px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-accent-foreground" />
                  <span className="text-xs font-bold text-accent-foreground">
                    Dans {urgency.minutes}min
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {formatPickupTime(offer.pickupStart)} – {formatPickupTime(offer.pickupEnd)}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground line-through">
                €{offer.originalPrice.toFixed(2)}
              </span>
              <span className="text-base font-bold text-primary">
                €{offer.discountedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Stock badge */}
          <div className="mt-2.5 flex items-center">
            <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${getStockColor(offer.itemsLeft)}`}>
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">
                {offer.itemsLeft} panier{offer.itemsLeft > 1 ? "s" : ""} restant{offer.itemsLeft > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default OfferCard;
