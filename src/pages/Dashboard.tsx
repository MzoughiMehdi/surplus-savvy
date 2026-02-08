import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, BarChart3, Store, LogOut, QrCode, CheckCircle, XCircle, Users, CreditCard, ExternalLink, Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import RestaurantImageUpload from "@/components/RestaurantImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription, MERCHANT_PLAN } from "@/hooks/useSubscription";
import { useSurpriseBagConfig } from "@/hooks/useSurpriseBagConfig";
import { useDailyOverrides } from "@/hooks/useDailyOverrides";
import SurpriseBagConfig from "@/components/SurpriseBagConfig";
import SurpriseBagCalendar from "@/components/SurpriseBagCalendar";

interface RestaurantData {
  id: string;
  name: string;
  subscription_plan: string;
  trial_ends_at: string;
  status: string;
  image_url: string | null;
}

interface ReservationData {
  id: string;
  pickup_code: string;
  status: string;
  created_at: string;
  user_id: string;
  offers: { title: string; discounted_price: number };
}

const ConnectSection = ({ restaurantId }: { restaurantId?: string }) => {
  const [connectLoading, setConnectLoading] = useState(false);

  const { data: connectStatus } = useQuery({
    queryKey: ["connect-status", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-connect-status", {
        body: { restaurantId },
      });
      if (error) throw error;
      return data as { connected: boolean; chargesEnabled: boolean };
    },
    enabled: !!restaurantId,
    refetchInterval: 30000,
  });

  const handleSetupConnect = async () => {
    if (!restaurantId) return;
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: { restaurantId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erreur lors de la configuration");
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Paiements
          </p>
          {connectStatus?.chargesEnabled ? (
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-success" /> Compte actif — virements automatiques
            </p>
          ) : connectStatus?.connected ? (
            <p className="mt-0.5 text-xs text-muted-foreground">Onboarding en cours — finalisez votre inscription</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Configurez vos paiements pour recevoir vos revenus</p>
          )}
        </div>
        {connectStatus?.chargesEnabled ? (
          <Badge variant="secondary" className="text-[10px]">Actif</Badge>
        ) : (
          <Button size="sm" onClick={handleSetupConnect} disabled={connectLoading}>
            {connectLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            {connectStatus?.connected ? "Continuer" : "Configurer"}
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const subscription = useSubscription();
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const { config, upsertConfig } = useSurpriseBagConfig(restaurant?.id);
  const { overrides, upsertOverride, deleteOverride } = useDailyOverrides(restaurant?.id, currentMonth);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchData();
  }, [user]);

  // Auto-generate today's offer
  useEffect(() => {
    if (!restaurant || !config || !config.is_active) return;
    generateTodayOffer();
  }, [restaurant, config]);

  const generateTodayOffer = async () => {
    if (!restaurant || !config) return;
    const today = new Date().toISOString().split("T")[0];

    // Check if today's offer already exists
    const { data: existing } = await supabase
      .from("offers")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("date", today)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Check for override
    const { data: todayOverride } = await supabase
      .from("daily_overrides")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("date", today)
      .maybeSingle();

    if (todayOverride?.is_suspended) return;

    const qty = todayOverride?.quantity ?? config.daily_quantity;
    const pStart = todayOverride?.pickup_start ?? config.pickup_start;
    const pEnd = todayOverride?.pickup_end ?? config.pickup_end;
    const salePrice = Number((config.base_price * 0.4).toFixed(2));

    await supabase.from("offers").insert({
      restaurant_id: restaurant.id,
      title: "Panier surprise",
      description: "Un assortiment surprise de nos meilleurs produits du jour",
      original_price: config.base_price,
      discounted_price: salePrice,
      quantity: qty,
      items_left: qty,
      pickup_start: pStart,
      pickup_end: pEnd,
      category: "meals",
      date: today,
      is_active: true,
      image_url: config.image_url ?? null,
    });
  };

  const fetchData = async () => {
    if (!user) return;
    const { data: restList } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1);

    const rest = restList?.[0] ?? null;
    if (!rest) { navigate("/merchant-onboarding"); return; }
    setRestaurant(rest);

    const { data: res } = await supabase
      .from("reservations")
      .select("id, pickup_code, status, created_at, user_id, offers(title, discounted_price)")
      .eq("restaurant_id", rest.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setReservations((res as unknown as ReservationData[]) || []);
    setLoading(false);
  };

  // Count reservations per date for calendar
  const reservationCounts: Record<string, number> = {};
  reservations.forEach((r) => {
    const date = r.created_at.split("T")[0];
    reservationCounts[date] = (reservationCounts[date] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const trialDaysLeft = restaurant?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(restaurant.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  const todayReservations = reservations.filter((r) => r.created_at.split("T")[0] === new Date().toISOString().split("T")[0]);

  return (
    <div className="min-h-screen bg-background px-5 pb-8 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => { signOut(); navigate("/"); }} className="rounded-full bg-secondary p-2.5">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Restaurant Photo */}
      {restaurant && user && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">Photo du restaurant</p>
          <RestaurantImageUpload
            imageUrl={restaurant.image_url}
            onImageChange={(url) => setRestaurant((r) => r ? { ...r, image_url: url } : r)}
            restaurantId={restaurant.id}
            userId={user.id}
          />
        </div>
      )}

      {/* Subscription */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Abonnement
            </p>
            {subscription.subscribed ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Plan {MERCHANT_PLAN.name} · Renouvellement {subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString("fr-FR") : ""}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Essai gratuit · {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant{trialDaysLeft > 1 ? "s" : ""}</p>
            )}
          </div>
          {subscription.subscribed ? (
            <Button size="sm" variant="outline" onClick={async () => {
              try { await subscription.openPortal(); } catch { toast.error("Impossible d'ouvrir le portail"); }
            }}>
              Gérer <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={async () => {
              try { await subscription.startCheckout(); } catch { toast.error("Erreur de paiement"); }
            }}>{MERCHANT_PLAN.name} {MERCHANT_PLAN.price}€/mois</Button>
          )}
        </div>
      </div>

      <ConnectSection restaurantId={restaurant?.id} />

      {restaurant?.status === "pending" && (
        <div className="mt-4 rounded-xl bg-warning/10 p-4">
          <p className="text-sm font-semibold text-warning">⏳ En attente de validation</p>
          <p className="text-xs text-muted-foreground">Votre restaurant sera visible après approbation</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <Package className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 text-xl font-bold text-foreground">{config?.daily_quantity ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Paniers/jour</p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <BarChart3 className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-1 text-xl font-bold text-foreground">{todayReservations.length}</p>
          <p className="text-[10px] text-muted-foreground">Réservations</p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <Store className="mx-auto h-5 w-5 text-success" />
          <p className="mt-1 text-xl font-bold text-foreground capitalize">{restaurant?.subscription_plan}</p>
          <p className="text-[10px] text-muted-foreground">Plan</p>
        </div>
      </div>

      {/* Surprise Bag Config */}
      <div className="mt-6">
        <SurpriseBagConfig config={config} onUpdate={upsertConfig} userId={user!.id} />
      </div>

      {/* Calendar */}
      {config && (
        <div className="mt-6">
          <SurpriseBagCalendar
            config={config}
            overrides={overrides}
            reservationCounts={reservationCounts}
            onUpsertOverride={upsertOverride}
            onDeleteOverride={deleteOverride}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>
      )}

      {/* Reservations */}
      <div className="mt-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          <Users className="mr-2 inline h-5 w-5" />
          Réservations récentes
        </h2>
        {reservations.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">Aucune réservation</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.offers.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <QrCode className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs font-bold text-primary">{r.pickup_code.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        r.status === "confirmed" ? "default" :
                        r.status === "accepted" ? "default" :
                        r.status === "completed" ? "secondary" : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {r.status === "confirmed" ? "En attente" :
                       r.status === "accepted" ? "Acceptée" :
                       r.status === "completed" ? "Retiré" : "Annulé"}
                    </Badge>
                    <span className="text-sm font-bold text-primary">€{r.offers.discounted_price}</span>
                  </div>
                </div>
                {r.status === "confirmed" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        await supabase.from("reservations").update({ status: "accepted" }).eq("id", r.id);
                        toast.success("Réservation acceptée !");
                        fetchData();
                      }}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        await supabase.from("reservations").update({ status: "cancelled" }).eq("id", r.id);
                        toast.success("Réservation annulée");
                        fetchData();
                      }}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Refuser
                    </Button>
                  </div>
                )}
                {r.status === "accepted" && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={async () => {
                      await supabase.from("reservations").update({ status: "completed" }).eq("id", r.id);
                      toast.success("Commande marquée comme retirée !");
                      fetchData();
                    }}
                  >
                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Marquer comme retiré
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
