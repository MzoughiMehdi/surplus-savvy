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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)]">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="group relative flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all"
            >
              {isActive && (
                <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-primary" />
              )}
              <Icon
                className={`h-5 w-5 transition-all ${
                  isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
                }`}
                fill={isActive && tab.id === "favorites" ? "currentColor" : "none"}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
