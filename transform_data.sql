-- -- สร้างและเลือกใช้งาน Database
-- CREATE DATABASE IF NOT EXISTS final_project;
-- USE final_project;

-- -- เคลียร์ตารางเก่าทิ้ง (เพื่อรองรับการรันซ้ำผ่าน Airflow)
-- DROP TABLE IF EXISTS bronze_air_quality;
-- DROP TABLE IF EXISTS bronze_traffic;
-- DROP TABLE IF EXISTS bronze_weather;
-- DROP TABLE IF EXISTS silver_clean;
-- DROP TABLE IF EXISTS dim_date;
-- DROP TABLE IF EXISTS dim_province;
-- DROP TABLE IF EXISTS fact_environment;
-- DROP TABLE IF EXISTS gold_kpi_summary;

-- -- ==========================================
-- -- 1. BRONZE LAYER
-- -- ==========================================
-- CREATE EXTERNAL TABLE bronze_air_quality (
--   datetime STRING, pm25 DOUBLE, pm10 DOUBLE, o3 DOUBLE, co DOUBLE, no2 DOUBLE, so2 DOUBLE, province STRING  
-- )
-- ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'
-- LOCATION 'file:/opt/air_quality/';  
 
-- CREATE EXTERNAL TABLE bronze_traffic (
--   datetime STRING, traffic_total_delay INT, traffic_total_length INT, traffic_incident_count INT
-- )
-- ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'
-- LOCATION 'file:/opt/traffic/';

-- CREATE EXTERNAL TABLE bronze_weather (
--   datetime STRING, temperature DOUBLE, humidity DOUBLE, rainfall DOUBLE, wind_speed DOUBLE
-- )
-- ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'
-- LOCATION 'file:/opt/weather/';

-- -- ==========================================
-- -- 2. SILVER LAYER
-- -- ==========================================
-- CREATE TABLE silver_clean AS
-- SELECT
--   a.datetime, a.pm25, a.pm10, a.o3, a.co, a.no2, a.so2,
--   t.traffic_total_delay, t.traffic_total_length, t.traffic_incident_count,
--   w.temperature, w.humidity, w.rainfall, w.wind_speed,
--   a.province AS air_province
-- FROM bronze_air_quality a
-- LEFT JOIN bronze_traffic t ON a.datetime = t.datetime  
-- LEFT JOIN bronze_weather w ON a.datetime = w.datetime;  

-- -- ==========================================
-- -- 3. DIMENSION & FACT LAYER (Star Schema)
-- -- ==========================================
-- -- Dim Date
-- CREATE TABLE dim_date (
--   date_key STRING, day STRING, month STRING, year STRING, week STRING, day_of_week STRING
-- ) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',';
 
-- INSERT INTO dim_date
-- SELECT DISTINCT
--   substr(datetime, 1, 10) AS date_key,
--   day(substr(datetime, 1, 10)) AS day,
--   month(substr(datetime, 1, 10)) AS month,
--   year(substr(datetime, 1, 10)) AS year,
--   weekofyear(substr(datetime, 1, 10)) AS week,
--   dayofweek(substr(datetime, 1, 10)) AS day_of_week
-- FROM silver_clean
-- WHERE datetime IS NOT NULL;
 
-- -- Dim Province
-- CREATE TABLE dim_province (
--   province_key INT, province_name STRING
-- ) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',';
 
-- INSERT INTO dim_province (province_key, province_name)
-- SELECT ROW_NUMBER() OVER (ORDER BY province_name) AS province_key, province_name
-- FROM (
--   SELECT DISTINCT air_province AS province_name FROM silver_clean WHERE air_province IS NOT NULL
-- ) AS unique_provinces;

-- -- Fact Environment
-- CREATE TABLE fact_environment (
--   date_key STRING, province_key INT, pm25 DOUBLE, pm10 DOUBLE, o3 DOUBLE, co DOUBLE, no2 DOUBLE, so2 DOUBLE,
--   traffic_total_delay INT, traffic_total_length INT, traffic_incident_count INT,
--   temperature DOUBLE, humidity DOUBLE, rainfall DOUBLE, wind_speed DOUBLE
-- ) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',';

