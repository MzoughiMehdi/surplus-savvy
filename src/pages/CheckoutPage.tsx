import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

const stripePromise = loadStripe("pk_test_51SyE0dPrdr7HLEmYM7YiefkuIFz3tw4WSnWsTItRRzhefawhk6RQbWklPdT7RmBjMhpvGzU4FkqKOocXASoB87kS00sEboTZjQ");

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const offerId = searchParams.get("offerId");
  const offerTitle = searchParams.get("offerTitle");
  const amount = searchParams.get("amount");
  const restaurantId = searchParams.get("restaurantId");

  const fetchClientSecret = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: {
        offerId,
        offerTitle,
        amount: parseFloat(amount || "0"),
        restaurantId,
      },
    });

    if (error || !data?.clientSecret) {
      setError("Impossible de charger le formulaire de paiement.");
      throw new Error("No client secret");
    }

    return data.clientSecret;
  }, [offerId, offerTitle, amount, restaurantId]);

  if (!offerId || !amount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-5">
        <p className="text-muted-foreground">Paramètres de paiement manquants.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-5">
        <p className="text-destructive">{error}</p>
        <button onClick={() => navigate(-1)} className="text-primary underline">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">Paiement</h1>
      </div>

      <div id="checkout" className="p-4">
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
};

export default CheckoutPage;
