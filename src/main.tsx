import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Deep link listener for Capacitor OAuth callback
if ((window as any).Capacitor) {
  import("@capacitor/app").then(({ App: CapApp }) => {
    CapApp.addListener("appUrlOpen", async ({ url }) => {
      // url = surplussavvy://auth/callback#access_token=...&refresh_token=...
      const hashIndex = url.indexOf("#");
      if (hashIndex === -1) return;

      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
