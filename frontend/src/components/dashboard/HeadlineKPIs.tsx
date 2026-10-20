"use client";

import { HeadlineData } from "@/types/dashboard";
import { getPM25Color, getPM25Label, formatProvinceName } from "@/lib/api";

const MAX_PM25_DISPLAY = 150; // scale for progress bar

function KPICard({
  label,
  value,
  unit,
  sub,
  valueColor,
  progress,
  pulse = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  valueColor: string;
  progress?: number; // 0–100
  pulse?: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group"
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${valueColor}20`,
        boxShadow: `0 0 24px ${valueColor}0a`,
      }}
    >
      {/* Top gradient progress bar */}
      <div className="w-full h-[3px]" style={{ backgroundColor: "var(--border)" }}>
        {progress !== undefined && (
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(90deg, ${valueColor}80, ${valueColor})`,
              boxShadow: `0 0 6px ${valueColor}`,
            }}
          />
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Label */}
        <span
          className="text-[10px] font-mono uppercase tracking-[0.18em]"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span
            className={`font-mono font-bold tabular-nums leading-none ${pulse ? "danger-pulse" : ""}`}
            style={{
              fontSize: typeof value === "string" && value.length > 8 ? "1.1rem" : "2rem",
              color: valueColor,
              textShadow: `0 0 20px ${valueColor}60`,
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              className="text-[11px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Sub label */}
        {sub && (
          <div className="flex items-center gap-1.5 mt-auto">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: valueColor }}
            />
            <span
              className="text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {sub}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HeadlineKPIs({ data }: { data: HeadlineData }) {
  const avg = Number(data.avg_pm25);
  const max = Number(data.max_pm25);
  const pct = Number(data.pct_over_thai_standard);
  const danger = Number(data.danger_days);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard
        label="PM2.5 เฉลี่ย"
        value={avg}
        unit="µg/m³"
        sub={getPM25Label(avg)}
        valueColor={getPM25Color(avg)}
        progress={(avg / MAX_PM25_DISPLAY) * 100}
      />
      <KPICard
        label="PM2.5 สูงสุด"
        value={max}
        unit="µg/m³"
        sub="ค่าสูงสุดที่บันทึก"
        valueColor={getPM25Color(max)}
        progress={(max / MAX_PM25_DISPLAY) * 100}
      />
      <KPICard
        label="เกินมาตรฐานไทย"
        value={pct}
        unit="%"
        sub="threshold 37.5 µg/m³"
        valueColor={pct > 50 ? "#ef4444" : pct > 20 ? "#f97316" : "#f59e0b"}
        progress={pct}
      />
      <KPICard
        label="วันอันตราย"
        value={danger}
        unit="วัน"
        sub="> 75 µg/m³"
        valueColor="#ef4444"
        progress={Math.min((danger / 30) * 100, 100)}
        pulse={danger > 0}
      />
      <KPICard
        label="จังหวัดแย่สุด"
        value={data.worst_province ? formatProvinceName(data.worst_province.province_name) : "—"}
        sub={
          data.worst_province
            ? `avg ${data.worst_province.avg_pm25} µg/m³`
            : undefined
        }
        valueColor="#f97316"
        progress={
          data.worst_province
            ? (Number(data.worst_province.avg_pm25) / MAX_PM25_DISPLAY) * 100
            : 0
        }
      />
    </div>
  );
}
