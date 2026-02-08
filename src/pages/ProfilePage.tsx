import { User, ShoppingBag, Settings, HelpCircle, LogOut, ChevronRight, Leaf, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProfilePage = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: ShoppingBag, label: "Mes commandes", description: "Historique et commandes en cours" },
    { icon: Leaf, label: "Mon impact", description: "Repas sauvés et économies" },
    { icon: Settings, label: "Paramètres", description: "Notifications, langue, compte" },
    { icon: HelpCircle, label: "Aide & Contact", description: "FAQ et support client" },
  ];

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, offer_id, offers(discounted_price, original_price)")
        .eq("user_id", user!.id)
        .eq("status", "completed");

      const mealsSaved = reservations?.length ?? 0;
      const eurosSaved = reservations?.reduce((sum, r) => {
        const offer = r.offers as any;
        if (!offer) return sum;
        return sum + (Number(offer.original_price) - Number(offer.discounted_price));
      }, 0) ?? 0;

      return { mealsSaved, eurosSaved };
    },
  });

  const handleAuth = () => navigate("/auth");
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Profil</h1>
      </div>

      <div className="mx-5 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-7 w-7" />
        </div>
        <div className="flex-1">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{profile?.full_name || user.email}</p>
                <Badge variant={profile?.role === "merchant" ? "default" : "secondary"} className="text-[10px]">
                  {profile?.role === "merchant" ? "Commerçant" : profile?.role === "admin" ? "Admin" : "Consommateur"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">Utilisateur</p>
              <p className="text-sm text-muted-foreground">Connectez-vous pour profiter de toutes les fonctionnalités</p>
            </>
          )}
        </div>
      </div>

      <div className="mx-5 mt-4 space-y-3">
        {user ? (
          <>
            {isAdmin && (
              <button onClick={() => navigate("/admin")}
                className="w-full rounded-xl bg-foreground py-3.5 text-center text-sm font-bold text-background shadow-md transition-transform active:scale-[0.98]">
                🛡️ Back-office Admin
              </button>
            )}
            {profile?.role === "merchant" && (
              <>
                <button onClick={() => navigate("/dashboard")}
                  className="w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-accent-foreground shadow-md transition-transform active:scale-[0.98]">
                  <span className="flex items-center justify-center gap-2"><Store className="h-4 w-4" /> Tableau de bord restaurant</span>
                </button>
                <button onClick={() => navigate("/dashboard")}
                  className="w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-accent-foreground shadow-md transition-transform active:scale-[0.98]">
                  <span className="flex items-center justify-center gap-2"><Store className="h-4 w-4" /> Tableau de bord restaurant</span>
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <button onClick={handleAuth}
              className="w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
              Se connecter / S'inscrire
            </button>
            <button onClick={() => navigate("/merchant-onboarding")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary">
              <Store className="h-4 w-4" /> Vous êtes commerçant ?
            </button>
          </>
        )}
      </div>

      {user && (
        <>
          {/* Stats */}
          <div className="mx-5 mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-eco-light p-3 text-center">
              <p className="text-xl font-bold text-primary">{stats?.mealsSaved ?? 0}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Repas sauvés</p>
            </div>
            <div className="rounded-xl bg-eco-light p-3 text-center">
              <p className="text-xl font-bold text-primary">{(stats?.eurosSaved ?? 0).toFixed(0)} €</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Économisé</p>
            </div>
          </div>

          {/* Menu */}
          <div className="mx-5 mt-6 overflow-hidden rounded-2xl bg-card shadow-sm">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={item.label}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50 active:bg-secondary ${
                    i !== menuItems.length - 1 ? "border-b border-border" : ""
                  }`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </>
      )}


      {user && (
        <div className="mx-5 mt-4">
          <button onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">Version 1.0.0</p>
    </div>
  );
};

export default ProfilePage;
