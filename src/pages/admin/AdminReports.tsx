import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import {
  Command, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const reportStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En attente", variant: "outline" },
  resolved: { label: "Traité", variant: "secondary" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: restaurants } = useQuery({
    queryKey: ["admin-restaurants-list"],
    queryFn: async () => {
      const { data } = await supabase.from("restaurants").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", restaurantFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*, restaurants(name), profiles:user_id(email, full_name)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (restaurantFilter !== "all") query = query.eq("restaurant_id", restaurantFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const update: any = { status };
      if (admin_notes !== undefined) update.admin_notes = admin_notes;
      const { error } = await supabase.from("reports").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Signalement mis à jour");
      setSelected(null);
    },
  });

  const openDetail = (report: any) => {
    setSelected(report);
    setAdminNotes(report.admin_notes || "");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Signalements</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Commerçant</label>
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-52">
                <Input
                  ref={inputRef}
                  placeholder="Rechercher un commerçant..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) setRestaurantFilter("all");
                    setComboOpen(true);
                  }}
                  onFocus={() => setComboOpen(true)}
                  className="pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => { setSearchQuery(""); setRestaurantFilter("all"); setComboOpen(false); }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Command>
                <CommandList>
                  <CommandEmpty>Aucun commerçant trouvé</CommandEmpty>
                  <CommandGroup>
                    {restaurants
                      ?.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((r) => (
                        <CommandItem key={r.id} value={r.name} onSelect={() => {
                          setRestaurantFilter(r.id);
                          setSearchQuery(r.name);
                          setComboOpen(false);
                        }}>
                          {r.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Statut</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="resolved">Traité</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consommateur</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!reports || reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun signalement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r: any) => {
                  const s = reportStatusMap[r.status] ?? reportStatusMap.pending;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.profiles?.full_name || r.profiles?.email || "—"}
                      </TableCell>
                      <TableCell>{r.restaurants?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{r.message}</TableCell>
                      <TableCell>
                        {r.image_url ? (
                          <img src={r.image_url} alt="report" className="h-10 w-10 rounded object-cover cursor-pointer" onClick={() => openDetail(r)} />
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail du signalement</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Consommateur</p>
                <p className="text-sm font-medium">{selected.profiles?.full_name || selected.profiles?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Restaurant</p>
                <p className="text-sm font-medium">{selected.restaurants?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Message</p>
                <p className="text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>
              {selected.image_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Photo</p>
                  <img src={selected.image_url} alt="report" className="max-h-64 rounded-lg object-contain" />
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateReport.mutate({ id: selected.id, status: "resolved", admin_notes: adminNotes })}
                  disabled={updateReport.isPending}
                  className="flex-1"
                >
                  Marquer traité
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateReport.mutate({ id: selected.id, status: "rejected", admin_notes: adminNotes })}
                  disabled={updateReport.isPending}
                  className="flex-1"
                >
                  Rejeter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
