import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getParisDate, getParisTomorrow, toParisDateString } from "@/lib/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, BarChart3, Store, LogOut, QrCode, CheckCircle, XCircle, Loader2, Landmark, CalendarDays, ShoppingBag, ExternalLink, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import RestaurantImageUpload from "@/components/RestaurantImageUpload";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSurpriseBagConfig } from "@/hooks/useSurpriseBagConfig";
import { useDailyOverrides } from "@/hooks/useDailyOverrides";
import SurpriseBagConfig from "@/components/SurpriseBagConfig";
import SurpriseBagCalendar from "@/components/SurpriseBagCalendar";
import ContactSupportDialog from "@/components/ContactSupportDialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RestaurantData {
  id: string;
  name: string;
  status: string;
  image_url: string | null;
  stripe_account_id: string | null;
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

type TabId = "dashboard" | "reservations" | "commandes" | "messages" | "stats";

const merchantTabs: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: "dashboard", label: "Dashboard", icon: Store },
  { id: "reservations", label: "Réservations", icon: Clock },
  { id: "commandes", label: "Commandes", icon: ShoppingBag },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "stats", label: "Statistiques", icon: BarChart3 },
];

const MerchantBottomNav = ({ active, onNavigate, unreadMessages = 0 }: { active: TabId; onNavigate: (tab: TabId) => void; unreadMessages?: number }) => (
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
            <div className="relative">
              <Icon className={`h-5 w-5 transition-all ${isActive ? "text-primary-foreground scale-110" : "text-primary-foreground/60 group-hover:text-primary-foreground/90"}`} />
              {tab.id === "messages" && unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground px-1">{unreadMessages}</span>
              )}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary-foreground" : "text-primary-foreground/60"}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

