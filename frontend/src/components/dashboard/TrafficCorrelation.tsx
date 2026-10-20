"use client";

import { useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { TrafficPoint } from "@/types/dashboard";
import { Card, SectionHeader, TabSwitcher, ChartTooltipBox } from "@/components/ui/Card";
import { formatDateLabel } from "@/lib/api";

const ACCENT = "#8b5cf6";
const TRAFFIC_TABS = [
  { key: "avg_vehicle_density",     label: "ความหนาแน่น",  color: "#8b5cf6", unit: "" },
  { key: "avg_speed",               label: "ความเร็วรถ",     color: "#fb923c", unit: "km/h" },
  { key: "avg_traffic_total_delay", label: "ระยะเวลารถติด",   color: "#f472b6", unit: "min" },
] as const;

type TrafficKey = (typeof TRAFFIC_TABS)[number]["key"];

const CustomTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const tab = TRAFFIC_TABS.find((t) => t.unit === unit);
  return (
    <ChartTooltipBox
      date={formatDateLabel(d?.full_date)}
      province={d?.province_name}
      rows={[
        { label: "PM2.5", value: `${d?.avg_pm25} µg/m³`, color: "#f97316" },
        { label: tab?.label ?? "value", value: `${d?.x}${unit ? ` ${unit}` : ""}`, color: tab?.color },
      ]}
    />
  );
};

export default function TrafficCorrelation({ data }: { data: TrafficPoint[] }) {
  const [activeKey, setActiveKey] = useState<TrafficKey>("avg_vehicle_density");
  const tab = TRAFFIC_TABS.find((t) => t.key === activeKey)!;

  const chartData = data.map((d) => ({
    x: activeKey === "avg_traffic_total_delay"
      ? Math.round(Number(d[activeKey]) / 60)   // แปลง s → min
      : Number(d[activeKey]),
    y: Number(d.avg_pm25),
    avg_pm25: d.avg_pm25,
    full_date: d.full_date,
    province_name: d.province_name,
  }));

  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="PM2.5 × การจราจร" accent={ACCENT}>
        <TabSwitcher
          tabs={TRAFFIC_TABS.map((t) => ({ key: t.key, label: t.label, color: t.color }))}
          active={activeKey}
          onChange={setActiveKey}
        />
      </SectionHeader>

      <div className="px-6 pt-3 pb-1">
        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          แกน X: {tab.label} {tab.unit && `(${tab.unit})`} &nbsp;/&nbsp; แกน Y: PM2.5 (µg/m³)
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
