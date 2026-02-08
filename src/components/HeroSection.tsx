import heroImage from "@/assets/hero-food.jpg";
import { MapPin, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onExplore: () => void;
}

const HeroSection = ({ onExplore }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Nourriture fraîche sauvée du gaspillage"
          className="h-full w-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(173,80%,15%)]/60 via-[hsl(173,80%,20%)]/30 to-background" />
      </div>

      <div className="relative px-6 pb-10 pt-16">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Offres disponibles près de vous
        </div>

        <h1 className="mt-2 font-display text-4xl font-bold leading-[1.1] text-primary-foreground drop-shadow-lg">
          Sauvez des repas,<br />
          <span className="text-gradient-warm">savourez la différence</span>
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/85 drop-shadow">
          Jusqu'à -70% sur les surplus des meilleurs restaurants. Bon pour le portefeuille, génial pour la planète.
        </p>

        <button
          onClick={onExplore}
          className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Trouver des offres</p>
            <p className="text-xs text-muted-foreground">Autour de vous maintenant</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
