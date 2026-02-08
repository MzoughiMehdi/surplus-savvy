import { Home, Search, Heart, User, ShoppingBag } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "explore", label: "Explorer", icon: Search },
  { id: "orders", label: "Commandes", icon: ShoppingBag },
  { id: "favorites", label: "Favoris", icon: Heart },
  { id: "profile", label: "Profil", icon: User },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50">
      <div
        className="mx-auto max-w-md rounded-2xl border border-border/30 bg-foreground/90 shadow-[0_8px_32px_-4px_hsl(var(--foreground)/0.35)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="group relative flex flex-col items-center gap-0.5 px-3 py-1 transition-all"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-primary shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.5)]"
                      : "group-hover:bg-background/10"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] transition-all duration-300 ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-background/60 group-hover:text-background/90"
                    }`}
                    fill={isActive && tab.id === "favorites" ? "currentColor" : "none"}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className={`text-[9px] font-medium tracking-wide transition-all duration-300 ${
                    isActive ? "text-primary-foreground" : "text-background/50"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
