import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { Clock, QrCode, Package, Heart, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReservationConfirmation from "@/components/ReservationConfirmation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Reservation {
  id: string;
  status: string;
  pickup_code: string;
  created_at: string;
  offer_id: string | null;
  config_id: string | null;
  pickup_date: string | null;
  restaurant_id: string;
  offers: {
    title: string;
    discounted_price: number;
    pickup_start: string;
    pickup_end: string;
  } | null;
  surprise_bag_config: {
    base_price: number;
    pickup_start: string;
    pickup_end: string;
  } | null;
  restaurants: {
    name: string;
  } | null;
}

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selected, setSelected] = useState<Reservation | null>(null);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reservations")
        .select("*, offers(title, discounted_price, pickup_start, pickup_end), surprise_bag_config(base_price, pickup_start, pickup_end), restaurants(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as Reservation[]) ?? [];
    },
    enabled: !!user,
  });

  if (selected) {
    return (
      <ReservationConfirmation
        pickupCode={selected.pickup_code}
        offerTitle={selected.offers?.title ?? "Lot Anti-Gaspi"}
        restaurantName={selected.restaurants?.name ?? "Restaurant"}
        pickupStart={(selected.offers?.pickup_start ?? selected.surprise_bag_config?.pickup_start ?? "").slice(0, 5)}
        pickupEnd={(selected.offers?.pickup_end ?? selected.surprise_bag_config?.pickup_end ?? "").slice(0, 5)}
        price={selected.offers?.discounted_price ?? (selected.surprise_bag_config ? Number((selected.surprise_bag_config.base_price * 0.4).toFixed(2)) : 0)}
        status={selected.status}
        onBack={() => setSelected(null)}
        reservationId={selected.id}
        restaurantId={selected.restaurant_id}
      />
    );
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    confirmed: { label: "En attente", variant: "outline" },
    accepted: { label: "Acceptée", variant: "default" },
    completed: { label: "Retirée", variant: "secondary" },
    cancelled: { label: "Annulée", variant: "destructive" },
    expired: { label: "Expirée", variant: "destructive" },
  };

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const getTitle = (r: Reservation) => r.offers?.title ?? "Lot Anti-Gaspi";
  const getPrice = (r: Reservation) => r.offers?.discounted_price ?? (r.surprise_bag_config ? Number((r.surprise_bag_config.base_price * 0.4).toFixed(2)) : 0);
  const getPickupStart = (r: Reservation) => (r.offers?.pickup_start ?? r.surprise_bag_config?.pickup_start ?? "").slice(0, 5);
  const getPickupEnd = (r: Reservation) => (r.offers?.pickup_end ?? r.surprise_bag_config?.pickup_end ?? "").slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Mes commandes</h1>
        <p className="text-sm text-muted-foreground">{reservations.length} réservation{reservations.length > 1 ? "s" : ""}</p>
      </div>

      {!user ? (
        <div className="flex flex-col items-center justify-center px-5 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold text-foreground">
            Connectez-vous pour voir vos commandes
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez un compte pour suivre vos réservations
          </p>
          <button onClick={() => navigate("/auth")} className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            Se connecter
          </button>
        </div>
      ) : isLoading ? (
        <p className="px-5 text-muted-foreground">Chargement...</p>
      ) : reservations.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">Aucune réservation pour le moment</p>
          <p className="mt-1 text-xs text-muted-foreground">Explorez les offres et réservez votre premier panier !</p>
        </div>
      ) : (
        <div className="space-y-3 px-5">
          {reservations.map((r) => {
            const sc = statusConfig[r.status] ?? statusConfig.confirmed;
            const pickupDay = r.pickup_date;
            const isTomorrow = pickupDay === tomorrow;
            const isToday = pickupDay === today;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{getTitle(r)}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-muted-foreground">{r.restaurants?.name ?? "Restaurant"}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(r.restaurant_id); }}
                      aria-label={isFavorite(r.restaurant_id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorite(r.restaurant_id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {pickupDay && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {isTomorrow ? "Demain" : isToday ? "Aujourd'hui" : pickupDay}
                      </Badge>
                    )}
                    {(getPickupStart(r) || getPickupEnd(r)) && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {getPickupStart(r)} – {getPickupEnd(r)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                  <span className="text-sm font-bold text-primary">€{getPrice(r).toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