const ConnectSection = ({ restaurantId, highlight }: { restaurantId?: string; highlight?: boolean }) => {
  const [connectLoading, setConnectLoading] = useState(false);

  const { data: connectStatus } = useQuery({
    queryKey: ["connect-status", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-connect-status", {
        body: { restaurantId },
      });
      if (error) throw error;
      const status = data as { connected: boolean; chargesEnabled: boolean };

      // Auto-transfer pending payouts when Connect becomes active
      if (status.chargesEnabled) {
        supabase.functions.invoke("transfer-pending-payouts", {
          body: { restaurantId },
        }).catch(() => {});
      }

      return status;
    },
    enabled: !!restaurantId,
    refetchInterval: 30000,
  });

  const handleSetupConnect = async () => {
    if (!restaurantId) return;
    setConnectLoading(true);
    const newWindow = window.open("about:blank", "_blank");
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: { restaurantId },
      });
      if (error) throw error;
      if (data?.url) {
        if (newWindow) {
          newWindow.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } else {
        newWindow?.close();
      }
    } catch {
      newWindow?.close();
      toast.error("Erreur lors de la configuration");
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className={`mt-4 rounded-xl border p-4 shadow-sm ${highlight && !connectStatus?.chargesEnabled ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
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
  const today = getParisDate();
  const tomorrow = getParisTomorrow();
  const pickupDay = r.pickup_date || toParisDateString(r.created_at);
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

// Messages tab for merchants
interface MerchantMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  merchant_unread: boolean;
}

interface MerchantReply {
  id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "Question générale",
  technical: "Problème technique",
  payments: "Paiements",
  other: "Autre",
};

const MerchantMessagesTab = ({ restaurantId }: { restaurantId: string }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MerchantMessage[]>([]);
  const [selected, setSelected] = useState<MerchantMessage | null>(null);
  const [replies, setReplies] = useState<MerchantReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [restaurantId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("support_messages" as any)
      .select("id, subject, message, status, created_at, merchant_unread")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    setMessages((data as unknown as MerchantMessage[]) ?? []);
  };

  const openConversation = async (msg: MerchantMessage) => {
    setSelected(msg);
    setReplyText("");
    // Mark as read for merchant
    if (msg.merchant_unread) {
      await supabase.from("support_messages" as any).update({ merchant_unread: false }).eq("id", msg.id);
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, merchant_unread: false } : m));
    }
    const { data } = await supabase
      .from("support_replies" as any)
      .select("id, sender_role, content, created_at")
      .eq("message_id", msg.id)
      .order("created_at", { ascending: true });
    setReplies((data as unknown as MerchantReply[]) ?? []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleSendReply = async () => {
    if (!selected || !user || replyText.trim().length < 2) return;
    setSending(true);
    const { error } = await supabase.from("support_replies" as any).insert([
      { message_id: selected.id, sender_role: "merchant", sender_id: user.id, content: replyText.trim() },
    ]);
    if (error) { toast.error("Erreur lors de l'envoi"); setSending(false); return; }
    // Flag admin_unread
    await supabase.from("support_messages" as any).update({ admin_unread: true }).eq("id", selected.id);
    setReplyText("");
    setSending(false);
    openConversation(selected);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  if (selected) {
    return (
      <div className="mt-4 flex flex-col" style={{ height: "calc(100vh - 14rem)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div>
            <p className="text-sm font-semibold text-foreground">{SUBJECT_LABELS[selected.subject] ?? selected.subject}</p>
            <Badge variant={selected.status === "resolved" ? "outline" : "secondary"} className="text-[10px]">
              {selected.status === "pending" ? "En attente" : selected.status === "read" ? "Lu" : "Résolu"}
            </Badge>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          {/* Initial message (merchant = left) */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-card p-3 shadow-sm">
              <p className="text-sm text-foreground">{selected.message}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(selected.created_at)}</p>
            </div>
          </div>
          {replies.map((r) => (
            <div key={r.id} className={`flex ${r.sender_role === "merchant" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-xl p-3 shadow-sm ${r.sender_role === "merchant" ? "rounded-tl-sm bg-card text-foreground" : "rounded-tr-sm bg-primary text-primary-foreground"}`}>
                <p className="text-sm">{r.content}</p>
                <p className={`mt-1 text-[10px] ${r.sender_role === "merchant" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>{formatDate(r.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Textarea
            placeholder="Votre réponse..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
          />
          <Button onClick={handleSendReply} disabled={sending || replyText.trim().length < 2} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-5 w-5" /> Messages
        </h2>
        <ContactSupportDialog restaurantId={restaurantId} />
      </div>
      {messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground mt-8">Aucun message envoyé</p>
      ) : (
        messages.map((m) => (
          <div key={m.id} className={`rounded-xl bg-card p-4 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors ${m.merchant_unread ? "border border-primary/50 bg-primary/5" : ""}`} onClick={() => openConversation(m)}>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{SUBJECT_LABELS[m.subject] ?? m.subject}</Badge>
              {m.merchant_unread && <Badge className="text-[10px]">Nouveau</Badge>}
              <Badge variant={m.status === "pending" ? "default" : m.status === "read" ? "secondary" : "outline"} className="text-[10px]">
                {m.status === "pending" ? "En attente" : m.status === "read" ? "Lu" : "Résolu"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(m.created_at)}</p>
          </div>
        ))
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [merchantUnreadCount, setMerchantUnreadCount] = useState(0);

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

    // Fetch unread messages count for merchant
    const { count } = await supabase
      .from("support_messages" as any)
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", rest.id)
      .eq("merchant_unread", true);
    setMerchantUnreadCount(count ?? 0);

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
    const date = r.pickup_date || toParisDateString(r.created_at);
    reservationCounts[date] = (reservationCounts[date] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = getParisDate();
  const todayReservations = reservations.filter((r) => {
    const pickupDay = r.pickup_date || toParisDateString(r.created_at);
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
          <button onClick={async () => { await signOut(); navigate("/auth"); }} className="rounded-full bg-secondary p-2.5">
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

          <ConnectSection restaurantId={restaurant?.id} highlight={!restaurant?.stripe_account_id} />

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
              <p className="mt-1 text-xl font-bold text-foreground capitalize">{restaurant?.status === "approved" ? "Actif" : "En attente"}</p>
              <p className="text-[10px] text-muted-foreground">Statut</p>
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

          {/* Contact Support */}
          {restaurant && (
            <div className="mt-6">
              <ContactSupportDialog restaurantId={restaurant.id} />
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

      {activeTab === "messages" && restaurant && (
        <MerchantMessagesTab restaurantId={restaurant.id} />
      )}

      {activeTab === "stats" && <StatsTab reservations={reservations} />}

      <MerchantBottomNav active={activeTab} onNavigate={setActiveTab} unreadMessages={merchantUnreadCount} />
    </div>
  );
};

export default Dashboard;
