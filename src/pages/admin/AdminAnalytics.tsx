import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(152,45%,28%)", "hsl(16,65%,55%)", "hsl(38,92%,50%)", "hsl(200,60%,50%)"];

const AdminAnalytics = () => {
  const [restaurantsByStatus, setRestaurantsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [offersByCategory, setOffersByCategory] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: restaurants }, { data: offers }] = await Promise.all([
        supabase.from("restaurants").select("status"),
        supabase.from("offers").select("category"),
      ]);

      const statusMap: Record<string, number> = {};
      restaurants?.forEach((r) => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
      setRestaurantsByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      const catMap: Record<string, number> = {};
      offers?.forEach((o) => { catMap[o.category ?? "other"] = (catMap[o.category ?? "other"] || 0) + 1; });
      setOffersByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restaurants par statut</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restaurantsByStatus}>
                <XAxis dataKey="name" tick={{ fill: "hsl(150,10%,45%)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(150,10%,45%)", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(152,45%,28%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offres par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={offersByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {offersByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
