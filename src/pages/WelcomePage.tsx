import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-food.jpg";
import { ArrowRight, Leaf } from "lucide-react";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Skip welcome page if already authenticated or guest
  useEffect(() => {
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
    if (sessionStorage.getItem("guest_mode") === "true") {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Nourriture fraîche"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(180,10%,5%)] via-[hsl(180,10%,5%)]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-10">
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 backdrop-blur-sm">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary-foreground">Anti-gaspi</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-white">
            Sauvez des repas,{"\n"}
            <span className="text-[hsl(var(--accent))]">faites des économies</span>
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
            Récupérez les surplus des meilleurs restaurants près de chez vous à petit prix.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/auth")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
          >
            Se connecter
          </button>

          <button
            onClick={() => {
              // Navigate to auth page in signup mode
              navigate("/auth?mode=signup");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 py-4 text-sm font-bold text-white backdrop-blur-sm transition-transform active:scale-[0.98]"
          >
            Créer un compte
          </button>

          <button
            onClick={() => {
              sessionStorage.setItem("guest_mode", "true");
              navigate("/home");
            }}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Continuer en tant qu'invité
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => navigate("/auth?mode=merchant-signup")}
            className="flex w-full items-center justify-center gap-1 py-2 text-xs text-white/50 transition-colors hover:text-white/80"
          >
            Vous êtes commerçant ?{" "}
            <span className="font-semibold text-[hsl(var(--accent))]">Devenir partenaire</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