-- INSERT INTO fact_environment
-- SELECT
--   d.date_key, p.province_key, a.pm25, a.pm10, a.o3, a.co, a.no2, a.so2,
--   a.traffic_total_delay, a.traffic_total_length, a.traffic_incident_count,
--   a.temperature, a.humidity, a.rainfall, a.wind_speed
-- FROM silver_clean a
-- JOIN dim_date d ON substr(a.datetime, 1, 10) = d.date_key 
-- JOIN dim_province p ON a.air_province = p.province_name; 

-- -- ==========================================
-- -- 4. GOLD LAYER (KPI Summary) - แก้ไขใหม่ให้ตรง Format เดิม
-- -- ==========================================
-- DROP TABLE IF EXISTS gold_kpi_summary;
-- CREATE TABLE gold_kpi_summary AS
-- SELECT
--   substr(a.datetime, 1, 10) AS date_key, 
--   p.province_key,
--   AVG(a.pm25) AS avg_pm25, 
--   AVG(a.pm10) AS avg_pm10, 
--   AVG(a.temperature) AS avg_temp, 
--   SUM(a.traffic_total_delay) AS total_traffic_delay, 
--   SUM(a.traffic_incident_count) AS total_incidents, 
--   AVG(a.humidity) AS avg_humidity, 
--   SUM(a.traffic_total_length) AS total_traffic_length, 
--   AVG(a.wind_speed) AS avg_wind_speed 
-- FROM silver_clean a
-- JOIN dim_province p ON a.air_province = p.province_name
-- GROUP BY substr(a.datetime, 1, 10), p.province_key
-- ORDER BY date_key ASC, province_key ASC; -- เพิ่มบรรทัดนี้เพื่อให้เรียง 1, 2, 3 เหมือนเดิม

-- -- ==========================================
-- -- 5. EXPORT DATA
-- -- ==========================================
-- INSERT OVERWRITE LOCAL DIRECTORY '/tmp/gold_kpi_summary' ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' SELECT * FROM gold_kpi_summary;
-- INSERT OVERWRITE LOCAL DIRECTORY '/tmp/dim_date' ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' SELECT * FROM dim_date;
-- INSERT OVERWRITE LOCAL DIRECTORY '/tmp/dim_province' ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' SELECT * FROM dim_province;

-- ==========================================
-- สร้างและเลือกใช้งาน Database
-- ==========================================
CREATE DATABASE IF NOT EXISTS final_project;
USE final_project;

-- ==========================================
-- DROP ทุก Table ก่อน (Idempotent: รันซ้ำได้ไม่พัง)
-- ==========================================
DROP TABLE IF EXISTS fact_environment_daily_avg;
DROP TABLE IF EXISTS fact_environment_hourly;
DROP TABLE IF EXISTS dim_province;
DROP TABLE IF EXISTS dim_time;
DROP TABLE IF EXISTS dim_date;
DROP TABLE IF EXISTS silver_environment_hourly;
DROP TABLE IF EXISTS silver_weather;
DROP TABLE IF EXISTS silver_traffic;
DROP TABLE IF EXISTS silver_air_quality;
DROP TABLE IF EXISTS bronze_weather;
DROP TABLE IF EXISTS bronze_traffic;
DROP TABLE IF EXISTS bronze_air_quality;

-- ==========================================
-- 1. BRONZE LAYER
-- ==========================================
CREATE TABLE bronze_air_quality (
  datetime STRING,
  province STRING,
  pm25 DOUBLE,
  pm10 DOUBLE,
  o3 DOUBLE,
  co DOUBLE,
  no2 DOUBLE,
  so2 DOUBLE
) ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe' STORED AS TEXTFILE;

CREATE TABLE bronze_traffic (
  datetime STRING,
  province STRING,
  traffic_total_delay INT,
  traffic_total_length INT,
  traffic_incident_count INT,
  avg_speed DOUBLE,
  vehicle_density DOUBLE
) ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe' STORED AS TEXTFILE;

CREATE TABLE bronze_weather (
  datetime STRING,
  temperature DOUBLE,
  humidity DOUBLE,
  rainfall DOUBLE,
  wind_speed DOUBLE
) ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe' STORED AS TEXTFILE;

