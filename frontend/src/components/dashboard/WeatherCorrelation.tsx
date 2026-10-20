"use client";

import { useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { WeatherPoint } from "@/types/dashboard";
import { Card, SectionHeader, TabSwitcher, ChartTooltipBox } from "@/components/ui/Card";
import { formatDateLabel } from "@/lib/api";

const ACCENT = "#06b6d4";
const WEATHER_TABS = [
  { key: "avg_humidity",    label: "ความชื้น",   color: "#06b6d4", unit: "%" },
  { key: "avg_temperature", label: "อุณหภูมิ",   color: "#a78bfa", unit: "°C" },
  { key: "avg_wind_speed",  label: "ลม",         color: "#34d399", unit: "m/s" },
  { key: "avg_rainfall",    label: "ฝน",         color: "#60a5fa", unit: "mm" },
] as const;

type WeatherKey = (typeof WEATHER_TABS)[number]["key"];

const CustomTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const tab = WEATHER_TABS.find((t) => t.unit === unit);
  return (
    <ChartTooltipBox
      date={formatDateLabel(d?.full_date)}
      province={d?.province_name}
      rows={[
        { label: "PM2.5", value: `${d?.avg_pm25} µg/m³`, color: "#f97316" },
        { label: tab?.label ?? "value", value: `${d?.x} ${unit}`, color: tab?.color },
      ]}
    />
  );
};

function pearsonR(data: { x: number; y: number }[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const mx = data.reduce((s, d) => s + d.x, 0) / n;
  const my = data.reduce((s, d) => s + d.y, 0) / n;
  const num = data.reduce((s, d) => s + (d.x - mx) * (d.y - my), 0);
  const dx = Math.sqrt(data.reduce((s, d) => s + (d.x - mx) ** 2, 0));
  const dy = Math.sqrt(data.reduce((s, d) => s + (d.y - my) ** 2, 0));
  return dx * dy === 0 ? 0 : num / (dx * dy);
}

export default function WeatherCorrelation({ data }: { data: WeatherPoint[] }) {
  const [activeKey, setActiveKey] = useState<WeatherKey>("avg_humidity");
  const tab = WEATHER_TABS.find((t) => t.key === activeKey)!;

  const chartData = data.map((d) => ({
    x: Number(d[activeKey]), 
    y: Number(d.avg_pm25),  
    avg_pm25: d.avg_pm25,
    full_date: d.full_date,
    province_name: d.province_name,
  }));

  const r = pearsonR(chartData.filter(d => d.x != null && d.y != null));
  const rAbs = Math.abs(r);
  const rColor = rAbs > 0.7 ? "#ef4444" : rAbs > 0.4 ? "#f97316" : "#8fa4c8";
  const rLabel = rAbs > 0.7 ? "สัมพันธ์มาก" : rAbs > 0.4 ? "สัมพันธ์ปานกลาง" : "สัมพันธ์น้อย";

  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="PM2.5 × สภาพอากาศ" accent={ACCENT}>
        <div className="text-right">
          <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            Pearson r
          </div>
          <div className="font-mono font-bold text-sm" style={{ color: rColor }}>
            {r >= 0 ? "+" : ""}{r.toFixed(3)}
            <span className="text-[10px] font-normal ml-1.5" style={{ color: rColor }}>
              {rLabel}
            </span>
          </div>
        </div>
        <TabSwitcher
          tabs={WEATHER_TABS.map((t) => ({ key: t.key, label: t.label, color: t.color }))}
          active={activeKey}
          onChange={setActiveKey}
        />
      </SectionHeader>

      <div className="px-6 pt-3 pb-1">
        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          แกน X: {tab.label} ({tab.unit}) &nbsp;/&nbsp; แกน Y: PM2.5 (µg/m³)
          &nbsp;—&nbsp; {chartData.length.toLocaleString()} จุดข้อมูล
        </p>
      </div>

      <div className="px-5 pb-5">
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#111d33" />
            <XAxis 
              dataKey="x"
              type="number"
              domain={['auto', 'auto']}
              padding={{ left: 20, right: 20 }}
              name={activeKey} unit={tab.unit}
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={{ stroke: "#111d33" }}
            />
            <YAxis dataKey="y" type="number" name="avg_pm25" unit="µg"
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false} width={40}
            />
            <Tooltip content={<CustomTooltip unit={tab.unit} />}
              cursor={{ strokeDasharray: "3 3", stroke: "#1e3054" }}
            />
            <ReferenceLine y={37.5} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5}
              label={{ value: "37.5", fill: "#f59e0b", fontSize: 9, fontFamily: "var(--font-mono)", position: "insideTopRight" }}
            />
            <Scatter data={chartData} fill={tab.color} fillOpacity={0.55} r={3} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
