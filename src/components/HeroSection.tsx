import heroImage from "@/assets/hero-food.jpg";
import { MapPin } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-b-[2rem]">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Fresh food saved from waste"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
      </div>

      <div className="relative px-5 pb-8 pt-14">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
          <span className="text-sm">🌱</span> Save food, save the planet
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary-foreground">
          Rescue delicious meals near you
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
          Get surplus food from top restaurants at up to 70% off. Good for you, great for the planet.
        </p>

        <button className="mt-5 flex w-full items-center gap-3 rounded-xl bg-primary-foreground/95 px-4 py-3.5 text-left shadow-lg backdrop-blur-sm transition-transform active:scale-[0.98]">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Find offers nearby</p>
            <p className="text-xs text-muted-foreground">Enable location or enter address</p>
          </div>
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
