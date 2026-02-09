import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ArrowLeft, Navigation } from "lucide-react";
import type { Offer } from "@/hooks/useOffers";
import { categories } from "@/hooks/useOffers";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  offers: Offer[];
  onBack: () => void;
  onSelectOffer: (offer: Offer) => void;
}

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const getCategoryLabel = (catId: string) => {
  const cat = categories.find((c) => c.id === catId);
  return cat ? `${cat.icon} ${cat.label}` : "🍽️ Repas";
};

const buildPhotoPin = (offer: Offer) => {
  const img = offer.restaurantImage;
  const price = `${offer.discountedPrice.toFixed(2)}€`;
  return L.divIcon({
    className: "",
    iconSize: [52, 62],
    iconAnchor: [26, 62],
    popupAnchor: [0, -58],
    html: `
      <div style="position:relative;width:52px;height:62px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));">
        <div style="width:52px;height:52px;border-radius:50%;border:3px solid white;overflow:hidden;background:hsl(173,80%,26%);">
          <img src="${img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid white;"></div>
        <div style="position:absolute;top:-4px;right:-6px;background:hsl(173,80%,26%);color:white;font-size:10px;font-weight:700;padding:2px 5px;border-radius:8px;white-space:nowrap;border:1.5px solid white;">${price}</div>
      </div>
    `,
  });
};

const buildUserIcon = () =>
  L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:hsla(210,90%,55%,.2);animation:pulse-ring 2s ease-out infinite;"></div>
        <div style="width:24px;height:24px;border-radius:50%;background:hsl(210,90%,55%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>
      </div>
      <style>@keyframes pulse-ring{0%{transform:scale(.8);opacity:1}100%{transform:scale(2.2);opacity:0}}</style>
    `,
  });

const buildPopupContent = (offer: Offer, onSelect: () => void) => {
  const discount = Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100);
  const catLabel = getCategoryLabel(offer.category);

  const el = document.createElement("div");
  el.style.cssText = "width:240px;font-family:'Outfit',sans-serif;";
  el.innerHTML = `
    <img src="${offer.image}" alt="${offer.title}" style="width:100%;height:120px;object-fit:cover;border-radius:10px;" />
    <div style="padding:10px 2px 4px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <p style="font-size:14px;font-weight:700;margin:0;color:hsl(20,25%,12%);">${offer.restaurantName}</p>
      </div>
      <span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:hsl(173,30%,93%);color:hsl(173,80%,26%);">${catLabel}</span>
      <p style="font-size:12px;color:hsl(20,10%,45%);margin:6px 0 0;">${offer.title}</p>
      <div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(20,10%,45%)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style="font-size:11px;color:hsl(20,10%,45%);">${offer.pickupStart} – ${offer.pickupEnd}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <div>
          <span style="font-size:12px;color:hsl(20,10%,45%);text-decoration:line-through;">${offer.originalPrice.toFixed(2)}€</span>
          <span style="font-size:16px;font-weight:700;color:hsl(173,80%,26%);margin-left:6px;">${offer.discountedPrice.toFixed(2)}€</span>
        </div>
        <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:8px;background:hsl(45,90%,55%);color:hsl(20,25%,12%);">-${discount}%</span>
      </div>
    </div>
  `;

  const btn = document.createElement("button");
  btn.textContent = "Voir l'offre →";
  btn.style.cssText = "margin-top:8px;width:100%;padding:10px;border-radius:10px;background:hsl(173,80%,26%);color:white;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:opacity .2s;";
  btn.onmouseenter = () => (btn.style.opacity = "0.9");
  btn.onmouseleave = () => (btn.style.opacity = "1");
  btn.addEventListener("click", onSelect);
  el.appendChild(btn);

  return el;
};

const MapView = ({ offers, onBack, onSelectOffer }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  const geoOffers = offers.filter((o) => o.latitude != null && o.longitude != null);

  const flyToUser = () => {
    setLocating(true);
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (mapRef.current) {
          L.marker(latlng, { icon: buildUserIcon() })
            .addTo(mapRef.current)
            .bindPopup("<b>Vous êtes ici</b>");
          mapRef.current.flyTo(latlng, 14, { duration: 1.5 });
        }
        setLocating(false);
      },
      () => {
        mapRef.current?.flyTo(defaultCenter, 14, { duration: 1.5 });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);
      mapRef.current = map;
      flyToUser();
    }

    const map = mapRef.current;
    map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });

    geoOffers.forEach((r) => {
      L.marker([r.latitude!, r.longitude!], { icon: buildPhotoPin(r) })
        .addTo(map)
        .bindPopup(buildPopupContent(r, () => onSelectOffer(r)), {
          maxWidth: 260,
          minWidth: 240,
          className: "map-popup-custom",
        });
    });

    if (geoOffers.length > 0) {
      const bounds = L.latLngBounds(geoOffers.map((o) => [o.latitude!, o.longitude!]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [geoOffers.length]);

  useEffect(() => {
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  return (
    <div className="relative h-screen w-full">
      <style>{`
        .map-popup-custom .leaflet-popup-content-wrapper {
          border-radius: 14px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,.15);
        }
        .map-popup-custom .leaflet-popup-content {
          margin: 10px;
        }
        .map-popup-custom .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,.1);
        }
      `}</style>
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

    </div>
  );
};

export default MapView;
