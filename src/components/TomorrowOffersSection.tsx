import { CalendarClock, Clock, ShoppingBag, ChevronRight } from "lucide-react";
import type { Offer } from "@/hooks/useOffers";

interface TomorrowOffersSectionProps {
  offers: Offer[];
  onSelectOffer: (offer: Offer) => void;
}

const formatPickupTime = (time: string) => time.replace(":", "h");

const formatTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

const TomorrowOffersSection = ({ offers, onSelectOffer }: TomorrowOffersSectionProps) => {
  if (offers.length === 0) return null;

  return (
    <div className="mt-6 mb-4">
      {/* Header */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <CalendarClock className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Disponible demain
            </h2>
            <p className="text-xs text-muted-foreground capitalize">{formatTomorrowDate()}</p>
          </div>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
            {offers.length} offre{offers.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
        {offers.map((offer) => {
          const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);

          return (
            <button
              key={offer.id}
              onClick={() => onSelectOffer(offer)}
              className="group w-[260px] flex-shrink-0 snap-start text-left"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-accent/20 bg-card shadow-sm transition-all hover:shadow-md hover:border-accent/40 active:scale-[0.98]">
                {/* Image */}
                <div className="relative h-32">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

                  {/* Tomorrow badge */}
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground shadow-lg">
                    <CalendarClock className="h-3 w-3" />
                    Demain
                  </div>

                  {/* Discount badge */}
                  <div className="absolute right-2 top-2 rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-lg">
                    -{discount}%
                  </div>

                  {/* Restaurant info */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <img
                      src={offer.restaurantImage}
                      alt={offer.restaurantName}
                      className="h-6 w-6 rounded-full border-2 border-card object-cover shadow"
                    />
                    <span className="text-[11px] font-semibold text-primary-foreground drop-shadow">
                      {offer.restaurantName}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    🎁 {offer.title}
                  </h3>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5">
                      <Clock className="h-3 w-3 text-accent" />
                      <span className="text-[11px] font-medium text-accent">
                        {formatPickupTime(offer.pickupStart)} – {formatPickupTime(offer.pickupEnd)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-muted-foreground line-through">
                        €{offer.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        €{offer.discountedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShoppingBag className="h-3 w-3" />
                      <span className="font-medium">{offer.itemsLeft} restant{offer.itemsLeft > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[11px] font-medium text-accent">
                      Réserver <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TomorrowOffersSection;
