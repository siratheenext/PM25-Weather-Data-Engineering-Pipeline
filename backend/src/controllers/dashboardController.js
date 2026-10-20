const pool = require("../config/db");

function buildFilters(query, paramOffset = 1) {
  const conditions = [];
  const values = [];
  let idx = paramOffset;

  if (query.province_key) {
    conditions.push(`f.province_key = $${idx++}`);
    values.push(parseInt(query.province_key));
  }
  if (query.start_date) {
    conditions.push(`d.full_date >= $${idx++}`);
    values.push(query.start_date);
  }
  if (query.end_date) {
    conditions.push(`d.full_date <= $${idx++}`);
    values.push(query.end_date);
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  return { whereClause, values };
}

const getDashboard = async (req, res) => {
  try {
    const { whereClause, values } = buildFilters(req.query);

    const [
      headlineResult,
      worstProvinceResult,
      trendResult,
      weatherCorrResult,
      trafficCorrResult,
      heatmapResult,
      hourlyResult,
      provincesResult,
      dateRangeResult,
      weekdayResult
    ] = await Promise.all([

      // 1. Headline KPIs
      pool.query(`
        SELECT
          ROUND(AVG(f.avg_pm25)::numeric, 2) AS avg_pm25,
          ROUND(MAX(f.avg_pm25)::numeric, 2) AS max_pm25,
          ROUND(
            (COUNT(*) FILTER (WHERE f.avg_pm25 > 37.5) * 100.0 / NULLIF(COUNT(*), 0))::numeric
          , 2) AS pct_over_thai_standard,
          COUNT(*) FILTER (WHERE f.avg_pm25 > 75) AS danger_days
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        ${whereClause}
      `, values),

      // 2. Worst province
      pool.query(`
        SELECT
          p.province_name,
          ROUND(AVG(f.avg_pm25)::numeric, 2) AS avg_pm25
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_province p ON f.province_key = p.province_key
        ${whereClause}
        GROUP BY p.province_name
        ORDER BY avg_pm25 DESC
        LIMIT 1
      `, values),

      // 3. PM2.5 daily trend
      pool.query(`
        SELECT
          d.full_date,
          d.year,
          d.month,
          ROUND(AVG(f.avg_pm25)::numeric, 2) AS avg_pm25,
          ROUND(AVG(f.avg_wind_speed)::numeric, 2)   AS avg_wind_speed,
          ROUND(AVG(f.avg_humidity)::numeric, 2)     AS avg_humidity,
          ROUND(AVG(f.avg_temperature)::numeric, 2)  AS avg_temperature
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        ${whereClause}
        GROUP BY d.full_date, d.year, d.month
        ORDER BY d.full_date ASC
      `, values),

      // 4. Weather correlation scatter
      pool.query(`
        SELECT
          ROUND(f.avg_pm25::numeric, 2)        AS avg_pm25,
          ROUND(f.avg_humidity::numeric, 2)    AS avg_humidity,
          ROUND(f.avg_temperature::numeric, 2) AS avg_temperature,
          ROUND(f.avg_wind_speed::numeric, 2)  AS avg_wind_speed,
          ROUND(f.avg_rainfall::numeric, 2)    AS avg_rainfall,
          p.province_name,
          d.full_date
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_province p ON f.province_key = p.province_key
        ${whereClause}
        ORDER BY d.full_date ASC
      `, values),

      // 5. Traffic correlation scatter
      pool.query(`
        SELECT
          ROUND(f.avg_pm25::numeric, 2)                   AS avg_pm25,
          ROUND(f.avg_vehicle_density::numeric, 2)        AS avg_vehicle_density,
          ROUND(f.avg_speed::numeric, 2)                  AS avg_speed,
          ROUND(f.avg_traffic_total_delay::numeric, 2)    AS avg_traffic_total_delay,
          ROUND(f.avg_traffic_incident_count::numeric, 2) AS avg_traffic_incident_count,
          p.province_name,
          d.full_date
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_province p ON f.province_key = p.province_key
        ${whereClause}
        ORDER BY d.full_date ASC
      `, values),

      // 6. Heatmap: month × province
      pool.query(`
        SELECT
          d.month,
          d.year,
          p.province_name,
          ROUND(AVG(f.avg_pm25)::numeric, 2) AS avg_pm25
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_province p ON f.province_key = p.province_key
        ${whereClause}
        GROUP BY d.year, d.month, p.province_name
        ORDER BY d.year ASC, d.month ASC, p.province_name ASC
      `, values),

      // 7. Hourly peak pattern
      pool.query(`
        SELECT
          t.hour,
          ROUND(AVG(f.pm25)::numeric, 2)        AS avg_pm25,
          ROUND(AVG(f.temperature)::numeric, 2) AS avg_temperature,
          ROUND(AVG(f.humidity)::numeric, 2)    AS avg_humidity,
          ROUND(AVG(f.wind_speed)::numeric, 2)  AS avg_wind_speed
        FROM fact_environment_hourly f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_time t ON f.time_key = t.time_key
        ${whereClause}
        GROUP BY t.hour
        ORDER BY t.hour ASC
      `, values),

      // 8. Province list
      pool.query(`
        SELECT province_key, province_name
        FROM dim_province
        ORDER BY province_name ASC
      `),

      // 9. Available date range
      pool.query(`
        SELECT
          MIN(full_date) AS min_date,
          MAX(full_date) AS max_date
        FROM dim_date
      `),

      // 10. Available date range
      pool.query(`
        SELECT
          CASE WHEN EXTRACT(DOW FROM d.full_date) IN (0, 6) THEN 'weekend' ELSE 'weekday' END AS day_type,
          ROUND(AVG(f.avg_pm25)::numeric, 2) AS avg_pm25,
          ROUND(MAX(f.avg_pm25)::numeric, 2) AS max_pm25,
          COUNT(*) AS total_days,
          COUNT(*) FILTER (WHERE f.avg_pm25 > 37.5) AS over_threshold,
          ROUND(COUNT(*) FILTER (WHERE f.avg_pm25 > 37.5) * 100.0 / NULLIF(COUNT(*), 0)::numeric, 1) AS pct_over_threshold
        FROM fact_environment_daily_avg f
        JOIN dim_date d ON f.date_key = d.date_key
        ${whereClause}
        GROUP BY day_type
        ORDER BY day_type DESC
      `, values),

    ]);

    res.json({
      meta: {
        filters: {
          province_key: req.query.province_key ?? null,
          start_date: req.query.start_date ?? null,
          end_date: req.query.end_date ?? null,
        },
        date_range: dateRangeResult.rows[0],
        provinces: provincesResult.rows,
      },
      headline: {
        ...headlineResult.rows[0],
        worst_province: worstProvinceResult.rows[0] ?? null,
      },
      trend: trendResult.rows,
      correlation: {
        weather: weatherCorrResult.rows,
        traffic: trafficCorrResult.rows,
      },
      heatmap: heatmapResult.rows,
      hourly: hourlyResult.rows,
      weekday_weekend: weekdayResult.rows,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getDashboard };