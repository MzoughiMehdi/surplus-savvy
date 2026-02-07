import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Mode = "login" | "signup" | "merchant-signup";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectByRole = async (userId: string, fallback: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.role === "merchant") {
      navigate("/dashboard");
    } else {
      navigate(fallback);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("Email ou mot de passe incorrect");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Veuillez confirmer votre email avant de vous connecter");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Connexion réussie !");
        if (authData.user) {
          await redirectByRole(authData.user.id, "/");
        }
      } else {
        const role = mode === "merchant-signup" ? "merchant" : "consumer";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, role },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Cet email est déjà utilisé");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-8 pt-12">
      <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {mode === "login" ? "Bon retour !" : mode === "signup" ? "Créer un compte" : "Devenir partenaire"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Connectez-vous pour retrouver vos offres"
            : mode === "signup"
              ? "Rejoignez la lutte contre le gaspillage alimentaire"
              : "Inscrivez votre restaurant et commencez à vendre vos surplus"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode !== "login" && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "S'inscrire"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        {mode === "login" ? (
          <>
            <p className="text-muted-foreground">
              Pas encore de compte ?{" "}
              <button onClick={() => setMode("signup")} className="font-semibold text-primary">
                S'inscrire
              </button>
            </p>
            <p className="text-muted-foreground">
              Vous êtes restaurateur ?{" "}
              <button onClick={() => setMode("merchant-signup")} className="font-semibold text-accent">
                Devenir partenaire
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              Déjà un compte ?{" "}
              <button onClick={() => setMode("login")} className="font-semibold text-primary">
                Se connecter
              </button>
            </p>
            {mode === "signup" ? (
              <p className="text-muted-foreground">
                Vous êtes restaurateur ?{" "}
                <button onClick={() => setMode("merchant-signup")} className="font-semibold text-accent">
                  Devenir partenaire
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Simple consommateur ?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-primary">
                  Inscription classique
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
