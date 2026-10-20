"use client";

// ─── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export function Card({ children, className = "", accentColor }: CardProps) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:border-opacity-70 ${className}`}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: accentColor ? `${accentColor}30` : "var(--border)",
        boxShadow: accentColor
          ? `0 0 30px ${accentColor}0d, inset 0 1px 0 ${accentColor}15`
          : "none",
      }}
    >
      {children}
    </div>
  );
}

// ─── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  accent?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  accent = "#06b6d4",
  children,
}: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-6 pt-5 pb-4"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-[3px] h-4 rounded-full flex-shrink-0"
          style={{
            backgroundColor: accent,
            boxShadow: `0 0 8px ${accent}80`,
          }}
        />
        <span
          className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </span>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ─── TabSwitcher ───────────────────────────────────────────────────────────────
interface Tab<T extends string> {
  key: T;
  label: string;
  color: string;
}

interface TabSwitcherProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: TabSwitcherProps<T>) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl"
      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="px-3 py-1 text-[11px] font-mono rounded-lg transition-all duration-200 font-medium"
            style={
              isActive
                ? {
                    backgroundColor: tab.color,
                    color: "#04070f",
                    boxShadow: `0 0 12px ${tab.color}60`,
                  }
                : { color: "var(--text-muted)" }
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── ChartTooltip ─────────────────────────────────────────────────────────────
interface TooltipRowProps {
  label: string;
  value: string | number;
  color?: string;
}

export function ChartTooltipBox({
  date,
  province,
  rows,
}: {
  date?: string;
  province?: string;
  rows: TooltipRowProps[];
}) {
  return (
    <div
      className="rounded-xl p-3 text-[11px] font-mono shadow-2xl space-y-1"
      style={{
        backgroundColor: "#0c1528",
        border: "1px solid var(--border-hi)",
        backdropFilter: "blur(8px)",
      }}
    >
      {date && <p style={{ color: "var(--text-muted)" }}>{date}</p>}
      {province && (
        <p style={{ color: "var(--text-secondary)" }}>{province}</p>
      )}
      {rows.map((r, i) => (
        <p key={i} style={{ color: r.color ?? "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-muted)" }}>{r.label}: </span>
          {r.value}
        </p>
      ))}
    </div>
  );
}
