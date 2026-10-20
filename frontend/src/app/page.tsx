"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardData, DashboardFilters } from "@/types/dashboard";
import { fetchDashboard, formatDateLabel } from "@/lib/api";

import Filters from "@/components/dashboard/Filters";
import HeadlineKPIs from "@/components/dashboard/HeadlineKPIs";
import TrendChart from "@/components/dashboard/TrendChart";
import WeatherCorrelation from "@/components/dashboard/WeatherCorrelation";
import TrafficCorrelation from "@/components/dashboard/TrafficCorrelation";
import HeatmapChart from "@/components/dashboard/HeatmapChart";
import HourlyChart from "@/components/dashboard/HourlyChart";
import WeekdayWeekendChart from "@/components/dashboard/WeekdayWeekendChart";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className}`}
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (f: DashboardFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard(f);
      setData(result);
    } catch (err: any) {
      setError(err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => { load({}); }, [load]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => load(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  return (
    <div className="min-h-screen dot-grid" style={{ backgroundColor: "var(--bg-base)" }}>

      {/* ── Top gradient bar ── */}
      <div className="h-[2px] w-full"
        style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #f97316)" }}
      />

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #06b6d420, #f9731620)", border: "1px solid #06b6d430" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <h1 className="font-mono font-bold tracking-widest uppercase text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              PM2.5{" "}
              <span style={{ color: "#06b6d4" }}>&</span>{" "}
              Weather Analysis
            </h1>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
              Gold Layer Dashboard — Environmental Monitoring System
            </p>
          </div>
        </div>

        {/* Date range badge */}
        {data && (
          <div
            className="text-[10px] font-mono px-4 py-2 rounded-xl hidden md:block"
            style={{
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>ข้อมูลตั้งแต่</span>{" "}
            {formatDateLabel(data.meta.date_range.min_date)}{" "}
            <span style={{ color: "var(--text-muted)" }}>—</span>{" "}
            {formatDateLabel(data.meta.date_range.max_date)}
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <main className="px-6 lg:px-8 py-6 space-y-5 max-w-[1600px] mx-auto">

        {/* Filters */}
        {data && (
          <Filters
            provinces={data.meta.provinces}
            filters={filters}
            dateRange={data.meta.date_range}
            onChange={setFilters}
            loading={loading}
          />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl px-5 py-4 text-sm font-mono flex items-center gap-3"
            style={{ backgroundColor: "#1c0a0a", border: "1px solid #ef444440", color: "#fca5a5" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* First-load skeleton */}
        {loading && !data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
            </div>
            <Skeleton className="h-[340px]" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Skeleton className="h-[360px]" />
              <Skeleton className="h-[360px]" />
            </div>
            <Skeleton className="h-[240px]" />
            <Skeleton className="h-[320px]" />
          </>
        )}

        {/* Dashboard */}
        {data && (
          <div className={`space-y-5 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
            <HeadlineKPIs data={data.headline} />
            <TrendChart data={data.trend} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <WeatherCorrelation data={data.correlation.weather} />
              <TrafficCorrelation data={data.correlation.traffic} />
            </div>
            <WeekdayWeekendChart data={data.weekday_weekend} />
            <HeatmapChart data={data.heatmap} />
            <HourlyChart data={data.hourly} />
          </div>
        )}

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          Gold Layer · fact_environment_daily_avg · fact_environment_hourly
        </footer>
      </main>
    </div>
  );
}
