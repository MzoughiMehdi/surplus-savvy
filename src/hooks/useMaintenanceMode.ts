import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMaintenanceMode = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("maintenance_mode, maintenance_message")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    isMaintenanceMode: data?.maintenance_mode ?? false,
    maintenanceMessage: data?.maintenance_message ?? null,
    isLoading,
  };
};
