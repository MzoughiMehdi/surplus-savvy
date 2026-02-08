import { Clock, Star } from "lucide-react";
import type { Offer } from "@/hooks/useOffers";

interface OfferCardProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
  index: number;
  dynamicRating?: { avg: number; count: number };
}

const OfferCard = ({ offer, onClick, index, dynamicRating }: OfferCardProps) => {
  const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);
  const rating = dynamicRating?.avg ?? 0;
  const reviewCount = dynamicRating?.count ?? 0;

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

          <div className="absolute left-3 top-3 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
            -{discount}%
          </div>

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
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">
                {offer.pickupStart} – {offer.pickupEnd}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground line-through">
                €{offer.originalPrice.toFixed(2)}
              </span>
              <span className="text-base font-bold text-primary">
                €{offer.discountedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${Math.max(15, (offer.itemsLeft / 5) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {offer.itemsLeft} restant{offer.itemsLeft > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default OfferCard;
