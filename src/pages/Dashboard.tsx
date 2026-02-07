import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Clock, Trash2, Edit2, BarChart3, Store, LogOut } from "lucide-react";
import { toast } from "sonner";

interface RestaurantData {
  id: string;
  name: string;
  subscription_plan: string;
  trial_ends_at: string;
  status: string;
}

interface OfferData {
  id: string;
  title: string;
  original_price: number;
  discounted_price: number;
  items_left: number;
  pickup_start: string;
  pickup_end: string;
  is_active: boolean;
  category: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupStart, setPickupStart] = useState("18:00");
  const [pickupEnd, setPickupEnd] = useState("20:00");
  const [category, setCategory] = useState("meals");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data: rest } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!rest) { navigate("/merchant-onboarding"); return; }
    setRestaurant(rest);

    const { data: off } = await supabase
      .from("offers")
      .select("*")
      .eq("restaurant_id", rest.id)
      .order("created_at", { ascending: false });

    setOffers(off || []);
    setLoading(false);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !title.trim() || !originalPrice || !discountedPrice) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }

    const { error } = await supabase.from("offers").insert({
      restaurant_id: restaurant.id,
      title: title.trim(),
      description: description.trim() || null,
      original_price: parseFloat(originalPrice),
      discounted_price: parseFloat(discountedPrice),
      quantity: parseInt(quantity),
      items_left: parseInt(quantity),
      pickup_start: pickupStart,
      pickup_end: pickupEnd,
      category,
    });

    if (error) { toast.error(error.message); return; }

    toast.success("Offre créée !");
    setShowForm(false);
    setTitle(""); setDescription(""); setOriginalPrice(""); setDiscountedPrice("");
    fetchData();
  };

  const toggleOffer = async (id: string, active: boolean) => {
    await supabase.from("offers").update({ is_active: !active }).eq("id", id);
    fetchData();
  };

  const deleteOffer = async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    toast.success("Offre supprimée");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const trialDaysLeft = restaurant?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(restaurant.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="min-h-screen bg-background px-5 pb-8 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
        </div>
        <button onClick={() => { signOut(); navigate("/"); }} className="rounded-full bg-secondary p-2.5">
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Status / Trial */}
      {restaurant?.subscription_plan === "trial" && (
        <div className="mt-4 rounded-xl bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">✨ Essai gratuit</p>
          <p className="text-xs text-muted-foreground">{trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant{trialDaysLeft > 1 ? "s" : ""}</p>
        </div>
      )}

      {restaurant?.status === "pending" && (
        <div className="mt-4 rounded-xl bg-warning/10 p-4">
          <p className="text-sm font-semibold text-warning">⏳ En attente de validation</p>
          <p className="text-xs text-muted-foreground">Votre restaurant sera visible après approbation</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <Package className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 text-xl font-bold text-foreground">{offers.length}</p>
          <p className="text-[10px] text-muted-foreground">Offres</p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <BarChart3 className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-1 text-xl font-bold text-foreground">{offers.filter((o) => o.is_active).length}</p>
          <p className="text-[10px] text-muted-foreground">Actives</p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm">
          <Store className="mx-auto h-5 w-5 text-success" />
          <p className="mt-1 text-xl font-bold text-foreground capitalize">{restaurant?.subscription_plan}</p>
          <p className="text-[10px] text-muted-foreground">Plan</p>
        </div>
      </div>

      {/* Create offer button */}
      <button onClick={() => setShowForm(!showForm)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
        <Plus className="h-4 w-4" /> {showForm ? "Annuler" : "Nouvelle offre"}
      </button>

      {/* Create offer form */}
      {showForm && (
        <form onSubmit={handleCreateOffer} className="mt-4 animate-fade-in-up space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <input type="text" placeholder="Titre de l'offre *" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" placeholder="Prix original *" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="number" step="0.01" placeholder="Prix réduit *" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="Quantité" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="time" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="time" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground">
            Créer l'offre
          </button>
        </form>
      )}

      {/* Offers list */}
      <div className="mt-6">
        <h2 className="font-display text-lg font-bold text-foreground">Vos offres</h2>
        {offers.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">Aucune offre pour le moment</p>
        ) : (
          <div className="mt-3 space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className={`rounded-xl bg-card p-4 shadow-sm ${!offer.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{offer.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {offer.pickup_start} – {offer.pickup_end}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground line-through">€{offer.original_price}</span>
                      <span className="text-sm font-bold text-primary">€{offer.discounted_price}</span>
                      <span className="text-xs text-muted-foreground">· {offer.items_left} restant(s)</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleOffer(offer.id, offer.is_active)}
                      className="rounded-lg bg-secondary p-2 text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteOffer(offer.id)}
                      className="rounded-lg bg-secondary p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