LOAD DATA LOCAL INPATH '/tmp/air_quality.json' INTO TABLE bronze_air_quality;
LOAD DATA LOCAL INPATH '/tmp/traffic.json'     INTO TABLE bronze_traffic;
LOAD DATA LOCAL INPATH '/tmp/weather.json'     INTO TABLE bronze_weather;

-- Export Bronze
INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_bronze_air_quality'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM bronze_air_quality;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_bronze_traffic'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM bronze_traffic;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_bronze_weather'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM bronze_weather;

-- ==========================================
-- 2. SILVER LAYER (clean + cast + dedup + standardize)
-- ==========================================
CREATE TABLE silver_air_quality AS
SELECT
  CAST(datetime AS STRING) AS datetime,
  LOWER(TRIM(province)) AS province,
  CAST(pm25 AS DOUBLE) AS pm25,
  CAST(pm10 AS DOUBLE) AS pm10,
  CAST(o3   AS DOUBLE) AS o3,
  CAST(co   AS DOUBLE) AS co,
  CAST(no2  AS DOUBLE) AS no2,
  CAST(so2  AS DOUBLE) AS so2
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY datetime, LOWER(TRIM(province)) ORDER BY datetime) AS rn
  FROM bronze_air_quality
  WHERE datetime IS NOT NULL AND province IS NOT NULL
) t WHERE rn = 1;

CREATE TABLE silver_traffic AS
SELECT
  CAST(datetime AS STRING) AS datetime,
  LOWER(TRIM(province)) AS province,
  CAST(traffic_total_delay    AS INT)    AS traffic_total_delay,
  CAST(traffic_total_length   AS INT)    AS traffic_total_length,
  CAST(traffic_incident_count AS INT)    AS traffic_incident_count,
  CAST(avg_speed              AS DOUBLE) AS avg_speed,
  CAST(vehicle_density        AS DOUBLE) AS vehicle_density
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY datetime, LOWER(TRIM(province)) ORDER BY datetime) AS rn
  FROM bronze_traffic
  WHERE datetime IS NOT NULL AND province IS NOT NULL
) t WHERE rn = 1;

CREATE TABLE silver_weather AS
SELECT
  CAST(datetime    AS STRING) AS datetime,
  CAST(temperature AS DOUBLE) AS temperature,
  CAST(humidity    AS DOUBLE) AS humidity,
  CAST(rainfall    AS DOUBLE) AS rainfall,
  CAST(wind_speed  AS DOUBLE) AS wind_speed
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY datetime ORDER BY datetime) AS rn
  FROM bronze_weather
  WHERE datetime IS NOT NULL
) t WHERE rn = 1;

-- Silver รวม 3 ตาราง
CREATE TABLE silver_environment_hourly AS
SELECT
  aq.datetime,
  aq.province,
  aq.pm25, aq.pm10, aq.o3, aq.co, aq.no2, aq.so2,
  tr.traffic_total_delay, tr.traffic_total_length, tr.traffic_incident_count,
  tr.avg_speed, tr.vehicle_density,
  w.temperature, w.humidity, w.rainfall, w.wind_speed
FROM silver_air_quality aq
LEFT JOIN silver_traffic tr ON aq.datetime = tr.datetime AND aq.province = tr.province
LEFT JOIN silver_weather  w  ON aq.datetime = w.datetime;

-- Export Silver
INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_silver_air_quality'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM silver_air_quality;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_silver_traffic'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM silver_traffic;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_silver_weather'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM silver_weather;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_silver_environment_hourly_sorted'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM silver_environment_hourly ORDER BY datetime, province;

-- ==========================================
-- 3. GOLD LAYER (Dim & Fact Star Schema)
-- ==========================================
CREATE TABLE dim_date (
  date_key  STRING,
  full_date STRING,
  year      INT,
  month     INT,
  day       INT
) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS TEXTFILE;

INSERT OVERWRITE TABLE dim_date
SELECT DISTINCT
  regexp_replace(substr(datetime, 1, 10), '-', '') AS date_key,
  substr(datetime, 1, 10)                          AS full_date,
  year(to_date(substr(datetime, 1, 10)))           AS year,
  month(to_date(substr(datetime, 1, 10)))          AS month,
  day(to_date(substr(datetime, 1, 10)))            AS day
