import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Clock, Trash2, Edit2, BarChart3, Store, LogOut, QrCode, CheckCircle, Users, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import RestaurantImageUpload from "@/components/RestaurantImageUpload";
import OfferImageUpload from "@/components/OfferImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription, MERCHANT_PLAN } from "@/hooks/useSubscription";

interface RestaurantData {
  id: string;
  name: string;
  subscription_plan: string;
  trial_ends_at: string;
  status: string;
  image_url: string | null;
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
  image_url: string | null;
}

interface ReservationData {
  id: string;
  pickup_code: string;
  status: string;
  created_at: string;
  user_id: string;
  offers: { title: string; discounted_price: number };
  customer_name?: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const subscription = useSubscription();
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
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
  const [offerImageUrl, setOfferImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data: restList } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1);

    const rest = restList?.[0] ?? null;
    if (!rest) { navigate("/merchant-onboarding"); return; }
    setRestaurant(rest);

    const [{ data: off }, { data: res }] = await Promise.all([
      supabase
        .from("offers")
        .select("*")
        .eq("restaurant_id", rest.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reservations")
        .select("id, pickup_code, status, created_at, user_id, offers(title, discounted_price)")
        .eq("restaurant_id", rest.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setOffers(off || []);
    setReservations((res as unknown as ReservationData[]) || []);
    setLoading(false);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    const origPrice = parseFloat(originalPrice);
    const discPrice = parseFloat(discountedPrice);
    const qty = parseInt(quantity);

    if (!restaurant || !title.trim()) {
      toast.error("Titre requis");
      return;
    }
    if (isNaN(origPrice) || origPrice <= 0 || origPrice > 10000) {
      toast.error("Prix original invalide (0.01€ - 10 000€)");
      return;
    }
    if (isNaN(discPrice) || discPrice <= 0 || discPrice > 10000) {
      toast.error("Prix réduit invalide (0.01€ - 10 000€)");
      return;
    }
    if (discPrice >= origPrice) {
      toast.error("Le prix réduit doit être inférieur au prix original");
      return;
    }
    if (isNaN(qty) || qty <= 0 || qty > 1000) {
      toast.error("Quantité invalide (1-1000)");
      return;
    }
    if (pickupStart >= pickupEnd) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    const { error } = await supabase.from("offers").insert({
      restaurant_id: restaurant.id,
      title: title.trim(),
      description: description.trim() || null,
      original_price: origPrice,
      discounted_price: discPrice,
      quantity: qty,
      items_left: qty,
      pickup_start: pickupStart,
      pickup_end: pickupEnd,
      category,
      image_url: offerImageUrl,
    });

    if (error) { toast.error(error.message); return; }

    toast.success("Offre créée !");
    setShowForm(false);
    setTitle(""); setDescription(""); setOriginalPrice(""); setDiscountedPrice(""); setOfferImageUrl(null);
    setQuantity("1"); setPickupStart("18:00"); setPickupEnd("20:00");
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
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => { signOut(); navigate("/"); }} className="rounded-full bg-secondary p-2.5">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Restaurant Photo */}
      {restaurant && user && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">Photo du restaurant</p>
          <RestaurantImageUpload
            imageUrl={restaurant.image_url}
            onImageChange={(url) => setRestaurant((r) => r ? { ...r, image_url: url } : r)}
            restaurantId={restaurant.id}
            userId={user.id}
          />
        </div>
      )}

      {/* Status / Trial */}
      {/* Subscription Management */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Abonnement
            </p>
            {subscription.subscribed ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Plan {MERCHANT_PLAN.name} · 
                Renouvellement {subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString("fr-FR") : ""}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Essai gratuit · {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant{trialDaysLeft > 1 ? "s" : ""}</p>
            )}
          </div>
          {subscription.subscribed ? (
            <Button size="sm" variant="outline" onClick={async () => {
              try { await subscription.openPortal(); } catch { toast.error("Impossible d'ouvrir le portail"); }
            }}>
              Gérer <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={async () => {
              try { await subscription.startCheckout(); } catch { toast.error("Erreur de paiement"); }
            }}>{MERCHANT_PLAN.name} {MERCHANT_PLAN.price}€/mois</Button>
          )}
        </div>
      </div>

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
          {user && (
            <OfferImageUpload imageUrl={offerImageUrl} onImageChange={setOfferImageUrl} userId={user.id} />
          )}
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
              <div key={offer.id} className={`rounded-xl bg-card shadow-sm overflow-hidden ${!offer.is_active ? "opacity-50" : ""}`}>
                {offer.image_url && (
                  <img src={offer.image_url} alt={offer.title} className="h-28 w-full object-cover" />
                )}
                <div className="p-4">
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
                  {user && (
                    <div className="mt-3">
                      <OfferImageUpload
                        imageUrl={offer.image_url}
                        onImageChange={(url) => {
                          setOffers((prev) => prev.map((o) => o.id === offer.id ? { ...o, image_url: url } : o));
                        }}
                        offerId={offer.id}
                        userId={user.id}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservations */}
      <div className="mt-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          <Users className="mr-2 inline h-5 w-5" />
          Réservations récentes
        </h2>
        {reservations.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">Aucune réservation</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.offers.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Client</p>
                    <div className="mt-1 flex items-center gap-2">
                      <QrCode className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs font-bold text-primary">{r.pickup_code.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={r.status === "confirmed" ? "default" : r.status === "completed" ? "secondary" : "destructive"} className="text-[10px]">
                      {r.status === "confirmed" ? "À retirer" : r.status === "completed" ? "Retiré" : "Annulé"}
                    </Badge>
                    <span className="text-sm font-bold text-primary">€{r.offers.discounted_price}</span>
                  </div>
                </div>
                {r.status === "confirmed" && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={async () => {
                      await supabase.from("reservations").update({ status: "completed" }).eq("id", r.id);
                      toast.success("Commande marquée comme retirée !");
                      fetchData();
                    }}
                  >
                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Marquer comme retiré
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
