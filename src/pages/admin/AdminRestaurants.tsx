import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Search, Eye, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  category: string;
  status: string;
  subscription_plan: string | null;
  created_at: string;
  owner_id: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-primary/20 text-primary border-primary/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  suspended: "bg-orange-500/20 text-orange-600 border-orange-500/30",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  suspended: PauseCircle,
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  suspended: "Suspendu",
};

const AdminRestaurants = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    let query = supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setRestaurants(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRestaurants(); }, [filter]);

  const suspendRestaurant = async (id: string) => {
    setActionLoading(id);
    try {
      // 1. Update status
      const { error } = await supabase.from("restaurants").update({ status: "suspended" }).eq("id", id);
      if (error) throw error;

      // 2. Deactivate all active offers
      await supabase.from("offers").update({ is_active: false }).eq("restaurant_id", id).eq("is_active", true);

      toast.success("Restaurant suspendu");
      fetchRestaurants();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const reactivateRestaurant = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from("restaurants").update({ status: "approved" }).eq("id", id);
      if (error) throw error;

      toast.success("Restaurant réactivé");
      fetchRestaurants();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("restaurants").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Restaurant ${status === "approved" ? "approuvé" : "rejeté"}`);
    fetchRestaurants();
  };

  const filtered = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Restaurants</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun restaurant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const Icon = statusIcons[r.status] ?? Clock;
                  return (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/restaurants/${r.id}`)}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.address}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{r.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? ""}`}>
                          <Icon className="h-3 w-3" />
                          {statusLabels[r.status] ?? r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/restaurants/${r.id}`); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(r.id, "approved"); }}>
                                Approuver
                              </Button>
                              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); updateStatus(r.id, "rejected"); }}>
                                Rejeter
                              </Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === r.id}
                              onClick={(e) => { e.stopPropagation(); suspendRestaurant(r.id); }}
                            >
                              Suspendre
                            </Button>
                          )}
                          {(r.status === "suspended" || r.status === "rejected") && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === r.id}
                              onClick={(e) => { e.stopPropagation(); reactivateRestaurant(r.id); }}
                            >
                              Réactiver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;
