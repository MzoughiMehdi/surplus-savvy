import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SUBJECTS = [
  { value: "general", label: "Question générale" },
  { value: "technical", label: "Problème technique" },
  { value: "payments", label: "Paiements" },
  { value: "other", label: "Autre" },
];

interface ContactSupportDialogProps {
  restaurantId: string;
}

const ContactSupportDialog = ({ restaurantId }: ContactSupportDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!subject) {
      toast.error("Veuillez sélectionner un sujet");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Le message doit contenir au moins 10 caractères");
      return;
    }
    if (message.trim().length > 2000) {
      toast.error("Le message ne doit pas dépasser 2000 caractères");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("support_messages" as any).insert([
      {
        restaurant_id: restaurantId,
        user_id: user.id,
        subject,
        message: message.trim(),
      },
    ]);

    setSending(false);
    if (error) {
      toast.error("Erreur lors de l'envoi du message");
      return;
    }

    toast.success("Message envoyé ! Nous vous répondrons rapidement.");
    setSubject("");
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <MessageCircle className="h-4 w-4" />
          Contactez-nous
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contactez-nous</DialogTitle>
          <DialogDescription>
            Envoyez un message à l'équipe de la plateforme.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Sujet</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un sujet" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Décrivez votre demande..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={sending}>
            {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSupportDialog;
