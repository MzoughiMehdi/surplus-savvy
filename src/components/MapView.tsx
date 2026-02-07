import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ArrowLeft, Navigation } from "lucide-react";
import type { Offer } from "@/hooks/useOffers";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  offers: Offer[];
  onBack: () => void;
  onSelectOffer: (offer: Offer) => void;
}

const MapView = ({ offers, onBack, onSelectOffer }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  // Generate stable pseudo-random positions per offer
  const offerLocations = offers.map((offer, i) => ({
    ...offer,
    lat: 48.8566 + Math.sin(i * 1.8) * 0.012,
    lng: 2.3522 + Math.cos(i * 1.5) * 0.015,
  }));

  const flyToUser = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          if (mapRef.current) {
            const userIcon = L.divIcon({
              html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(152,45%,28%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
              className: "",
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            });
            L.marker(latlng, { icon: userIcon })
              .addTo(mapRef.current)
              .bindPopup("<b>Vous êtes ici</b>");
            mapRef.current.flyTo(latlng, 14, { duration: 1.5 });
          }
          setLocating(false);
        },
        () => {
          if (mapRef.current) mapRef.current.flyTo(defaultCenter, 14, { duration: 1.5 });
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    offerLocations.forEach((r) => {
      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(16,65%,55%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;">🍽️</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const popupContent = document.createElement("div");
      popupContent.style.minWidth = "200px";
      popupContent.innerHTML = `
        <img src="${r.image}" alt="${r.title}" style="height:96px;width:100%;border-radius:8px;object-fit:cover;" />
        <p style="margin-top:8px;font-size:14px;font-weight:700;">${r.restaurantName}</p>
        <p style="font-size:12px;color:#666;">${r.title}</p>
        <div style="margin-top:4px;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:12px;color:#999;text-decoration:line-through;">€${r.originalPrice.toFixed(2)}</span>
          <span style="font-size:14px;font-weight:700;color:hsl(152,45%,28%);">€${r.discountedPrice.toFixed(2)}</span>
        </div>
      `;
      const btn = document.createElement("button");
      btn.textContent = "Voir l'offre";
      btn.style.cssText = "margin-top:8px;width:100%;padding:8px;border-radius:8px;background:hsl(152,45%,28%);color:white;font-size:12px;font-weight:700;border:none;cursor:pointer;";
      btn.addEventListener("click", () => onSelectOffer(r));
      popupContent.appendChild(btn);

      L.marker([r.lat, r.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    mapRef.current = map;
    flyToUser();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [offers]);

  return (
    <div className="relative h-screen w-full">
      <div ref={containerRef} className="h-full w-full" style={{ zIndex: 0 }} />

      <button
        onClick={onBack}
        className="absolute left-4 top-12 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur-sm transition-transform active:scale-90"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>

      <button
        onClick={flyToUser}
        disabled={locating}
        className="absolute bottom-28 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-90"
      >
        <Navigation className={`h-5 w-5 text-primary-foreground ${locating ? "animate-pulse" : ""}`} />
      </button>

      <div className="absolute bottom-16 left-4 right-4 z-[1000] rounded-2xl bg-background/95 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold text-foreground">
          🍽️ {offerLocations.length} offres à proximité
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Appuyez sur un marqueur pour voir l'offre
        </p>
      </div>
    </div>
  );
};

export default MapView;
