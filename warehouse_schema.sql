
CREATE TABLE dim_date (
  date_key VARCHAR PRIMARY KEY,
  full_date DATE,
  year INT,
  month INT,
  day INT
);

CREATE TABLE dim_time (
  time_key INT PRIMARY KEY,
  full_time TIME,
  hour INT
);

CREATE TABLE dim_province (
  province_key INT PRIMARY KEY,
  province_name VARCHAR
);

CREATE TABLE fact_environment_hourly (
  date_key VARCHAR,
  time_key INT,
  province_key INT,

  pm25 DOUBLE PRECISION,
  pm10 DOUBLE PRECISION,
  o3 DOUBLE PRECISION,
  co DOUBLE PRECISION,
  no2 DOUBLE PRECISION,
  so2 DOUBLE PRECISION,

  traffic_total_delay INT,
  traffic_total_length INT,
  traffic_incident_count INT,
  avg_speed DOUBLE PRECISION,
  vehicle_density DOUBLE PRECISION,

  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  rainfall DOUBLE PRECISION,
  wind_speed DOUBLE PRECISION,

  PRIMARY KEY (date_key, time_key, province_key),

  FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  FOREIGN KEY (time_key) REFERENCES dim_time(time_key),
  FOREIGN KEY (province_key) REFERENCES dim_province(province_key)
);

CREATE TABLE fact_environment_daily_avg (
  date_key VARCHAR,
  province_key INT,

  avg_pm25 DOUBLE PRECISION,
  avg_pm10 DOUBLE PRECISION,
  avg_o3 DOUBLE PRECISION,
  avg_co DOUBLE PRECISION,
  avg_no2 DOUBLE PRECISION,
  avg_so2 DOUBLE PRECISION,

  avg_traffic_total_delay DOUBLE PRECISION,
  avg_traffic_total_length DOUBLE PRECISION,
  avg_traffic_incident_count DOUBLE PRECISION,

  avg_speed DOUBLE PRECISION,
  avg_vehicle_density DOUBLE PRECISION,

  avg_temperature DOUBLE PRECISION,
  avg_humidity DOUBLE PRECISION,
  avg_rainfall DOUBLE PRECISION,
  avg_wind_speed DOUBLE PRECISION,

  PRIMARY KEY (date_key, province_key),

  FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  FOREIGN KEY (province_key) REFERENCES dim_province(province_key)
);