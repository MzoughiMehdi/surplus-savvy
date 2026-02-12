import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, Package, Users, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  restaurant_id: string;
  restaurants: { name: string } | null;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "Question générale",
  technical: "Problème technique",
  payments: "Paiements",
  other: "Autre",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ restaurants: 0, offers: 0, users: 0, pending: 0 });
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: restaurants }, { count: offers }, { count: users }, { data: pending }] =
        await Promise.all([
          supabase.from("restaurants").select("*", { count: "exact", head: true }),
          supabase.from("offers").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("restaurants").select("id").eq("status", "pending"),
        ]);
      setStats({
        restaurants: restaurants ?? 0,
        offers: offers ?? 0,
        users: users ?? 0,
        pending: pending?.length ?? 0,
      });
    };

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("support_messages" as any)
        .select("id, subject, message, status, created_at, restaurant_id, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      setMessages((data as unknown as SupportMessage[]) ?? []);
    };

    fetchStats();
    fetchMessages();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from("support_messages" as any).update({ status }).eq("id", id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const cards = [
    { label: "Restaurants", value: stats.restaurants, icon: Store, color: "text-primary" },
    { label: "Offres", value: stats.offers, icon: Package, color: "text-accent" },
    { label: "Utilisateurs", value: stats.users, icon: Users, color: "text-primary" },
    { label: "En attente", value: stats.pending, icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Vue d'ensemble</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Support Messages */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5" /> Messages des commerçants
          {messages.filter((m) => m.status === "pending").length > 0 && (
            <Badge>{messages.filter((m) => m.status === "pending").length}</Badge>
          )}
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun message reçu</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <Card key={m.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {m.restaurants?.name ?? "Restaurant inconnu"}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {SUBJECT_LABELS[m.subject] ?? m.subject}
                        </Badge>
                        <Badge
                          variant={m.status === "pending" ? "default" : m.status === "read" ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {m.status === "pending" ? "Nouveau" : m.status === "read" ? "Lu" : "Résolu"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {m.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, "read")}
                          className="text-xs text-primary hover:underline"
                        >
                          Marquer lu
                        </button>
                      )}
                      {m.status !== "resolved" && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, "resolved")}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Résolu
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
