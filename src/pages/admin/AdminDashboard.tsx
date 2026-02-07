import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, Package, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ restaurants: 0, offers: 0, users: 0, pending: 0 });

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
    fetchStats();
  }, []);

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
    </div>
  );
};

export default AdminDashboard;
