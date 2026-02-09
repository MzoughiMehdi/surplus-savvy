import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [rateValue, setRateValue] = useState<number | null>(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);

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

  const toggleMaintenance = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!settings?.id) throw new Error("No settings found");
      const { error } = await supabase
        .from("platform_settings")
        .update({
          maintenance_mode: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
      toast.success(enabled ? "Mode maintenance activé" : "Mode maintenance désactivé");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const updateMaintenanceMsg = useMutation({
    mutationFn: async (msg: string) => {
      if (!settings?.id) throw new Error("No settings found");
      const { error } = await supabase
        .from("platform_settings")
        .update({
          maintenance_message: msg || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
      toast.success("Message de maintenance mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const currentRate = rateValue ?? settings?.commission_rate ?? 50;
  const currentMsg = maintenanceMsg ?? settings?.maintenance_message ?? "";

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Maintenance Mode */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Mode maintenance</h2>
          {settings?.maintenance_mode && (
            <Badge variant="destructive" className="text-[10px]">ACTIF</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Quand le mode maintenance est activé, seuls les administrateurs peuvent accéder à l'application.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm font-medium text-foreground">Activer le mode maintenance</span>
            <Switch
              checked={settings?.maintenance_mode ?? false}
              onCheckedChange={(checked) => toggleMaintenance.mutate(checked)}
              disabled={toggleMaintenance.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Message affiché aux utilisateurs</label>
            <Textarea
              placeholder="Notre application est temporairement indisponible pour maintenance. Nous revenons très vite !"
              value={currentMsg}
              onChange={(e) => setMaintenanceMsg(e.target.value)}
              rows={3}
            />
            {maintenanceMsg !== null && maintenanceMsg !== (settings?.maintenance_message ?? "") && (
              <Button
                size="sm"
                onClick={() => updateMaintenanceMsg.mutate(currentMsg)}
                disabled={updateMaintenanceMsg.isPending}
              >
                {updateMaintenanceMsg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder le message
              </Button>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default AdminSettings;
