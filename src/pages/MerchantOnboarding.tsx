import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, MapPin, Hash, Phone, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "bakery", label: "Boulangerie", icon: "🥐" },
  { id: "sushi", label: "Sushi", icon: "🍣" },
  { id: "grocery", label: "Épicerie", icon: "🥬" },
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "other", label: "Autre", icon: "🏪" },
];

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "29",
    period: "/mois",
    features: ["10 offres par mois", "Tableau de bord", "Support email", "Statistiques de base"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "59",
    period: "/mois",
    features: ["Offres illimitées", "Analytique avancée", "Support prioritaire", "Badge « Pro »", "Promotions mises en avant"],
    popular: true,
  },
];

type Step = "info" | "plan" | "confirm";

const MerchantOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [description, setDescription] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("basic");

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }
    if (!name.trim() || !address.trim()) {
      toast.error("Veuillez remplir le nom et l'adresse");
      return;
    }

    setLoading(true);
    try {
      // Update profile role
      await supabase
        .from("profiles")
        .update({ role: "merchant" })
        .eq("user_id", user.id);

      // Create restaurant
      const { error } = await supabase
        .from("restaurants")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          address: address.trim(),
          business_id: businessId.trim() || null,
          phone: phone.trim() || null,
          category,
          description: description.trim() || null,
          subscription_plan: "trial",
        });

      if (error) throw error;

      toast.success("Votre restaurant a été enregistré ! Essai gratuit de 14 jours activé.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-8 pt-12">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {["info", "plan", "confirm"].map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              ["info", "plan", "confirm"].indexOf(step) >= i ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {step === "info" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Votre restaurant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Renseignez les informations de votre établissement</p>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Nom du restaurant *" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Adresse complète *" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="N° SIRET (optionnel)" value={businessId} onChange={(e) => setBusinessId(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="tel" placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Catégorie</p>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                      category === cat.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"
                    }`}>
                    <span className="text-lg">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea placeholder="Description de votre établissement (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <button onClick={() => { if (!name.trim() || !address.trim()) { toast.error("Nom et adresse requis"); return; } setStep("plan"); }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
            Continuer <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === "plan" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Choisissez votre plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">14 jours d'essai gratuit, sans engagement</p>

          <div className="mt-6 space-y-4">
            {plans.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className={`relative w-full rounded-2xl border p-5 text-left transition-all ${
                  selectedPlan === plan.id ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
                }`}>
                {plan.popular && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">
                    Populaire
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">€{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-1 text-base font-semibold text-foreground">{plan.name}</p>
                <ul className="mt-3 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep("info")}
              className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              Retour
            </button>
            <button onClick={() => setStep("confirm")}
              className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
              Continuer
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Confirmez votre inscription</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vérifiez vos informations avant de valider</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Restaurant</p>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{address}</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Plan sélectionné</p>
              <p className="text-sm font-semibold text-foreground">
                {plans.find((p) => p.id === selectedPlan)?.name} – €{plans.find((p) => p.id === selectedPlan)?.price}/mois
              </p>
              <p className="mt-1 text-xs text-primary font-medium">✨ 14 jours d'essai gratuit</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep("plan")}
              className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              Retour
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50">
              {loading ? "Inscription..." : "Valider l'inscription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantOnboarding;
