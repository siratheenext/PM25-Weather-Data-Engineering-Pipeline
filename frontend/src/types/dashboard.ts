export interface Province {
  province_key: number;
  province_name: string;
}

export interface DashboardFilters {
  province_key?: string;
  start_date?: string;
  end_date?: string;
}

export interface HeadlineData {
  avg_pm25: number;
  max_pm25: number;
  pct_over_thai_standard: number;
  danger_days: number;
  worst_province: { province_name: string; avg_pm25: number } | null;
}

export interface TrendPoint {
  full_date: string;
  year: number;
  month: number;
  avg_pm25: number;
  max_pm25: number;
  avg_wind_speed: number;
  avg_humidity: number; 
  avg_temperature: number;
}

export interface WeatherPoint {
  avg_pm25: number;
  avg_humidity: number;
  avg_temperature: number;
  avg_wind_speed: number;
  avg_rainfall: number;
  province_name: string;
  full_date: string;
}

export interface TrafficPoint {
  avg_pm25: number;
  avg_vehicle_density: number;
  avg_speed: number;
  avg_traffic_total_delay: number;
  avg_traffic_incident_count: number;
  province_name: string;
  full_date: string;
}

export interface HeatmapPoint {
  month: number;
  year: number;
  province_name: string;
  avg_pm25: number;
}

export interface HourlyPoint {
  hour: number;
  avg_pm25: number;
  avg_temperature: number;
  avg_humidity: number;
  avg_wind_speed: number;
}

export interface TrafficPM25Point {
  traffic_level: "low" | "medium" | "high";
  total_days: number;
  over_threshold: number;
  pct_over_threshold: number;
}

export interface WeekdayWeekendPoint {
  day_type: "weekday" | "weekend";
  avg_pm25: number;
  max_pm25: number;
  total_days: number;
  over_threshold: number;
  pct_over_threshold: number;
}

export interface DashboardData {
  meta: {
    filters: DashboardFilters;
    date_range: { min_date: string; max_date: string };
    provinces: Province[];
  };
  headline: HeadlineData;
  trend: TrendPoint[];
  correlation: { weather: WeatherPoint[]; traffic: TrafficPoint[] };
  heatmap: HeatmapPoint[];
  hourly: HourlyPoint[];
  traffic_pm25: TrafficPM25Point[];
  weekday_weekend: WeekdayWeekendPoint[];
}