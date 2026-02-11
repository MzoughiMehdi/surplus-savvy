import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Pause, Package } from "lucide-react";
import { getParisDate } from "@/lib/dateUtils";
import type { DailyOverride } from "@/hooks/useDailyOverrides";
import type { SurpriseBagConfig } from "@/hooks/useSurpriseBagConfig";
import DayOverridePanel from "./DayOverridePanel";

interface Props {
  config: SurpriseBagConfig;
  overrides: DailyOverride[];
  reservationCounts: Record<string, number>;
  onUpsertOverride: (date: string, updates: Partial<Pick<DailyOverride, "quantity" | "pickup_start" | "pickup_end" | "is_suspended">>) => Promise<void>;
  onDeleteOverride: (date: string) => Promise<void>;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const SurpriseBagCalendar = ({ config, overrides, reservationCounts, onUpsertOverride, onDeleteOverride, currentMonth, onMonthChange }: Props) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = parseInt(currentMonth.split("-")[0]);
  const month = parseInt(currentMonth.split("-")[1]);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const result: (string | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return result;
  }, [year, month]);

  const overrideMap = useMemo(() => {
    const map: Record<string, DailyOverride> = {};
    overrides.forEach((o) => { map[o.date] = o; });
    return map;
  }, [overrides]);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const today = getParisDate();

  const selectedOverride = selectedDate ? overrideMap[selectedDate] : undefined;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-foreground">Calendrier</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg bg-secondary p-1.5 text-foreground hover:bg-secondary/80">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground capitalize w-36 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="rounded-lg bg-secondary p-1.5 text-foreground hover:bg-secondary/80">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const dayNum = parseInt(date.split("-")[2]);
          const override = overrideMap[date];
          const isSuspended = override?.is_suspended;
          const qty = override?.quantity ?? config.daily_quantity;
          const reserved = reservationCounts[date] ?? 0;
          const isToday = date === today;
          const isPast = date < today;
          const isSelected = date === selectedDate;

          return (
            <button
              key={date}
              onClick={() => !isPast && setSelectedDate(isSelected ? null : date)}
              disabled={isPast}
              className={`relative flex flex-col items-center rounded-lg p-1.5 text-xs transition-all min-h-[3.5rem] ${
                isPast ? "opacity-40 cursor-default" :
                isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary" :
                isSuspended ? "bg-destructive/10 text-destructive" :
                isToday ? "bg-primary/10 text-primary font-bold" :
                "hover:bg-secondary text-foreground"
              }`}
            >
              <span className="text-[11px] font-medium">{dayNum}</span>
              {!isPast && !isSuspended && (
                <span className={`text-[9px] mt-0.5 ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {qty - reserved}/{qty}
                </span>
              )}
              {isSuspended && <Pause className="h-3 w-3 mt-0.5" />}
              {reserved > 0 && !isSuspended && (
                <span className={`absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground`}>
                  {reserved}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day override panel */}
      {selectedDate && (
        <DayOverridePanel
          date={selectedDate}
          config={config}
          override={selectedOverride}
          reservedCount={reservationCounts[selectedDate] ?? 0}
          onSave={onUpsertOverride}
          onReset={onDeleteOverride}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};

export default SurpriseBagCalendar;
