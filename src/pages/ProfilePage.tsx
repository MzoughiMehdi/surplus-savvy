import { User, ShoppingBag, Settings, HelpCircle, LogOut, ChevronRight, Leaf } from "lucide-react";

const ProfilePage = () => {
  const menuItems = [
    { icon: ShoppingBag, label: "Mes commandes", description: "Historique et commandes en cours" },
    { icon: Leaf, label: "Mon impact", description: "Repas sauvés et CO₂ évité" },
    { icon: Settings, label: "Paramètres", description: "Notifications, langue, compte" },
    { icon: HelpCircle, label: "Aide & Contact", description: "FAQ et support client" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-14 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Profil</h1>
      </div>

      {/* Avatar + info */}
      <div className="mx-5 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Utilisateur</p>
          <p className="text-sm text-muted-foreground">Connectez-vous pour profiter de toutes les fonctionnalités</p>
        </div>
      </div>

      {/* Bouton connexion */}
      <div className="mx-5 mt-4">
        <button className="w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
          Se connecter / S'inscrire
        </button>
      </div>

      {/* Stats */}
      <div className="mx-5 mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-eco-light p-3 text-center">
          <p className="text-xl font-bold text-primary">0</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Repas sauvés</p>
        </div>
        <div className="rounded-xl bg-eco-light p-3 text-center">
          <p className="text-xl font-bold text-primary">0 kg</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">CO₂ évité</p>
        </div>
        <div className="rounded-xl bg-eco-light p-3 text-center">
          <p className="text-xl font-bold text-primary">0 €</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Économisé</p>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-5 mt-6 overflow-hidden rounded-2xl bg-card shadow-sm">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50 active:bg-secondary ${
                i !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4.5 w-4.5 text-foreground" />
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

      {/* Déconnexion */}
      <div className="mx-5 mt-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">Version 1.0.0</p>
    </div>
  );
};

export default ProfilePage;
