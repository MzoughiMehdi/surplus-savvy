import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Clock, MapPin, CheckCircle, XCircle, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import { useSubmitReview, useUserReviewForReservation } from "@/hooks/useReviews";

interface ReservationConfirmationProps {
  pickupCode: string;
  offerTitle: string;
  restaurantName: string;
  pickupStart: string;
  pickupEnd: string;
  price: number;
  status: string;
  onBack: () => void;
  reservationId?: string;
  restaurantId?: string;
}

const ReservationConfirmation = ({
  pickupCode,
  offerTitle,
  restaurantName,
  pickupStart,
  pickupEnd,
  price,
  status,
  onBack,
  reservationId,
  restaurantId,
}: ReservationConfirmationProps) => {
  const { submitReview, submitting } = useSubmitReview();
  const { review, loading: reviewLoading, setReview } = useUserReviewForReservation(reservationId);
  const [pendingRating, setPendingRating] = useState(0);
  const qrValue = JSON.stringify({
    code: pickupCode,
    restaurant: restaurantName,
    offer: offerTitle,
  });

  const statusConfig = {
    confirmed: { label: "Confirmée", color: "text-primary", bg: "bg-primary/10", icon: CheckCircle },
    completed: { label: "Retirée", color: "text-muted-foreground", bg: "bg-muted", icon: Package },
    cancelled: { label: "Annulée", color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  };

  const s = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.confirmed;
  const StatusIcon = s.icon;

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-12">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${s.bg}`}>
          <StatusIcon className={`h-8 w-8 ${s.color}`} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          {status === "confirmed" ? "Réservation confirmée !" : s.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "confirmed"
            ? "Présentez ce QR code au restaurant pour retirer votre commande"
            : status === "completed"
            ? "Vous avez bien récupéré votre commande"
            : "Cette réservation a été annulée"}
        </p>
      </div>

      {status === "confirmed" && (
        <div className="mt-8 flex justify-center">
          <div className="rounded-2xl bg-card p-6 shadow-md">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin
              bgColor="transparent"
              fgColor="hsl(150, 25%, 12%)"
            />
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">Code de retrait</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary">
          {pickupCode.toUpperCase()}
        </p>
      </div>

      <div className="mt-8 space-y-3 rounded-2xl bg-card p-5 shadow-sm">
        <div>
          <p className="text-xs text-muted-foreground">Offre</p>
          <p className="text-sm font-semibold text-foreground">{offerTitle}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Restaurant</p>
          <p className="text-sm font-semibold text-foreground">{restaurantName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Créneau de retrait</p>
            <p className="text-sm font-semibold text-foreground">
              Aujourd'hui, {pickupStart} – {pickupEnd}
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total payé</p>
            <p className="text-lg font-bold text-primary">€{price.toFixed(2)}</p>
          </div>
        </div>
      </div>


      {status === "completed" && reservationId && restaurantId && !reviewLoading && (
        <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm text-center">
          {review ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">Votre note</p>
              <StarRating value={review.rating} readonly size="lg" />
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground mb-3">Comment était votre commande ?</p>
              <div className="flex justify-center mb-3">
                <StarRating value={pendingRating} onChange={setPendingRating} size="lg" />
              </div>
              {pendingRating > 0 && (
                <Button
                  onClick={async () => {
                    const ok = await submitReview(reservationId, restaurantId, pendingRating);
                    if (ok) setReview({ rating: pendingRating });
                  }}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Envoyer ma note
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationConfirmation;
