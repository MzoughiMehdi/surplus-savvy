import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, BarChart3, Store, LogOut, QrCode, CheckCircle, XCircle, Users, CreditCard, ExternalLink, Loader2, Landmark, CalendarDays, ShoppingBag } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
  pickup_date: string | null;
  config_id: string | null;
  offers: { title: string; discounted_price: number; pickup_start: string; pickup_end: string } | null;
  surprise_bag_config: { base_price: number; pickup_start: string; pickup_end: string } | null;
}

type TabId = "dashboard" | "reservations" | "commandes" | "stats";

const merchantTabs: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: "dashboard", label: "Dashboard", icon: Store },
  { id: "reservations", label: "Réservations", icon: Clock },
  { id: "commandes", label: "Commandes", icon: ShoppingBag },
  { id: "stats", label: "Statistiques", icon: BarChart3 },
];

const MerchantBottomNav = ({ active, onNavigate }: { active: TabId; onNavigate: (tab: TabId) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-primary shadow-[0_-4px_20px_-4px_hsl(var(--primary)/0.3)]">
    <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {merchantTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className="group relative flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all"
          >
            {isActive && <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-primary-foreground" />}
            <Icon className={`h-5 w-5 transition-all ${isActive ? "text-primary-foreground scale-110" : "text-primary-foreground/60 group-hover:text-primary-foreground/90"}`} />
            <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary-foreground" : "text-primary-foreground/60"}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

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

// Reservation card used by both Reservations and Commandes tabs
const ReservationCard = ({ r, fetchData }: { r: ReservationData; fetchData: () => void }) => {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const pickupDay = r.pickup_date || today;
  const isTomorrow = pickupDay === tomorrow;
  const isToday = pickupDay <= today;

  const title = r.offers?.title ?? "Lot Anti-Gaspi";
  const price = r.offers?.discounted_price ?? (r.surprise_bag_config ? Number((r.surprise_bag_config.base_price * 0.4).toFixed(2)) : 0);
  const pickupStart = (r.offers?.pickup_start ?? r.surprise_bag_config?.pickup_start ?? "").slice(0, 5);
  const pickupEnd = (r.offers?.pickup_end ?? r.surprise_bag_config?.pickup_end ?? "").slice(0, 5);

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Réservée le {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Retrait :</span>
            <Badge variant={isTomorrow ? "outline" : "secondary"} className="text-[10px]">
              {isTomorrow ? "Demain" : isToday ? "Aujourd'hui" : pickupDay}
            </Badge>
            {(pickupStart || pickupEnd) && (
              <span className="text-[10px] text-muted-foreground">{pickupStart} – {pickupEnd}</span>
            )}
          </div>
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
              r.status === "completed" ? "secondary" :
              r.status === "expired" ? "destructive" : "destructive"
            }
            className="text-[10px]"
          >
            {r.status === "confirmed" ? "En attente" :
             r.status === "accepted" ? "Acceptée" :
             r.status === "completed" ? "Retiré" :
             r.status === "expired" ? "Expirée" : "Annulé"}
          </Badge>
          <span className="text-sm font-bold text-primary">€{price.toFixed(2)}</span>
        </div>
      </div>
      {r.status === "confirmed" && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={async () => {
              await supabase.from("reservations").update({ status: "accepted" }).eq("id", r.id);
              if ((r as any).payment_intent_id) {
                const { error } = await supabase.functions.invoke("capture-payment", {
                  body: { reservationId: r.id, action: "capture" },
                });
                if (error) { toast.error("Erreur lors de la capture du paiement"); return; }
              }
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
              if ((r as any).payment_intent_id) {
                await supabase.functions.invoke("capture-payment", {
                  body: { reservationId: r.id, action: "cancel" },
                });
              }
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
  );
};

// Stats tab content
const StatsTab = ({ reservations }: { reservations: ReservationData[] }) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const last30 = reservations.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);
  const avgPerDay = (last30.length / 30).toFixed(1);

  const completedLast30 = last30.filter((r) => r.status === "completed");
  const totalRevenue = completedLast30.reduce((sum, r) => sum + (r.offers?.discounted_price ?? (r.surprise_bag_config ? Number((r.surprise_bag_config.base_price * 0.4).toFixed(2)) : 0)), 0);

  // Group by day for chart
  const dailyCounts: Record<string, number> = {};
  last30.forEach((r) => {
    const day = r.created_at.split("T")[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const dailyData = Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }));

  // Group revenue by month
  const monthlyRevenue: Record<string, number> = {};
  reservations
    .filter((r) => r.status === "completed")
    .forEach((r) => {
      const month = r.created_at.slice(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (r.offers?.discounted_price ?? (r.surprise_bag_config ? Number((r.surprise_bag_config.base_price * 0.4).toFixed(2)) : 0));
    });
  const monthlyData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: Number(revenue.toFixed(2)) }));

  return (
    <div className="mt-4 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-foreground">{avgPerDay}</p>
          <p className="text-xs text-muted-foreground">Moyenne / jour (30j)</p>
        </div>
        <div className="rounded-xl bg-card p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-foreground">{totalRevenue.toFixed(2)}€</p>
          <p className="text-xs text-muted-foreground">Revenus bruts (30j)</p>
        </div>
      </div>

      {/* Daily orders chart */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-foreground">Commandes par jour (30j)</p>
        {dailyData.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly revenue chart */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-foreground">Revenus bruts par mois</p>
        {monthlyData.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `${v}€`} />
              <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const { config, upsertConfig } = useSurpriseBagConfig(restaurant?.id);
  const { overrides, upsertOverride, deleteOverride } = useDailyOverrides(restaurant?.id, currentMonth);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchData();
  }, [user]);

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
      .select("id, pickup_code, status, created_at, user_id, payment_intent_id, pickup_date, config_id, offers(title, discounted_price, pickup_start, pickup_end), surprise_bag_config(base_price, pickup_start, pickup_end)")
      .eq("restaurant_id", rest.id)
      .order("created_at", { ascending: false })
      .limit(200);

    setReservations((res as unknown as ReservationData[]) || []);
    setLoading(false);
  };

  const reservationCounts: Record<string, number> = {};
  reservations.forEach((r) => {
    const date = r.pickup_date || r.created_at.split("T")[0];
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

  const today = new Date().toISOString().split("T")[0];
  const todayReservations = reservations.filter((r) => {
    const pickupDay = r.pickup_date || r.created_at.split("T")[0];
    return pickupDay === today;
  });
  const pendingReservations = reservations.filter((r) => r.status === "confirmed");
  const orderReservations = reservations.filter((r) => r.status === "accepted" || r.status === "completed");

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-12">
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

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <>
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
        </>
      )}

      {activeTab === "reservations" && (
        <div className="mt-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" /> En attente de validation
            {pendingReservations.length > 0 && (
              <Badge className="text-[10px]">{pendingReservations.length}</Badge>
            )}
          </h2>
          {pendingReservations.length === 0 ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">Aucune réservation en attente</p>
          ) : (
            <div className="mt-3 space-y-3">
              {pendingReservations.map((r) => (
                <ReservationCard key={r.id} r={r} fetchData={fetchData} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "commandes" && (
        <div className="mt-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Commandes
          </h2>
          {orderReservations.length === 0 ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">Aucune commande</p>
          ) : (
            <div className="mt-3 space-y-3">
              {orderReservations.map((r) => (
                <ReservationCard key={r.id} r={r} fetchData={fetchData} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "stats" && <StatsTab reservations={reservations} />}

      <MerchantBottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Dashboard;
