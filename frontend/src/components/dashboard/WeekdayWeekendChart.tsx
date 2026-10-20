"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { Card, SectionHeader, ChartTooltipBox } from "@/components/ui/Card";
import { WeekdayWeekendPoint } from "@/types/dashboard";

const ACCENT = "#06b6d4";
const META = {
  weekday: { th: "วันธรรมดา (จ–ศ)", color: "#f97316" },
  weekend: { th: "วันหยุด (ส–อา)",  color: "#06b6d4" },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as WeekdayWeekendPoint & { color: string; label: string };
  return (
    <ChartTooltipBox
      rows={[
        { label: "กลุ่ม",              value: d.label,                      color: d.color },
        { label: "avg PM2.5",          value: `${d.avg_pm25} µg/m³`,        color: d.color },
        { label: "max PM2.5",          value: `${d.max_pm25} µg/m³`,        color: "var(--text-secondary)" },
        { label: "PM2.5 เกิน 37.5",   value: `${d.pct_over_threshold}%`,   color: d.color },
        { label: "จำนวนวัน",          value: `${d.total_days} วัน`,         color: "var(--text-secondary)" },
      ]}
    />
  );
};

export default function WeekdayWeekendChart({ data }: { data: WeekdayWeekendPoint[] }) {
  if (!data?.length) return null;

  const chartData = data.map((d) => ({
    ...d,
    avg_pm25: Number(d.avg_pm25),
    max_pm25: Number(d.max_pm25),
    pct_over_threshold: Number(d.pct_over_threshold),
    label: META[d.day_type].th,
    color: META[d.day_type].color,
  }));

  const weekday = chartData.find((d) => d.day_type === "weekday");
  const weekend = chartData.find((d) => d.day_type === "weekend");
  const diff = weekday && weekend ? (weekday.avg_pm25 - weekend.avg_pm25).toFixed(2) : null;
  const hasEffect = diff !== null && Math.abs(Number(diff)) > 2;

  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="Weekday vs Weekend — PM2.5" accent={ACCENT}>
        {diff !== null && (
          <div className="text-right">
            <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              ความต่าง avg PM2.5
            </div>
            <div className="font-mono font-bold text-sm" style={{ color: hasEffect ? "#ef4444" : "#10b981" }}>
              {Number(diff) > 0 ? "+" : ""}{diff} µg/m³
              <span className="text-[10px] font-normal ml-1.5">
                {hasEffect ? "การจราจรน่าจะมีผล" : "ต่างกันน้อย"}
              </span>
            </div>
          </div>
        )}
      </SectionHeader>

      <div className="p-5">
        <p className="text-[10px] font-mono mb-4" style={{ color: "var(--text-muted)" }}>
          ถ้า PM2.5 วันธรรมดา &gt; วันหยุดอย่างมีนัยสำคัญ → การจราจรมีผลต่อฝุ่น
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#111d33" />
            <XAxis dataKey="label"
              tick={{ fill: "#8fa4c8", fontSize: 13, fontFamily: "var(--font-sans)" }}
              tickLine={false} axisLine={{ stroke: "#111d33" }}
            />
            <YAxis unit="µg"
              tick={{ fill: "#3d5478", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e3054", fillOpacity: 0.3 }} />
            <Bar dataKey="avg_pm25" radius={[6, 6, 0, 0]} maxBarSize={100}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}