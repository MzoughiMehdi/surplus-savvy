import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
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

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  confirmed: { label: "En attente", variant: "outline" },
  accepted: { label: "Acceptée", variant: "default" },
  completed: { label: "Retirée", variant: "secondary" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

const AdminReservations = () => {
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

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations", restaurantFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select("*, restaurants(name), offers(title), profiles:user_id(email, full_name)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (restaurantFilter !== "all") query = query.eq("restaurant_id", restaurantFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Réservations</h1>

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
              <SelectItem value="confirmed">En attente</SelectItem>
              <SelectItem value="accepted">Acceptée</SelectItem>
              <SelectItem value="completed">Retirée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
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
                <TableHead>Offre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Code retrait</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!reservations || reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune réservation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((r: any) => {
                  const s = statusMap[r.status] ?? statusMap.confirmed;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.profiles?.full_name || r.profiles?.email || "—"}
                      </TableCell>
                      <TableCell>{r.restaurants?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.offers?.title ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.pickup_code?.toUpperCase()}</TableCell>
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

export default AdminReservations;
