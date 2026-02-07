import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Package, Store, Info, X } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const typeIcons: Record<string, typeof Bell> = {
  new_offer: Package,
  status_change: Store,
  reservation: Bell,
  info: Info,
};

const typeColors: Record<string, string> = {
  new_offer: "bg-primary/10 text-primary",
  status_change: "bg-accent/10 text-accent",
  reservation: "bg-primary/10 text-primary",
  info: "bg-muted text-muted-foreground",
};

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full bg-secondary p-2.5 transition-colors hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 animate-fade-in-up rounded-2xl border border-border bg-card shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-display text-sm font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationItem = ({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const Icon = typeIcons[notification.type] ?? Info;
  const colorClass = typeColors[notification.type] ?? typeColors.info;

  return (
    <div
      className={`flex gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 ${
        notification.is_read ? "opacity-60" : "bg-primary/5"
      }`}
    >
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {!notification.is_read && (
          <button
            onClick={() => onRead(notification.id)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
            title="Marquer comme lu"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBell;
