import { Leaf, TrendingUp, Users } from "lucide-react";

const ImpactBanner = () => {
  const stats = [
    { icon: Leaf, value: "12,4K", label: "Repas sauvés", color: "text-success" },
    { icon: TrendingUp, value: "8,2T", label: "CO₂ évité", color: "text-primary" },
    { icon: Users, value: "340+", label: "Restaurants", color: "text-accent" },
  ];

  return (
    <div className="mx-5 -mt-2 mb-2">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-card flex flex-col items-center rounded-2xl p-4 shadow-sm"
            >
              <div className={`mb-2 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImpactBanner;
