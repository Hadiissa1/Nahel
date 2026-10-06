export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl text-start"
      }
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-honey/40 bg-honey/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber">
        <span className="h-1.5 w-1.5 rounded-full bg-honey" />
        {eyebrow}
      </span>
      <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-bark-deep sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-bark/70">{subtitle}</p>
      )}
    </div>
  );
}
