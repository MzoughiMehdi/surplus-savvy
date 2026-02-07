import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ArrowLeft, Navigation } from "lucide-react";
import { mockOffers, type Offer } from "@/data/mockOffers";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const userIcon = new L.DivIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(152,45%,28%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const restaurantIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;border-radius:50%;background:hsl(16,65%,55%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">🍽️</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Simulated restaurant locations around Paris center
const restaurantLocations = mockOffers.map((offer, i) => ({
  ...offer,
  lat: 48.8566 + (Math.sin(i * 1.8) * 0.012),
  lng: 2.3522 + (Math.cos(i * 1.5) * 0.015),
}));

function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

interface MapViewProps {
  onBack: () => void;
  onSelectOffer: (offer: Offer) => void;
}

const MapView = ({ onBack, onSelectOffer }: MapViewProps) => {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  const handleLocate = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        () => {
          // Fallback to Paris center
          setUserPos(defaultCenter);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserPos(defaultCenter);
      setLocating(false);
    }
  };

  useEffect(() => {
    handleLocate();
  }, []);

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={userPos || defaultCenter}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToUser position={userPos} />

        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <span className="text-sm font-semibold">Vous êtes ici</span>
            </Popup>
          </Marker>
        )}

        {restaurantLocations.map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={restaurantIcon}>
            <Popup>
              <div className="min-w-[200px]">
                <img src={r.image} alt={r.title} className="h-24 w-full rounded-lg object-cover" />
                <p className="mt-2 text-sm font-bold">{r.restaurantName}</p>
                <p className="text-xs text-gray-600">{r.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500 line-through">€{r.originalPrice.toFixed(2)}</span>
                  <span className="text-sm font-bold" style={{ color: "hsl(152,45%,28%)" }}>€{r.discountedPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => onSelectOffer(r)}
                  className="mt-2 w-full rounded-lg py-2 text-xs font-bold text-white"
                  style={{ background: "hsl(152,45%,28%)" }}
                >
                  Voir l'offre
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute left-4 top-12 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur-sm transition-transform active:scale-90"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>

      {/* Locate me button */}
      <button
        onClick={handleLocate}
        disabled={locating}
        className="absolute bottom-28 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-90"
      >
        <Navigation className={`h-5 w-5 text-primary-foreground ${locating ? "animate-pulse" : ""}`} />
      </button>

      {/* Info bar */}
      <div className="absolute bottom-16 left-4 right-4 z-[1000] rounded-2xl bg-background/95 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold text-foreground">
          🍽️ {restaurantLocations.length} restaurants à proximité
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Appuyez sur un marqueur pour voir l'offre
        </p>
      </div>
    </div>
  );
};

export default MapView;
