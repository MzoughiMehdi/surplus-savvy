import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    let query = supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setRestaurants(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRestaurants(); }, [filter]);

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
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun restaurant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.address}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{r.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{r.subscription_plan ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? ""}`}>
                        {r.status === "pending" && <Clock className="h-3 w-3" />}
                        {r.status === "approved" && <CheckCircle className="h-3 w-3" />}
                        {r.status === "rejected" && <XCircle className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => updateStatus(r.id, "approved")}>
                            Approuver
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rejected")}>
                            Rejeter
                          </Button>
                        </div>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "rejected")}>
                          Suspendre
                        </Button>
                      )}
                      {r.status === "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "approved")}>
                          Réactiver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;
