import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LayoutDashboard, Store, BarChart3, Shield, LogOut, Settings, Euro, ClipboardList, Flag } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import NotificationBell from "@/components/NotificationBell";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Vue d'ensemble", url: "/admin", icon: LayoutDashboard },
  { title: "Restaurants", url: "/admin/restaurants", icon: Store },
  { title: "Réservations", url: "/admin/reservations", icon: ClipboardList },
  { title: "Paiements", url: "/admin/payouts", icon: Euro },
  { title: "Signalements", url: "/admin/reports", icon: Flag },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Paramètres", url: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="w-60" collapsible="icon">
          <SidebarContent>
            <div className="flex items-center gap-2 px-4 py-5">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-foreground">Admin</span>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/admin"}
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4">
              <button
                onClick={() => { signOut(); navigate("/"); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1">
          <header className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                {navItems.find((n) => location.pathname === n.url || (n.url !== "/admin" && location.pathname.startsWith(n.url)))?.title ?? "Admin"}
              </h2>
            </div>
            <NotificationBell />
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
