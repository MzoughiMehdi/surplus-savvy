import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const CheckoutReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || !user) return;

    const handleReturn = async () => {
      try {
        // Verify session status via edge function
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });

        if (error || !data?.success) {
          setStatus("error");
          return;
        }

        const { offerId, restaurantId } = data;

        // Check for existing reservation
        const { data: existing } = await supabase
          .from("reservations")
          .select("id")
          .eq("user_id", user.id)
          .eq("offer_id", offerId)
          .limit(1);

        if (existing && existing.length > 0) {
          setStatus("success");
          setTimeout(() => navigate("/?tab=orders"), 1500);
          return;
        }

        // Create reservation
        const { error: insertError } = await supabase
          .from("reservations")
          .insert({
            user_id: user.id,
            offer_id: offerId,
            restaurant_id: restaurantId || "",
          });

        if (insertError) {
          console.error("Reservation error:", insertError);
          toast.error("Erreur lors de la création de la réservation");
          setStatus("error");
          return;
        }

        toast.success("Paiement confirmé ! Votre réservation est prête.");
        setStatus("success");
        setTimeout(() => navigate("/?tab=orders"), 1500);
      } catch (err) {
        console.error("Unexpected error:", err);
        setStatus("error");
      }
    };

    handleReturn();
  }, [sessionId, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-5">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">Vérification du paiement...</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-16 w-16 text-primary" />
          <p className="text-xl font-bold text-foreground">Paiement réussi !</p>
          <p className="text-sm text-muted-foreground">Redirection vers vos commandes...</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <p className="text-xl font-bold text-foreground">Échec du paiement</p>
          <p className="text-sm text-muted-foreground">Le paiement n'a pas abouti.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            Retour à l'accueil
          </button>
        </>
      )}
    </div>
  );
};

export default CheckoutReturnPage;
