import { useState, useEffect } from "react";
import { Package, Clock, Euro, Hash, ImagePlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { SurpriseBagConfig as ConfigType } from "@/hooks/useSurpriseBagConfig";
import OfferImageUpload from "@/components/OfferImageUpload";

interface Props {
  config: ConfigType | null;
  onUpdate: (updates: Partial<Omit<ConfigType, "id" | "restaurant_id">>) => Promise<void>;
  userId: string;
}

const SurpriseBagConfig = ({ config, onUpdate, userId }: Props) => {
  const [basePrice, setBasePrice] = useState(config?.base_price ?? 15);
  const [quantity, setQuantity] = useState(config?.daily_quantity ?? 5);
  const [pickupStart, setPickupStart] = useState(config?.pickup_start?.slice(0, 5) ?? "18:00");
  const [pickupEnd, setPickupEnd] = useState(config?.pickup_end?.slice(0, 5) ?? "20:00");
  const [isActive, setIsActive] = useState(config?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setBasePrice(config.base_price);
      setQuantity(config.daily_quantity);
      setPickupStart(config.pickup_start?.slice(0, 5) ?? "18:00");
      setPickupEnd(config.pickup_end?.slice(0, 5) ?? "20:00");
      setIsActive(config.is_active);
    }
  }, [config]);

  const salePrice = (basePrice * 0.4).toFixed(2);

  const handleSave = async (field: string, value: any) => {
    setSaving(true);
    try {
      await onUpdate({ [field]: value });
      toast.success("Configuration mise à jour");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Panier surprise
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isActive ? "Actif" : "Inactif"}</span>
          <Switch
            checked={isActive}
            onCheckedChange={(v) => {
              setIsActive(v);
              handleSave("is_active", v);
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Base price */}
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Euro className="h-3 w-3" /> Valeur réelle du panier
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              step="0.50"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              onBlur={() => {
                if (basePrice >= 10) handleSave("base_price", basePrice);
                else { toast.error("Minimum 10€"); setBasePrice(config?.base_price ?? 10); }
              }}
              className="w-24 rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-sm text-muted-foreground">→</span>
            <div className="rounded-xl bg-primary/10 px-4 py-2.5">
              <span className="text-sm font-bold text-primary">{salePrice} €</span>
              <span className="ml-1 text-[10px] text-muted-foreground">prix de vente (-60%)</span>
            </div>
          </div>
        </div>

        {/* Daily quantity */}
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Hash className="h-3 w-3" /> Paniers par jour
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            onBlur={() => {
              if (quantity >= 1) handleSave("daily_quantity", quantity);
              else { setQuantity(config?.daily_quantity ?? 5); }
            }}
            className="w-24 rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Pickup window */}
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3" /> Créneau de retrait par défaut
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={pickupStart}
              onChange={(e) => setPickupStart(e.target.value)}
              onBlur={() => handleSave("pickup_start", pickupStart)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-xs text-muted-foreground">à</span>
            <input
              type="time"
              value={pickupEnd}
              onChange={(e) => setPickupEnd(e.target.value)}
              onBlur={() => handleSave("pickup_end", pickupEnd)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {/* Bag photo */}
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <ImagePlus className="h-3 w-3" /> Photo du panier
          </label>
          <OfferImageUpload
            imageUrl={config?.image_url ?? null}
            onImageChange={(url) => handleSave("image_url", url)}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
};

export default SurpriseBagConfig;
