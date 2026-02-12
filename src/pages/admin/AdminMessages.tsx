import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  restaurant_id: string;
  restaurants: { name: string } | null;
}

interface Reply {
  id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "Question générale",
  technical: "Problème technique",
  payments: "Paiements",
  other: "Autre",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Nouveau" },
  { value: "read", label: "Lu" },
  { value: "resolved", label: "Résolu" },
];

const AdminMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("support_messages" as any)
      .select("id, subject, message, status, created_at, restaurant_id, restaurants(name)")
      .order("created_at", { ascending: false });
    setMessages((data as unknown as SupportMessage[]) ?? []);
  };

  const openConversation = async (msg: SupportMessage) => {
    setSelected(msg);
    setReplyText("");
    const { data } = await supabase
      .from("support_replies" as any)
      .select("id, sender_role, content, created_at")
      .eq("message_id", msg.id)
      .order("created_at", { ascending: true });
    setReplies((data as unknown as Reply[]) ?? []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleSendReply = async () => {
    if (!selected || !user || replyText.trim().length < 2) return;
    setSending(true);
    const { error } = await supabase.from("support_replies" as any).insert([
      { message_id: selected.id, sender_role: "admin", sender_id: user.id, content: replyText.trim() },
    ]);
    if (error) {
      toast.error("Erreur lors de l'envoi");
      setSending(false);
      return;
    }
    // Auto mark as read
    if (selected.status === "pending") {
      await supabase.from("support_messages" as any).update({ status: "read" }).eq("id", selected.id);
      setSelected((s) => s ? { ...s, status: "read" } : s);
      setMessages((prev) => prev.map((m) => m.id === selected.id ? { ...m, status: "read" } : m));
    }
    setReplyText("");
    setSending(false);
    openConversation(selected);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("support_messages" as any).update({ status }).eq("id", id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Detail view
  if (selected) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{selected.restaurants?.name ?? "Restaurant inconnu"}</p>
            <p className="text-xs text-muted-foreground">{SUBJECT_LABELS[selected.subject] ?? selected.subject}</p>
          </div>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={selected.status === s.value ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => handleStatusChange(selected.id, s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          {/* Initial message */}
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-xl rounded-tl-sm bg-card p-3 shadow-sm">
              <p className="text-sm text-foreground">{selected.message}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(selected.created_at)}</p>
            </div>
          </div>
          {/* Replies */}
          {replies.map((r) => (
            <div key={r.id} className={`flex ${r.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl p-3 shadow-sm ${r.sender_role === "admin" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card text-foreground"}`}>
                <p className="text-sm">{r.content}</p>
                <p className={`mt-1 text-[10px] ${r.sender_role === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatDate(r.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Textarea
            placeholder="Votre réponse..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
          />
          <Button onClick={handleSendReply} disabled={sending || replyText.trim().length < 2} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <MessageCircle className="h-6 w-6" /> Messages
        {messages.filter((m) => m.status === "pending").length > 0 && (
          <Badge>{messages.filter((m) => m.status === "pending").length}</Badge>
        )}
      </h1>
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message reçu</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openConversation(m)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{m.restaurants?.name ?? "Restaurant inconnu"}</p>
                      <Badge variant="outline" className="text-[10px]">{SUBJECT_LABELS[m.subject] ?? m.subject}</Badge>
                      <Badge
                        variant={m.status === "pending" ? "default" : m.status === "read" ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {m.status === "pending" ? "Nouveau" : m.status === "read" ? "Lu" : "Résolu"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(m.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
