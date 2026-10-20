"use client";

import { Province, DashboardFilters } from "@/types/dashboard";
import { formatDateForInput, formatProvinceName } from "@/lib/api";

interface FiltersProps {
  provinces: Province[];
  filters: DashboardFilters;
  dateRange: { min_date: string; max_date: string };
  onChange: (filters: DashboardFilters) => void;
  loading?: boolean;
}

const inputClass = `
  font-mono text-sm rounded-xl px-3 py-2 outline-none transition-all duration-200
  focus:ring-1
`;

const inputStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

export default function Filters({
  provinces, filters, dateRange, onChange, loading,
}: FiltersProps) {
  const set = (key: keyof DashboardFilters, value: string) =>
    onChange({ ...filters, [key]: value || undefined });

  return (
    <div
      className="flex flex-wrap gap-4 items-end p-4 rounded-2xl"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Province */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
          จังหวัด
        </label>
        <select
          value={filters.province_key ?? ""}
          onChange={(e) => set("province_key", e.target.value)}
          disabled={loading}
          className={inputClass}
          style={{ ...inputStyle, minWidth: "168px" }}
        >
          <option value="">ทุกจังหวัด</option>
          {provinces.map((p) => (
            <option key={p.province_key} value={p.province_key}>
              {formatProvinceName(p.province_name)}
            </option>
          ))}
        </select>
      </div>

      {/* Start */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
          ตั้งแต่
        </label>
        <input
          type="date"
          value={filters.start_date ?? formatDateForInput(dateRange.min_date)}
          min={formatDateForInput(dateRange.min_date)}
          max={formatDateForInput(dateRange.max_date)}
          onChange={(e) => set("start_date", e.target.value)}
          disabled={loading}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* End */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
          ถึง
        </label>
        <input
          type="date"
          value={filters.end_date ?? formatDateForInput(dateRange.max_date)}
          min={formatDateForInput(dateRange.min_date)}
          max={formatDateForInput(dateRange.max_date)}
          onChange={(e) => set("end_date", e.target.value)}
          disabled={loading}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({})}
        disabled={loading || (!filters.province_key && !filters.start_date && !filters.end_date)}
        className="text-[11px] font-mono px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-30"
        style={{
          backgroundColor: "var(--bg-base)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        รีเซ็ต
      </button>

      {/* Spinner */}
      {loading && (
        <div className="flex items-center gap-2 ml-auto" style={{ color: "#06b6d4" }}>
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-[10px] font-mono">กำลังโหลด</span>
        </div>
      )}
    </div>
  );
}
