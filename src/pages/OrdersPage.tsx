import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, QrCode, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReservationConfirmation from "@/components/ReservationConfirmation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Reservation {
  id: string;
  status: string;
  pickup_code: string;
  created_at: string;
  offer_id: string;
  restaurant_id: string;
  offers: {
    title: string;
    discounted_price: number;
    pickup_start: string;
    pickup_end: string;
  } | null;
  restaurants: {
    name: string;
  } | null;
}

const OrdersPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, offers(title, discounted_price, pickup_start, pickup_end), restaurants(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Erreur lors du chargement des commandes");
        setReservations([]);
      } else {
        setReservations((data as unknown as Reservation[]) ?? []);
      }
    } catch (err) {
      console.error("Unexpected error fetching reservations:", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const cancelReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Réservation annulée");
      setSelected(null);
      fetchReservations();
    } catch {
      toast.error("Erreur inattendue");
    }
  };

  if (selected) {
    return (
      <ReservationConfirmation
        pickupCode={selected.pickup_code}
        offerTitle={selected.offers?.title ?? "Offre"}
        restaurantName={selected.restaurants?.name ?? "Restaurant"}
        pickupStart={selected.offers?.pickup_start ?? ""}
        pickupEnd={selected.offers?.pickup_end ?? ""}
        price={selected.offers?.discounted_price ?? 0}
        status={selected.status}
        onBack={() => setSelected(null)}
        onCancel={selected.status === "confirmed" ? () => cancelReservation(selected.id) : undefined}
        reservationId={selected.id}
        restaurantId={selected.restaurant_id}
      />
    );
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    confirmed: { label: "Confirmée", variant: "default" },
    completed: { label: "Retirée", variant: "secondary" },
    cancelled: { label: "Annulée", variant: "destructive" },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Mes commandes</h1>
        <p className="text-sm text-muted-foreground">{reservations.length} réservation{reservations.length > 1 ? "s" : ""}</p>
      </div>

      {loading ? (
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
                  <p className="truncate text-sm font-semibold text-foreground">{r.offers?.title ?? "Offre"}</p>
                  <p className="text-xs text-muted-foreground">{r.restaurants?.name ?? "Restaurant"}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                  <span className="text-sm font-bold text-primary">€{r.offers?.discounted_price ?? 0}</span>
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
