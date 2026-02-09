import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, MapPin, Hash, Phone, ChevronRight, Check, Loader2, Mail, Lock, User, Eye, EyeOff, Euro, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { MERCHANT_PLAN } from "@/hooks/useSubscription";
import RestaurantImageUpload from "@/components/RestaurantImageUpload";

const restaurantCategories = [
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "bakery", label: "Boulangerie", icon: "🥐" },
  { id: "sushi", label: "Sushi", icon: "🍣" },
  { id: "grocery", label: "Épicerie", icon: "🥬" },
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "other", label: "Autre", icon: "🏪" },
];

type Step = "account" | "info" | "bag" | "confirm";

const MerchantOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(user ? "info" : "account");
  const [loading, setLoading] = useState(false);

  // Account fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // Restaurant fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [geoVerified, setGeoVerified] = useState<boolean | null>(null);
  const [geoChecking, setGeoChecking] = useState(false);

  // Surprise bag config
  const [bagPrice, setBagPrice] = useState("15");
  const [bagQuantity, setBagQuantity] = useState("5");
  const [bagPickupStart, setBagPickupStart] = useState("18:00");
  const [bagPickupEnd, setBagPickupEnd] = useState("20:00");

  const salePrice = (Number(bagPrice) * 0.4).toFixed(2);

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Email et mot de passe requis"); return; }
    if (password.length < 6) { toast.error("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/merchant-onboarding`, data: { full_name: fullName, role: "merchant" } },
      });
      if (error) {
        toast.error(error.message.includes("already registered") ? "Cet email est déjà utilisé. Connectez-vous plutôt." : error.message);
        return;
      }
      setAccountCreated(true);
      toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Email et mot de passe requis"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message.includes("Invalid login") ? "Email ou mot de passe incorrect" :
                    error.message.includes("Email not confirmed") ? "Veuillez confirmer votre email" : error.message);
        return;
      }
      toast.success("Connexion réussie !");
      setStep("info");
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Vous devez être connecté"); return; }
    if (!name.trim() || !address.trim() || !postalCode.trim() || !city.trim()) { toast.error("Nom, adresse, code postal et ville requis"); return; }
    if (geoVerified === false) { toast.error("L'adresse n'a pas pu être géolocalisée. Vérifiez-la."); return; }
    const price = Number(bagPrice);
    if (isNaN(price) || price < 10) { toast.error("Le prix doit être d'au moins 10€"); return; }

    setLoading(true);
    try {
      const { data: existing } = await supabase.from("restaurants").select("id").eq("owner_id", user.id).limit(1);
      if (existing && existing.length > 0) { toast.success("Restaurant déjà enregistré !"); navigate("/dashboard"); return; }

      await supabase.from("profiles").update({ role: "merchant" }).eq("user_id", user.id);

      const fullAddress = `${address.trim()}, ${postalCode.trim()} ${city.trim()}`;
      const { data: newRest, error } = await supabase.from("restaurants").insert({
        owner_id: user.id, name: name.trim(), address: fullAddress,
        postal_code: postalCode.trim(), city: city.trim(),
        business_id: businessId.trim() || null, phone: phone.trim() || null,
        category, description: description.trim() || null, image_url: imageUrl, subscription_plan: "trial",
      }).select("id").single();

      if (error) throw error;

      // Create surprise bag config
      await supabase.from("surprise_bag_config").insert({
        restaurant_id: newRest.id,
        base_price: price,
        daily_quantity: parseInt(bagQuantity) || 5,
        pickup_start: bagPickupStart,
        pickup_end: bagPickupEnd,
      });

      const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: MERCHANT_PLAN.price_id },
      });

      if (checkoutError || !data?.url) {
        toast.success("Restaurant enregistré ! Essai gratuit de 14 jours activé.");
        navigate("/dashboard");
        return;
      }
      toast.success("Restaurant enregistré ! Redirection vers le paiement...");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally { setLoading(false); }
  };

  const steps = user ? ["info", "bag", "confirm"] : ["account", "info", "bag", "confirm"];
  const currentIndex = steps.indexOf(step);

  const inputClass = "w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background px-5 pb-8 pt-12">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="mb-6 flex gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${currentIndex >= i ? "bg-primary" : "bg-secondary"}`} />
        ))}
      </div>

      {/* STEP: Account */}
      {step === "account" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Créez votre compte commerçant</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {accountCreated ? "Confirmez votre email puis connectez-vous ci-dessous" : "Commencez par créer votre compte"}
          </p>
          <div className="mt-6 space-y-4">
            {!accountCreated && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" placeholder="Adresse email *" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Mot de passe *" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-card py-3.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {accountCreated ? (
            <div className="mt-6 space-y-3">
              <div className="rounded-xl bg-eco-light p-4 text-center">
                <p className="text-sm font-medium text-primary">📧 Email de confirmation envoyé</p>
                <p className="mt-1 text-xs text-muted-foreground">Vérifiez votre boîte mail</p>
              </div>
              <button onClick={handleLogin} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Se connecter et continuer
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <button onClick={handleCreateAccount} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Créer mon compte <ChevronRight className="h-4 w-4" />
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <button onClick={() => setAccountCreated(true)} className="font-semibold text-primary">Se connecter</button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP: Restaurant info */}
      {step === "info" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Votre restaurant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Renseignez les informations de votre établissement</p>
          <div className="mt-6 space-y-4">
            <div className="relative">
              <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Nom du restaurant *" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Adresse (n° et rue) *" value={address} onChange={(e) => { setAddress(e.target.value); setGeoVerified(null); }} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Code postal *" value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setGeoVerified(null); }} className={inputClass} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Ville *" value={city} onChange={(e) => { setCity(e.target.value); setGeoVerified(null); }} className={inputClass} />
              </div>
            </div>
            {geoVerified === true && (
              <p className="text-xs text-primary flex items-center gap-1"><Check className="h-3 w-3" /> Adresse géolocalisée avec succès</p>
            )}
            {geoVerified === false && (
              <p className="text-xs text-destructive">⚠️ Impossible de géolocaliser cette adresse. Vérifiez les informations.</p>
            )}
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="N° SIRET (optionnel)" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className={inputClass} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="tel" placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Catégorie</p>
              <div className="grid grid-cols-3 gap-2">
                {restaurantCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${category === cat.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
                    <span className="text-lg">{cat.icon}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {user && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Photo du restaurant</p>
                <RestaurantImageUpload imageUrl={imageUrl} onImageChange={setImageUrl} userId={user.id} />
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            {!user && (
              <button onClick={() => setStep("account")} className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Retour</button>
            )}
            <button onClick={async () => {
              if (!name.trim() || !address.trim() || !postalCode.trim() || !city.trim()) { toast.error("Nom, adresse, code postal et ville requis"); return; }
              // Verify geocoding
              setGeoChecking(true);
              try {
                const fullAddr = `${address.trim()}, ${postalCode.trim()} ${city.trim()}, France`;
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddr)}&format=json&limit=1`, { headers: { "Accept-Language": "fr" } });
                const data = await res.json();
                if (data.length > 0) {
                  setGeoVerified(true);
                  setStep("bag");
                } else {
                  setGeoVerified(false);
                  toast.error("Impossible de géolocaliser cette adresse");
                }
              } catch { setGeoVerified(false); toast.error("Erreur de vérification d'adresse"); }
              finally { setGeoChecking(false); }
            }}
              disabled={geoChecking}
              className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50">
              {geoChecking ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : null}
              Continuer <ChevronRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP: Surprise bag config */}
      {step === "bag" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Vos Lots Anti-Gaspi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configurez votre offre quotidienne de lots anti-gaspi</p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Euro className="h-4 w-4 text-primary" /> Valeur réelle du panier
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="number" min={10} step="0.50" value={bagPrice} onChange={(e) => setBagPrice(e.target.value)}
                    className="w-28 rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
                <span className="text-sm text-muted-foreground">→</span>
                <div className="rounded-xl bg-primary/10 px-4 py-3">
                  <span className="text-sm font-bold text-primary">{salePrice} €</span>
                  <span className="ml-1 text-[10px] text-muted-foreground">prix de vente</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Minimum 10€ · Le client paie 40% de la valeur</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" /> Paniers par jour
              </label>
              <input type="number" min={1} max={100} value={bagQuantity} onChange={(e) => setBagQuantity(e.target.value)}
                className="w-28 rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" /> Créneau de retrait
              </label>
              <div className="flex items-center gap-2">
                <input type="time" value={bagPickupStart} onChange={(e) => setBagPickupStart(e.target.value)}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <span className="text-xs text-muted-foreground">à</span>
                <input type="time" value={bagPickupEnd} onChange={(e) => setBagPickupEnd(e.target.value)}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep("info")} className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Retour</button>
            <button onClick={() => {
              if (Number(bagPrice) < 10) { toast.error("Minimum 10€"); return; }
              setStep("confirm");
            }} className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
              Continuer <ChevronRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP: Confirm */}
      {step === "confirm" && (
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Confirmez votre inscription</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vérifiez vos informations avant de valider</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Restaurant</p>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{address}, {postalCode} {city}</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Lot Anti-Gaspi</p>
              <p className="text-sm font-semibold text-foreground">
                {bagPrice}€ → <span className="text-primary">{salePrice}€</span> · {bagQuantity} lots/jour
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Retrait {bagPickupStart} – {bagPickupEnd}</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Abonnement</p>
              <p className="text-sm font-semibold text-foreground">{MERCHANT_PLAN.name} – €{MERCHANT_PLAN.price}/mois</p>
              <p className="mt-1 text-xs text-primary font-medium">✨ 14 jours d'essai gratuit</p>
              <ul className="mt-2 space-y-1">
                {MERCHANT_PLAN.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep("bag")} className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Retour</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50">
              {loading ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Inscription...</> : "Valider l'inscription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantOnboarding;
