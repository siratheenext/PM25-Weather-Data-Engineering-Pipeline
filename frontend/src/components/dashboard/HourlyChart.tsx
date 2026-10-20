"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { HourlyPoint } from "@/types/dashboard";
import { getPM25Color } from "@/lib/api";
import { Card, SectionHeader, ChartTooltipBox } from "@/components/ui/Card";

const ACCENT = "#a78bfa";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pm25 = payload.find((p: any) => p.dataKey === "avg_pm25");
  const temp = payload.find((p: any) => p.dataKey === "avg_temperature");
  const hum = payload.find((p: any) => p.dataKey === "avg_humidity");
  return (
    <ChartTooltipBox
      date={`${label}:00 น.`}
      rows={[
        pm25 && { label: "PM2.5", value: `${pm25.value} µg/m³`, color: getPM25Color(pm25.value) },
        temp && { label: "อุณหภูมิ", value: `${temp.value} °C`, color: "#a78bfa" },
        hum && { label: "ความชื้น", value: `${hum.value} %`, color: "#06b6d4" },
      ].filter(Boolean) as any}
    />
  );
};

export default function HourlyChart({ data }: { data: HourlyPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    hour_label: String(d.hour).padStart(2, "0"),
  }));

  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="Peak Hour Pattern — PM2.5 รายชั่วโมง" accent={ACCENT}>
        <div className="flex gap-4 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#f97316", opacity: 0.8 }} />
            PM2.5
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 inline-block rounded-full" style={{ backgroundColor: "#a78bfa" }} />
            อุณหภูมิ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 inline-block rounded-full" style={{ backgroundColor: "#06b6d4" }} />
            ความชื้น
          </span>
        </div>
      </SectionHeader>

      <div className="p-5 pt-4">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={formatted} margin={{ top: 10, right: 50, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#111d33" />
            <XAxis
              dataKey="hour_label"
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "#111d33" }}
              tickFormatter={(v) => `${v}h`}
            />
            {/* Left: PM2.5 */}
            <YAxis yAxisId="pm25"
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false} unit="µg" width={40}
            />
            {/* Right: Temp */}
            <YAxis yAxisId="temp" orientation="right"
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false} unit="°C" width={38}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e3054", fillOpacity: 0.3 }} />
            <ReferenceLine yAxisId="pm25" y={37.5}
              stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5}
              label={{ value: "37.5", fill: "#f59e0b", fontSize: 9, fontFamily: "var(--font-mono)", position: "insideTopRight" }}
            />
            <Bar yAxisId="pm25" dataKey="avg_pm25" name="PM2.5" maxBarSize={28} radius={[3,3,0,0]}>
              {formatted.map((entry, i) => (
                <Cell key={i} fill={getPM25Color(entry.avg_pm25)} fillOpacity={0.85} />
              ))}
            </Bar>
            <Line yAxisId="temp" type="monotone" dataKey="avg_temperature" name="temp"
              stroke="#a78bfa" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
            />
            <Line yAxisId="temp" type="monotone" dataKey="avg_humidity" name="humidity"
              stroke="#06b6d4" strokeWidth={1.5} dot={false} strokeDasharray="4 2"
              activeDot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
