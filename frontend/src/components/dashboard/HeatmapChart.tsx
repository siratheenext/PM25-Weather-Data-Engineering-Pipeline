"use client";

import { HeatmapPoint } from "@/types/dashboard";
import { getPM25Color, getPM25Label, MONTHS } from "@/lib/api";
import { Card, SectionHeader } from "@/components/ui/Card";

const ACCENT = "#f59e0b";

const LEGEND = [
  { color: "#10b981", label: "≤12 ดี" },
  { color: "#f59e0b", label: "≤37.5 พอใช้" },
  { color: "#f97316", label: "≤55 เสี่ยง" },
  { color: "#ef4444", label: "≤75 อันตราย" },
  { color: "#991b1b", label: ">75 วิกฤต" },
];

export default function HeatmapChart({ data }: { data: HeatmapPoint[] }) {
  const provinces = [...new Set(data.map((d) => d.province_name))].sort();
  const months = [...new Set(data.map((d) => d.month))].sort((a, b) => a - b);
  const lookup = new Map(data.map((d) => [`${d.province_name}__${d.month}`, Number(d.avg_pm25)]));

  if (!data.length) {
    return (
      <Card>
        <SectionHeader title="Heatmap — PM2.5 ตามเดือน × จังหวัด" accent={ACCENT} />
        <div className="p-6 text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          ไม่มีข้อมูล
        </div>
      </Card>
    );
  }

  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="Heatmap — PM2.5 ตามเดือน × จังหวัด" accent={ACCENT}>
        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {LEGEND.map((l) => (
            <div key={l.color} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </SectionHeader>

      <div className="p-5 overflow-x-auto">
        <table className="text-[11px] font-mono w-full border-collapse">
          <thead>
            <tr>
              <th
                className="text-left pb-3 pr-4 font-normal w-36 whitespace-nowrap"
                style={{ color: "var(--text-muted)" }}
              >
                จังหวัด
              </th>
              {months.map((m) => (
                <th
                  key={m}
                  className="text-center pb-3 font-normal"
                  style={{ color: "var(--text-muted)", minWidth: "44px" }}
                >
                  {MONTHS[m - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {provinces.map((province, pi) => (
              <tr key={province} className="group">
                <td
                  className="pr-4 py-0.5 whitespace-nowrap transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {province}
                </td>
                {months.map((m) => {
                  const value = lookup.get(`${province}__${m}`);
                  const bg = value != null ? getPM25Color(value) : "transparent";
                  const isDanger = value != null && value > 75;

                  return (
                    <td key={m} className="py-0.5 px-0.5">
                      <div
                        className={`h-8 rounded flex items-center justify-center cursor-default transition-all duration-150 hover:scale-110 hover:z-10 relative ${isDanger ? "danger-pulse" : ""}`}
                        style={{
                          backgroundColor: value != null ? bg : "var(--bg-card-hi)",
                          opacity: value != null ? 0.88 : 0.25,
                          border: value != null ? `1px solid ${bg}60` : "1px solid var(--border)",
                        }}
                        title={
                          value != null
                            ? `${province} ${MONTHS[m - 1]}: ${value} µg/m³ — ${getPM25Label(value)}`
                            : "ไม่มีข้อมูล"
                        }
                      >
                        <span
                          className="font-mono font-semibold tabular-nums"
                          style={{
                            fontSize: "10px",
                            color: value != null ? "rgba(0,0,0,0.85)" : "var(--text-muted)",
                          }}
                        >
                          {value != null ? value.toFixed(0) : "—"}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
