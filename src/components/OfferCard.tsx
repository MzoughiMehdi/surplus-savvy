import { Clock, Star } from "lucide-react";
import type { Offer } from "@/data/mockOffers";

interface OfferCardProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
  index: number;
}

const OfferCard = ({ offer, onClick, index }: OfferCardProps) => {
  const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);

  return (
    <button
      onClick={() => onClick(offer)}
      className="group w-full animate-fade-in-up text-left"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
        <div className="relative">
          <img
            src={offer.image}
            alt={offer.title}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
            -{discount}%
          </div>
          <div className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
            {offer.itemsLeft} left
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-2">
            <img
              src={offer.restaurantImage}
              alt={offer.restaurantName}
              className="h-7 w-7 rounded-full object-cover"
            />
            <span className="text-xs font-medium text-muted-foreground">{offer.restaurantName}</span>
            <div className="ml-auto flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="text-xs font-semibold text-foreground">{offer.rating}</span>
            </div>
          </div>

          <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground">
            {offer.title}
          </h3>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {offer.pickupStart} – {offer.pickupEnd}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground line-through">
                €{offer.originalPrice.toFixed(2)}
              </span>
              <span className="text-base font-bold text-primary">
                €{offer.discountedPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default OfferCard;
