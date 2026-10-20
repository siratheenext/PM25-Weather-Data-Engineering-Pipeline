"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { TrendPoint } from "@/types/dashboard";
import { Card, SectionHeader, ChartTooltipBox } from "@/components/ui/Card";
import { formatDateLabel } from "@/lib/api";

const ACCENT = "#f97316";

const CustomTooltip = ({ active, payload, label }: any) => {
  const raw = payload[0]?.payload;
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox
      date={formatDateLabel(label)}
      rows={[
        { label: "PM2.5",    value: `${raw.avg_pm25} µg/m³`,   color: "#f97316" },
        { label: "ลม",       value: `${raw.avg_wind_speed} m/s`, color: "#34d399" },
        { label: "ความชื้น", value: `${raw.avg_humidity}%`,     color: "#06b6d4" },
        { label: "อุณหภูมิ", value: `${raw.avg_temperature}°C`, color: "#a78bfa" },
      ]}
    />
  );
};

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0);
  return values.map((v) => Math.round(((v - min) / (max - min)) * 100 * 10) / 10);
}

function rollingAvg(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, start + window);
    const slice = values.slice(start, end);
    return Math.round((slice.reduce((s, v) => s + v, 0) / slice.length) * 10) / 10;
  });
}

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  const normalizedData = (() => {
    const pm25   = data.map((d) => Number(d.avg_pm25));
    const wind   = data.map((d) => Number(d.avg_wind_speed));
    const humid  = data.map((d) => Number(d.avg_humidity));
    const temp   = data.map((d) => Number(d.avg_temperature));

    const nPm25  = normalize(pm25);
    const nWind  = normalize(rollingAvg(wind));
    const nHumid = normalize(rollingAvg(humid));
    const nTemp  = normalize(rollingAvg(temp));

    return data.map((d, i) => ({
      ...d,
      n_pm25:  nPm25[i],
      n_wind:  nWind[i],
      n_humid: nHumid[i],
      n_temp:  nTemp[i],
    }));
  })();

  console.log(data[0])
  return (
    <Card accentColor={ACCENT}>
      <SectionHeader title="PM2.5 Trend รายวัน" accent={ACCENT}>
        <div className="flex gap-4 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: "#f97316" }} />
            PM2.5
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: "#34d399" }} />
            ลม
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: "#06b6d4" }} />
            ความชื้น
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: "#a78bfa" }} />
            อุณหภูมิ
          </span>
        </div>
      </SectionHeader>

      <div className="p-5 pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={normalizedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="maxFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#111d33" />
            <XAxis
              dataKey="full_date"
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "#111d33" }}
              interval="preserveStartEnd"
              tickFormatter={(v) => formatDateLabel(v)}
            />
            <YAxis
              tick={{ fill: "#3d5478", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              unit="%" domain={[0, 100]}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1e3054", strokeWidth: 1 }} />
            <ReferenceLine y={15} stroke="#3d5478" strokeDasharray="2 4" strokeWidth={1}
              label={{ value: "WHO 15", fill: "#3d5478", fontSize: 9, fontFamily: "var(--font-mono)", position: "insideTopRight" }}
            />
            <Area type="monotone" dataKey="avg_pm25" name="avg" stroke="#f97316" strokeWidth={2}
              fill="url(#avgFill)" dot={false} activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
            />
            <Area dataKey="n_wind"  name="ลม"       stroke="#34d399" fill="none" dot={false} strokeWidth={1.5} />
            <Area dataKey="n_humid" name="ความชื้น" stroke="#06b6d4" fill="none" dot={false} strokeWidth={1.5} />
            <Area dataKey="n_temp"  name="อุณหภูมิ" stroke="#a78bfa" fill="none" dot={false} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
