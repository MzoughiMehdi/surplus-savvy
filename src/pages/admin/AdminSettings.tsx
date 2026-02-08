import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Euro, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [rateValue, setRateValue] = useState<number | null>(null);

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ["restaurant-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_payouts")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const updateRate = useMutation({
    mutationFn: async (newRate: number) => {
      if (!settings?.id) throw new Error("No settings found");
      const { error } = await supabase
        .from("platform_settings")
        .update({ commission_rate: newRate, updated_at: new Date().toISOString() })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Taux de commission mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
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
      queryClient.invalidateQueries({ queryKey: ["restaurant-payouts"] });
      toast.success("Paiement marqué comme effectué");
    },
  });

  const currentRate = rateValue ?? settings?.commission_rate ?? 50;

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Commission Rate */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Taux de commission</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Pourcentage prélevé par la plateforme sur chaque commande. Le reste est versé au restaurant.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Slider
              value={[currentRate]}
              onValueChange={([v]) => setRateValue(v)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="w-14 text-right text-lg font-bold text-primary">{currentRate}%</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Exemple : commande de 10€</span>
            <div className="flex gap-4">
              <span className="text-foreground">Plateforme : <strong>{(10 * currentRate / 100).toFixed(2)}€</strong></span>
              <span className="text-foreground">Restaurant : <strong>{(10 * (100 - currentRate) / 100).toFixed(2)}€</strong></span>
            </div>
          </div>

          {rateValue !== null && rateValue !== settings?.commission_rate && (
            <Button
              onClick={() => updateRate.mutate(currentRate)}
              disabled={updateRate.isPending}
            >
              {updateRate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sauvegarder
            </Button>
          )}
        </div>
      </div>

      {/* Payouts List */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Euro className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Historique des paiements</h2>
        </div>

        {loadingPayouts ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : !payouts || payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.restaurants?.name ?? "Restaurant"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: fr })}
                    {" · "}Commission {p.commission_rate}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{Number(p.total_amount).toFixed(2)}€</p>
                    <p className="text-[10px] text-muted-foreground">
                      Plateforme: {Number(p.platform_amount).toFixed(2)}€ · Restaurant: {Number(p.restaurant_amount).toFixed(2)}€
                    </p>
                  </div>
                  {p.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markPaid.mutate(p.id)}
                      disabled={markPaid.isPending}
                    >
                      <Clock className="mr-1 h-3 w-3" /> Marquer payé
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      <CheckCircle className="mr-1 h-3 w-3" /> Payé
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