FROM silver_environment_hourly
WHERE datetime IS NOT NULL;

CREATE TABLE dim_time (
  time_key INT,
  full_time STRING,
  hour      INT
) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS TEXTFILE;

INSERT OVERWRITE TABLE dim_time
SELECT DISTINCT
  CAST(substr(datetime, 12, 2) AS INT) AS time_key,
  substr(datetime, 12, 8)             AS full_time,
  CAST(substr(datetime, 12, 2) AS INT) AS hour
FROM silver_environment_hourly
WHERE datetime IS NOT NULL;

CREATE TABLE dim_province (
  province_key INT,
  province_name STRING
) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS TEXTFILE;

INSERT OVERWRITE TABLE dim_province
SELECT
  ROW_NUMBER() OVER (ORDER BY province) AS province_key,
  province AS province_name
FROM (
  SELECT DISTINCT province FROM silver_environment_hourly WHERE province IS NOT NULL
) p;

CREATE TABLE fact_environment_hourly (
  date_key             STRING,
  time_key             INT,
  province_key         INT,
  pm25                 DOUBLE,
  pm10                 DOUBLE,
  o3                   DOUBLE,
  co                   DOUBLE,
  no2                  DOUBLE,
  so2                  DOUBLE,
  traffic_total_delay  INT,
  traffic_total_length INT,
  traffic_incident_count INT,
  avg_speed            DOUBLE,
  vehicle_density      DOUBLE,
  temperature          DOUBLE,
  humidity             DOUBLE,
  rainfall             DOUBLE,
  wind_speed           DOUBLE
) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS TEXTFILE;

INSERT OVERWRITE TABLE fact_environment_hourly
SELECT
  regexp_replace(substr(s.datetime, 1, 10), '-', '') AS date_key,
  CAST(substr(s.datetime, 12, 2) AS INT)             AS time_key,
  p.province_key,
  s.pm25, s.pm10, s.o3, s.co, s.no2, s.so2,
  s.traffic_total_delay, s.traffic_total_length, s.traffic_incident_count,
  s.avg_speed, s.vehicle_density,
  s.temperature, s.humidity, s.rainfall, s.wind_speed
FROM silver_environment_hourly s
LEFT JOIN dim_province p ON s.province = p.province_name;

CREATE TABLE fact_environment_daily_avg (
  date_key                   STRING,
  province_key               INT,
  avg_pm25                   DOUBLE,
  avg_pm10                   DOUBLE,
  avg_o3                     DOUBLE,
  avg_co                     DOUBLE,
  avg_no2                    DOUBLE,
  avg_so2                    DOUBLE,
  avg_traffic_total_delay    DOUBLE,
  avg_traffic_total_length   DOUBLE,
  avg_traffic_incident_count DOUBLE,
  avg_speed                  DOUBLE,
  avg_vehicle_density        DOUBLE,
  avg_temperature            DOUBLE,
  avg_humidity               DOUBLE,
  avg_rainfall               DOUBLE,
  avg_wind_speed             DOUBLE
) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS TEXTFILE;

INSERT OVERWRITE TABLE fact_environment_daily_avg
SELECT
  date_key, province_key,
  AVG(pm25), AVG(pm10), AVG(o3), AVG(co), AVG(no2), AVG(so2),
  AVG(traffic_total_delay), AVG(traffic_total_length), AVG(traffic_incident_count),
  AVG(avg_speed), AVG(vehicle_density),
  AVG(temperature), AVG(humidity), AVG(rainfall), AVG(wind_speed)
FROM fact_environment_hourly
GROUP BY date_key, province_key;

-- Export Gold
INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_dim_date'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM dim_date ORDER BY date_key;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_dim_time'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM dim_time ORDER BY time_key;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_dim_province'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM dim_province ORDER BY province_key;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_fact_environment'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM fact_environment_hourly ORDER BY date_key, time_key, province_key;

INSERT OVERWRITE LOCAL DIRECTORY '/tmp/export_fact_environment_daily_avg'
  ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
  SELECT * FROM fact_environment_daily_avg ORDER BY date_key, province_key;