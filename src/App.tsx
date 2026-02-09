import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import MerchantOnboarding from "./pages/MerchantOnboarding";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/MaintenancePage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminRestaurantDetail from "./pages/admin/AdminRestaurantDetail";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutReturnPage from "./pages/CheckoutReturnPage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isMaintenanceMode, maintenanceMessage, isLoading } = useMaintenanceMode();

  if (isLoading) return null;

  return (
    <Routes>
      {/* Auth and Admin always accessible */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="restaurants/:id" element={<AdminRestaurantDetail />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {isMaintenanceMode ? (
        <Route path="*" element={<MaintenancePage message={maintenanceMessage} />} />
      ) : (
        <>
          <Route path="/" element={<Index />} />
          <Route path="/merchant-onboarding" element={<MerchantOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout-return" element={<CheckoutReturnPage />} />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
