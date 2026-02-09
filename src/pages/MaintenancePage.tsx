import { Wrench } from "lucide-react";
import { Link } from "react-router-dom";

interface MaintenancePageProps {
  message?: string | null;
}

const MaintenancePage = ({ message }: MaintenancePageProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Wrench className="h-10 w-10 text-muted-foreground" />
      </div>

      <h1 className="font-display text-3xl font-bold text-foreground">
        Application indisponible
      </h1>

      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        {message || "Notre application est temporairement indisponible pour maintenance. Nous revenons très vite !"}
      </p>

      <Link
        to="/auth?redirect=admin"
        className="mt-16 text-[11px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
      >
        Administration
      </Link>
    </div>
  );
};

export default MaintenancePage;
