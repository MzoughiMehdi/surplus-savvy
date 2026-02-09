import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Star, ShoppingBag, Loader2, Sparkles, Package, Palette, AlertTriangle, ClipboardList, Leaf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Offer } from "@/hooks/useOffers";
import StarRating from "@/components/StarRating";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface OfferDetailProps {
  offer: Offer;
  onBack: () => void;
  dynamicRating?: { avg: number; count: number; avgQuality?: number | null; avgQuantity?: number | null; avgPresentation?: number | null };
}

const OfferDetail = ({ offer, onBack, dynamicRating }: OfferDetailProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reserving, setReserving] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);

  // Geocode restaurant address
  useEffect(() => {
    if (!offer.restaurantAddress) { setGeoFailed(true); return; }
    const controller = new AbortController();
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(offer.restaurantAddress)}&format=json&limit=1`, {
      headers: { "Accept-Language": "fr" },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        else setGeoFailed(true);
      })
      .catch(() => setGeoFailed(true));
    return () => controller.abort();
  }, [offer.restaurantAddress]);

  // Render Leaflet map
  useEffect(() => {
    if (!coords || !mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: coords,
      zoom: 16,
      dragging: false,
      scrollWheelZoom: false,
      zoomControl: false,
      doubleClickZoom: false,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    L.marker(coords, {
      icon: L.divIcon({
        className: "",
        html: `<div style="background:#16a34a;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [coords]);

  const handleReserve = () => {
    if (!user) { toast.error("Connectez-vous pour réserver"); return; }
    if (offer.itemsLeft <= 0) { toast.error("Cette offre n'est plus disponible"); return; }
    const params = new URLSearchParams({
      offerId: offer.id,
      offerTitle: offer.title,
      amount: offer.discountedPrice.toString(),
      restaurantId: offer.restaurantId || "",
    });
    navigate(`/checkout?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in-up min-h-screen bg-background pb-28">
      {/* Hero image */}
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
        {/* Restaurant info */}
        <div className="flex items-center gap-3">
          <img src={offer.restaurantImage} alt={offer.restaurantName} className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
          <div>
            <h2 className="text-base font-semibold text-foreground">{offer.restaurantName}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {(dynamicRating?.count ?? 0) > 0 && (
                <>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-medium text-foreground">{dynamicRating?.avg}</span>
                  </div>
                  <span>({dynamicRating?.count} avis)</span>
                  <span>·</span>
                </>
              )}
              <div className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {offer.restaurantAddress || "À proximité"}
              </div>
            </div>
          </div>
        </div>

        {/* Rating breakdown */}
        {(dynamicRating?.count ?? 0) > 0 && (dynamicRating?.avgQuality != null || dynamicRating?.avgQuantity != null || dynamicRating?.avgPresentation != null) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {dynamicRating?.avgQuality != null && (
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Qualité</span>
                <StarRating value={Math.round(dynamicRating.avgQuality)} readonly size="sm" />
              </div>
            )}
            {dynamicRating?.avgQuantity != null && (
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Package className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Quantité</span>
                <StarRating value={Math.round(dynamicRating.avgQuantity)} readonly size="sm" />
              </div>
            )}
            {dynamicRating?.avgPresentation != null && (
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Présentation</span>
                <StarRating value={Math.round(dynamicRating.avgPresentation)} readonly size="sm" />
              </div>
            )}
          </div>
        )}

        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">🎁 {offer.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Un assortiment surprise des meilleurs produits du jour. Le contenu varie chaque jour !</p>

        {/* Pickup window */}
        <div className="mt-5 rounded-xl bg-eco-light p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Créneau de retrait
          </div>
          <p className="mt-1 text-lg font-bold text-primary">
            Aujourd'hui, {offer.pickupStart} – {offer.pickupEnd}
          </p>
        </div>

        {/* Price block */}
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

        {/* === NEW SECTIONS === */}

        {/* 1. Mini map */}
        <div className="mt-4 rounded-xl bg-secondary p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            Localisation du restaurant
          </div>
          {coords ? (
            <div ref={mapRef} className="h-40 w-full rounded-lg overflow-hidden" />
          ) : geoFailed ? (
           <p className="text-xs text-muted-foreground">{offer.restaurantAddress || "Adresse non disponible"}</p>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {offer.restaurantAddress && (
            <p className="mt-2 text-xs text-muted-foreground">{offer.restaurantAddress}</p>
          )}
        </div>

        {/* 2. Collection instructions */}
        <div className="mt-4 rounded-xl bg-secondary p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Instructions de collecte
          </div>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Présentez votre confirmation de réservation au commerçant
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Respectez le créneau de retrait indiqué
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Le contenu du lot peut varier selon les invendus du jour
            </li>
          </ul>
        </div>

        {/* 3. Allergen warning (compact) */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Le contenu de ce lot varie chaque jour. Le restaurant ne peut garantir l'absence d'allergènes. En cas d'allergie, contactez directement le commerçant.
          </p>
        </div>

        {/* 4. Packaging reminder */}
        <div className="mt-4 rounded-xl bg-eco-light p-4">
          <div className="flex items-start gap-3">
            <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Pensez à votre emballage</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Apportez votre propre sac ou contenant pour récupérer votre lot. Ensemble, réduisons les emballages !
              </p>
            </div>
          </div>
        </div>

        {/* Stock counter */}
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <span>
            Plus que <strong className="text-accent">{offer.itemsLeft}</strong> lots – dépêchez-vous !
          </span>
        </div>
      </div>

      {/* Reserve button */}
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
