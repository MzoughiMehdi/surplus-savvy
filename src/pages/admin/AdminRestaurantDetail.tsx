import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Phone, Mail,
  MapPin, Tag, Calendar, Star, ShoppingBag, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RestaurantDetail {
  id: string;
  name: string;
  address: string;
  category: string;
  status: string;
  description: string | null;
  phone: string | null;
  image_url: string | null;
  subscription_plan: string | null;
  subscription_start: string | null;
  trial_ends_at: string | null;
  opening_hours: any;
  owner_id: string;
  created_at: string;
}

interface OwnerProfile {
  full_name: string | null;
  email: string | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "En attente", icon: Clock, className: "bg-warning/20 text-warning border-warning/30" },
  approved: { label: "Approuvé", icon: CheckCircle, className: "bg-primary/20 text-primary border-primary/30" },
  rejected: { label: "Rejeté", icon: XCircle, className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const AdminRestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [rating, setRating] = useState<{ avg: number | null; count: number }>({ avg: null, count: 0 });
  const [offersCount, setOffersCount] = useState(0);
  const [reservationsCount, setReservationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      // Restaurant
      const { data: r } = await supabase.from("restaurants").select("*").eq("id", id).single();
      if (!r) { setLoading(false); return; }
      setRestaurant(r);

      // Owner profile
      const { data: p } = await supabase.from("profiles").select("full_name, email").eq("user_id", r.owner_id).maybeSingle();
      setOwner(p);

      // Rating
      const { data: rat } = await supabase.rpc("get_restaurant_rating", { p_restaurant_id: id });
      if (rat && rat.length > 0 && rat[0].avg_rating !== null) {
        setRating({ avg: Number(rat[0].avg_rating), count: Number(rat[0].review_count) });
      }

      // Counts
      const { count: oc } = await supabase.from("offers").select("id", { count: "exact", head: true }).eq("restaurant_id", id);
      setOffersCount(oc ?? 0);

      const { count: rc } = await supabase.from("reservations").select("id", { count: "exact", head: true }).eq("restaurant_id", id);
      setReservationsCount(rc ?? 0);

      setLoading(false);
    };

    fetchAll();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    const { error } = await supabase.from("restaurants").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Restaurant ${status === "approved" ? "approuvé" : "rejeté"}`);
    setRestaurant((prev) => prev ? { ...prev, status } : prev);
  };

  if (loading) return <p className="text-muted-foreground p-6">Chargement...</p>;
  if (!restaurant) return <p className="text-muted-foreground p-6">Restaurant introuvable.</p>;

  const st = statusConfig[restaurant.status];
  const StatusIcon = st?.icon ?? Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/restaurants")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${st?.className ?? ""}`}>
          <StatusIcon className="h-4 w-4" />
          {st?.label ?? restaurant.status}
        </span>
      </div>

      {/* Image */}
      {restaurant.image_url && (
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="h-56 w-full rounded-xl object-cover border border-border"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{offersCount}</p>
              <p className="text-xs text-muted-foreground">Offres</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{reservationsCount}</p>
              <p className="text-xs text-muted-foreground">Réservations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Star className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{rating.avg !== null ? rating.avg : "—"}</p>
              <p className="text-xs text-muted-foreground">{rating.count} avis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{restaurant.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="capitalize">{restaurant.category}</Badge>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${restaurant.phone}`} className="text-primary hover:underline">{restaurant.phone}</a>
              </div>
            )}
            {restaurant.description && (
              <>
                <Separator />
                <p className="text-muted-foreground">{restaurant.description}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Owner & Subscription */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Propriétaire</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{owner?.full_name || "—"}</p>
              {owner?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${owner.email}`} className="text-primary hover:underline">{owner.email}</a>
                </div>
              )}
              {owner?.email && (
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <a href={`mailto:${owner.email}?subject=Votre restaurant ${restaurant.name}`}>
                    <Mail className="h-4 w-4 mr-1" /> Contacter
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Abonnement</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Plan :</span>
                <Badge variant="outline" className="capitalize">{restaurant.subscription_plan ?? "—"}</Badge>
              </div>
              {restaurant.subscription_start && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Début : {new Date(restaurant.subscription_start).toLocaleDateString("fr-FR")}</span>
                </div>
              )}
              {restaurant.trial_ends_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Fin essai : {new Date(restaurant.trial_ends_at).toLocaleDateString("fr-FR")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          {restaurant.status === "pending" && (
            <>
              <Button onClick={() => updateStatus("approved")}>Approuver</Button>
              <Button variant="destructive" onClick={() => updateStatus("rejected")}>Rejeter</Button>
            </>
          )}
          {restaurant.status === "approved" && (
            <Button variant="outline" onClick={() => updateStatus("rejected")}>Suspendre</Button>
          )}
          {restaurant.status === "rejected" && (
            <Button variant="outline" onClick={() => updateStatus("approved")}>Réactiver</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRestaurantDetail;
