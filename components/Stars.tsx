import { cn } from "@/lib/utils";

/** Five stars, filled to `value` (halves rounded to the nearest half). Decorative: give the text alongside. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span aria-hidden="true" className={cn("inline-flex text-amber", className)} dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="relative inline-block">
          <span className="text-bark/20">★</span>
          {rounded >= i - 0.5 && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: rounded >= i ? "100%" : "50%" }}
            >
              ★
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
