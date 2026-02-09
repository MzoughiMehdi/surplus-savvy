import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Euro, CheckCircle, Clock, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

const AdminPayouts = () => {
  const queryClient = useQueryClient();
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: restaurants } = useQuery({
    queryKey: ["admin-restaurants-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name")
        .order("name");
      return data ?? [];
    },
  });

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts", restaurantFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("restaurant_payouts")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (restaurantFilter !== "all") {
        query = query.eq("restaurant_id", restaurantFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (dateFrom) {
        query = query.gte("created_at", `${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        query = query.lte("created_at", `${dateTo}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (payoutId: string) => {
      const { error } = await supabase
        .from("restaurant_payouts")
        .update({ status: "paid" })
        .eq("id", payoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast.success("Paiement marqué comme effectué");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Paiements</h1>

      {/* Filters */}
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
                    if (!e.target.value) {
                      setRestaurantFilter("all");
                    }
                    setComboOpen(true);
                  }}
                  onFocus={() => setComboOpen(true)}
                  className="pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSearchQuery("");
                      setRestaurantFilter("all");
                      setComboOpen(false);
                    }}
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
                        <CommandItem
                          key={r.id}
                          value={r.name}
                          onSelect={() => {
                            setRestaurantFilter(r.id);
                            setSearchQuery(r.name);
                            setComboOpen(false);
                          }}
                        >
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
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date début</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date fin</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!payouts || payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.restaurants?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="font-bold">{Number(p.total_amount).toFixed(2)}€</TableCell>
                    <TableCell className="text-sm">{Number(p.platform_amount).toFixed(2)}€</TableCell>
                    <TableCell className="text-sm">{Number(p.restaurant_amount).toFixed(2)}€</TableCell>
                    <TableCell><Badge variant="outline">{p.commission_rate}%</Badge></TableCell>
                    <TableCell>
                      {p.status === "paid" ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="mr-1 h-3 w-3" /> Payé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-warning border-warning/30">
                          <Clock className="mr-1 h-3 w-3" /> En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markPaid.mutate(p.id)}
                          disabled={markPaid.isPending}
                        >
                          Marquer payé
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

export default AdminPayouts;
