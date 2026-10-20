"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { Card, SectionHeader, ChartTooltipBox } from "@/components/ui/Card";
import { TabSwitcher } from "@/components/ui/Card";
import { TrafficPoint } from "@/types/dashboard";

const ACCENT = "#f472b6";

const TABS = [
  { key: "avg_speed",                 label: "ความเร็วรถ",      color: "#fb923c" },
  { key: "avg_vehicle_density",       label: "ความหนาแน่น",     color: "#8b5cf6" },
  { key: "avg_traffic_total_delay",   label: "ระยะเวลารถติด",   color: "#f472b6" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const LEVEL_META = {
  low:    { th: "รถน้อย",      color: "#10b981" },
  medium: { th: "รถปานกลาง",  color: "#f59e0b" },
  high:   { th: "รถหนาแน่น",  color: "#ef4444" },
};

function computeBuckets(data: TrafficPoint[], key: TabKey) {
    const values = data
        .map((d) => Number(d[key]))
        .filter((v) => !isNaN(v));

    const sorted = [...values].sort((a, b) => a - b);
    const p33 = sorted[Math.floor(sorted.length * 0.33)];
    const p66 = sorted[Math.floor(sorted.length * 0.66)];

    const classify = (v: number): "low" | "medium" | "high" => {
        if (key === "avg_speed") {
        // inverse: ช้า = ติด
        return v <= p33 ? "high" : v <= p66 ? "medium" : "low";
        }
        return v <= p33 ? "low" : v <= p66 ? "medium" : "high";
    };

    const buckets = {
        low:    { total: 0, over: 0 },
        medium: { total: 0, over: 0 },
        high:   { total: 0, over: 0 },
    };

    data.forEach((d) => {
        const v = Number(d[key]);
        if (isNaN(v)) return;
        const level = classify(v);
        buckets[level].total++;
        if (Number(d.avg_pm25) > 37.5) buckets[level].over++;
    });

    return (["low", "medium", "high"] as const).map((level) => ({
        traffic_level: level,
        label: LEVEL_META[level].th,
        color: LEVEL_META[level].color,
        total_days: buckets[level].total,
        over_threshold: buckets[level].over,
        pct: buckets[level].total > 0
        ? Math.round((buckets[level].over / buckets[level].total) * 1000) / 10
        : 0,
    }));
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltipBox
      rows={[
        { label: "กลุ่ม",            value: d.label,           color: d.color },
        { label: "PM2.5 เกิน 37.5",  value: `${d.pct}%`,       color: d.color },
        { label: "วันที่เกิน",       value: `${d.over_threshold} วัน`, color: "var(--text-secondary)" },
        { label: "วันทั้งหมด",       value: `${d.total_days} วัน`,     color: "var(--text-secondary)" },
      ]}
    />
  );
};

export default function TrafficPM25Chart({ data }: { data: TrafficPoint[] }) {
  const [activeKey, setActiveKey] = useState<TabKey>("avg_speed");
  if (!data?.length) return null;

  const chartData = computeBuckets(data, activeKey);

  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="% PM2.5 เกินมาตรฐาน แยกตามระดับการจราจร" accent={ACCENT}>
        <TabSwitcher
          tabs={TABS.map((t) => ({ key: t.key, label: t.label, color: t.color }))}
          active={activeKey}
          onChange={setActiveKey}
        />
      </SectionHeader>
      <div className="p-5">
        <p className="text-[10px] font-mono mb-4" style={{ color: "var(--text-muted)" }}>
          threshold 37.5 µg/m³ · แบ่งกลุ่มจาก percentile 33/66
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#111d33" />
            <XAxis dataKey="label"
              tick={{ fill: "#8fa4c8", fontSize: 13, fontFamily: "var(--font-sans)" }}
              tickLine={false} axisLine={{ stroke: "#111d33" }}
            />
            <YAxis unit="%" domain={[0, 100]}
              tick={{ fill: "#3d5478", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e3054", fillOpacity: 0.3 }} />
            <Bar dataKey="pct" radius={[6, 6, 0, 0]} maxBarSize={80}>
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