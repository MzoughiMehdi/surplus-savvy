import { useState } from "react";
import { Calendar, Hash, Clock, Pause, RotateCcw, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DailyOverride } from "@/hooks/useDailyOverrides";
import type { SurpriseBagConfig } from "@/hooks/useSurpriseBagConfig";

interface Props {
  date: string;
  config: SurpriseBagConfig;
  override?: DailyOverride;
  reservedCount: number;
  onSave: (date: string, updates: Partial<Pick<DailyOverride, "quantity" | "pickup_start" | "pickup_end" | "is_suspended">>) => Promise<void>;
  onReset: (date: string) => Promise<void>;
  onClose: () => void;
}

const DayOverridePanel = ({ date, config, override, reservedCount, onSave, onReset, onClose }: Props) => {
  const [quantity, setQuantity] = useState(override?.quantity ?? config.daily_quantity);
  const [pickupStart, setPickupStart] = useState(override?.pickup_start?.slice(0, 5) ?? config.pickup_start?.slice(0, 5) ?? "18:00");
  const [pickupEnd, setPickupEnd] = useState(override?.pickup_end?.slice(0, 5) ?? config.pickup_end?.slice(0, 5) ?? "20:00");
  const [isSuspended, setIsSuspended] = useState(override?.is_suspended ?? false);
  const [saving, setSaving] = useState(false);

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const handleSave = async () => {
    if (quantity < reservedCount) {
      toast.error(`Minimum ${reservedCount} (déjà réservés)`);
      return;
    }
    setSaving(true);
    try {
      await onSave(date, { quantity, pickup_start: pickupStart, pickup_end: pickupEnd, is_suspended: isSuspended });
      toast.success("Jour mis à jour");
      onClose();
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await onReset(date);
      toast.success("Réinitialisé aux valeurs par défaut");
      onClose();
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2 capitalize">
          <Calendar className="h-4 w-4 text-primary" />
          {dateLabel}
        </p>
        {reservedCount > 0 && (
          <span className="text-[10px] bg-accent/20 text-accent-foreground rounded-full px-2 py-0.5 font-medium">
            {reservedCount} réservé(s)
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Suspend toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Pause className="h-3 w-3" /> Suspendre la vente
          </label>
          <Switch checked={isSuspended} onCheckedChange={setIsSuspended} />
        </div>

        {!isSuspended && (
          <>
            {/* Quantity */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Hash className="h-3 w-3" /> Nombre de paniers
              </label>
              <input
                type="number"
                min={reservedCount}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-24 rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Pickup window */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3" /> Créneau de retrait
              </label>
              <div className="flex items-center gap-2">
                <input type="time" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)}
                  className="rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <span className="text-xs text-muted-foreground">à</span>
                <input type="time" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)}
                  className="rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {override && (
          <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} className="flex-1">
            <RotateCcw className="mr-1 h-3 w-3" /> Réinitialiser
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default DayOverridePanel;
