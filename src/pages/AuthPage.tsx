import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Mode = "login" | "signup" | "merchant-signup" | "forgot-password";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading, profileLoading, isAdmin, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signup" ? "signup" : "login";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasRedirected = useRef(false);
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get("redirect");

  // Auto-redirect when OAuth session is detected
  useEffect(() => {
    if (!loading && !profileLoading && user && !hasRedirected.current) {
      if (redirectParam === "admin") {
        if (isAdmin) {
          hasRedirected.current = true;
          navigate("/admin/settings", { replace: true });
        } else {
          // Not admin — sign out so the real admin can log in
          signOut();
        }
        return;
      }
      hasRedirected.current = true;
      const name = profile?.full_name || user.user_metadata?.full_name;
      toast.success(name ? `Bienvenue ${name} !` : "Bienvenue !");
      navigate("/home", { replace: true });
    }
  }, [user, loading, profile, navigate, isAdmin, redirectParam, signOut]);

  const redirectByRole = async (userId: string, fallback: string) => {
    // Check if admin redirect requested
    if (redirectParam === "admin") {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) {
        navigate("/admin/settings");
        return;
      }
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.role === "merchant") {
      navigate("/dashboard");
    } else {
      navigate("/home");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Un email de réinitialisation a été envoyé !");
      setMode("login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot-password") {
      return handleForgotPassword(e);
    }
    if (!email.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-8 pt-12">
      <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {mode === "login" ? "Bon retour !" : mode === "signup" ? "Créer un compte" : mode === "forgot-password" ? "Mot de passe oublié" : "Devenir partenaire"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Connectez-vous pour retrouver vos offres"
            : mode === "signup"
              ? "Rejoignez la lutte contre le gaspillage alimentaire"
              : mode === "forgot-password"
                ? "Entrez votre email pour recevoir un lien de réinitialisation"
                : "Inscrivez votre restaurant et commencez à vendre vos surplus"}
        </p>
      </div>

      {(mode === "login" || mode === "signup") && (
        <div className="mb-6 space-y-3">
          <button
            type="button"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin + "/home",
              });
              if (error) toast.error("Erreur avec Google : " + error.message);
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-card py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>
          <button
            type="button"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin + "/home",
              });
              if (error) toast.error("Erreur avec Apple : " + error.message);
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-foreground py-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continuer avec Apple
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode !== "login" && mode !== "forgot-password" && (
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

        {mode !== "forgot-password" && (
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
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? "Chargement..." : mode === "login" ? "Se connecter" : mode === "forgot-password" ? "Envoyer le lien" : "S'inscrire"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        {mode === "login" ? (
          <>
            <p className="text-muted-foreground">
              <button onClick={() => setMode("forgot-password")} className="font-semibold text-primary">
                Mot de passe oublié ?
              </button>
            </p>
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
        ) : mode === "forgot-password" ? (
          <p className="text-muted-foreground">
            Retour à la{" "}
            <button onClick={() => setMode("login")} className="font-semibold text-primary">
              connexion
            </button>
          </p>
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
