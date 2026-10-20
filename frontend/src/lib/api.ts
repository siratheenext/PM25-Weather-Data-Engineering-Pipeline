import { DashboardData, DashboardFilters } from "@/types/dashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchDashboard(
  filters: DashboardFilters = {}
): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (filters.province_key) params.set("province_key", filters.province_key);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);

  const qs = params.toString();
  const url = `${API_BASE}/api/dashboard${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── PM2.5 color scale ────────────────────────────────────────────────────────
export function getPM25Color(value: number): string {
  if (value == null) return "#1e293b";
  if (value <= 12)   return "#10b981"; // good
  if (value <= 37.5) return "#eab308"; // moderate (Thai standard)
  if (value <= 55)   return "#f97316"; // unhealthy sensitive
  if (value <= 75)   return "#ef4444"; // unhealthy
  return "#991b1b";                     // hazardous
}

export function getPM25Label(value: number): string {
  if (value == null) return "—";
  if (value <= 12)   return "ดี";
  if (value <= 37.5) return "พอใช้";
  if (value <= 55)   return "มีผลต่อกลุ่มเสี่ยง";
  if (value <= 75)   return "อันตราย";
  return "อันตรายมาก";
}

export const MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// "2026-03-27T17:00:00.000Z" → "27 มี.ค. 69"
export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const thMonths = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const year = String(d.getFullYear() + 543).slice(-2);
  return `${d.getDate()} ${thMonths[d.getMonth()]} ${year}`;
}

// "2026-03-27T17:00:00.000Z" → "2026-03-27"  (for <input type="date">)
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

// "chiang_mai" → "Chiang Mai"
export function formatProvinceName(name: string): string {
  if (!name) return "";
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}