import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

const StarRating = ({ value, onChange, readonly = false, size = "md" }: StarRatingProps) => {
  const [hover, setHover] = useState(0);
  const iconClass = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-transform ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
          >
            <Star
              className={`${iconClass} ${filled ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
