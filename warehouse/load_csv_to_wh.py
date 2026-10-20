import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

conn = psycopg2.connect(
    host="localhost", port=5433,
    database="warehouse", user="warehouse_user", password="warehouse_pass"
)

def load_csv(path, names):
    df = pd.read_csv(path, header=None, names=names)
    return df.replace(r'\\N', None, regex=True)

# --- dim_date ---
dim_date = load_csv("output_gold/dim_date/000000_0", [
    "date_key", "full_date", "year", "month", "day"
])
with conn.cursor() as cur:
    execute_values(cur, """
        INSERT INTO dim_date (date_key, full_date, year, month, day)
        VALUES %s ON CONFLICT (date_key) DO NOTHING
    """, [tuple(r) for r in dim_date.itertuples(index=False)])
conn.commit()
print(f"✅ dim_date: {len(dim_date)} rows")

# --- dim_time ---
dim_time = load_csv("output_gold/dim_time/000000_0", [
    "time_key", "full_time", "hour"
])
with conn.cursor() as cur:
    execute_values(cur, """
        INSERT INTO dim_time (time_key, full_time, hour)
        VALUES %s ON CONFLICT (time_key) DO NOTHING
    """, [tuple(r) for r in dim_time.itertuples(index=False)])
conn.commit()
print(f"✅ dim_time: {len(dim_time)} rows")

# --- dim_province ---
dim_province = load_csv("output_gold/dim_province/000000_0", [
    "province_key", "province_name"
])
with conn.cursor() as cur:
    execute_values(cur, """
        INSERT INTO dim_province (province_key, province_name)
        VALUES %s ON CONFLICT (province_key) DO NOTHING
    """, [tuple(r) for r in dim_province.itertuples(index=False)])
conn.commit()
print(f"✅ dim_province: {len(dim_province)} rows")

# --- fact_environment_hourly ---
fact_hourly = load_csv("output_gold/fact_environment/000000_0", [
    "date_key", "time_key", "province_key",
    "pm25", "pm10", "o3", "co", "no2", "so2",
    "traffic_total_delay", "traffic_total_length", "traffic_incident_count",
    "avg_speed", "vehicle_density",
    "temperature", "humidity", "rainfall", "wind_speed"
])
with conn.cursor() as cur:
    execute_values(cur, """
        INSERT INTO fact_environment_hourly (
            date_key, time_key, province_key,
            pm25, pm10, o3, co, no2, so2,
            traffic_total_delay, traffic_total_length, traffic_incident_count,
            avg_speed, vehicle_density,
            temperature, humidity, rainfall, wind_speed
        ) VALUES %s ON CONFLICT (date_key, time_key, province_key) DO NOTHING
    """, [tuple(r) for r in fact_hourly.itertuples(index=False)])
conn.commit()
print(f"✅ fact_environment_hourly: {len(fact_hourly)} rows")

# --- fact_environment_daily_avg ---
fact_daily = load_csv("output_gold/fact_environment_daily_avg/000000_0", [
    "date_key", "province_key",
    "avg_pm25", "avg_pm10", "avg_o3", "avg_co", "avg_no2", "avg_so2",
    "avg_traffic_total_delay", "avg_traffic_total_length", "avg_traffic_incident_count",
    "avg_speed", "avg_vehicle_density",
    "avg_temperature", "avg_humidity", "avg_rainfall", "avg_wind_speed"
])
with conn.cursor() as cur:
    execute_values(cur, """
        INSERT INTO fact_environment_daily_avg (
            date_key, province_key,
            avg_pm25, avg_pm10, avg_o3, avg_co, avg_no2, avg_so2,
            avg_traffic_total_delay, avg_traffic_total_length, avg_traffic_incident_count,
            avg_speed, avg_vehicle_density,
            avg_temperature, avg_humidity, avg_rainfall, avg_wind_speed
        ) VALUES %s ON CONFLICT (date_key, province_key) DO NOTHING
    """, [tuple(r) for r in fact_daily.itertuples(index=False)])
conn.commit()
print(f"✅ fact_environment_daily_avg: {len(fact_daily)} rows")

conn.close()


# import pandas as pd
# import numpy as np
# import psycopg2
# from psycopg2.extras import execute_values

# def load_csv(path, names):
#     # โหลด CSV และให้ Pandas มองว่า \N คือค่าว่าง (NaN)
#     df = pd.read_csv(path, header=None, names=names, na_values=['\\N'])
    
#     # เปลี่ยน NaN ให้เป็น None เพื่อให้ Postgres มองเป็น NULL (กราฟจะได้ไม่เป็น 0)
#     df = df.replace({np.nan: None})
    
#     return df

# conn = psycopg2.connect(
#     host="localhost", port=5433,
#     database="warehouse", user="warehouse_user", password="warehouse_pass"
# )

# # --- dim_date ---
# dim_date = load_csv("../output_dim_date/000000_0", [
#     "date_key", "day", "month", "year", "week", "day_of_week"
# ])
# with conn.cursor() as cur:
#     execute_values(cur, """
#         INSERT INTO dim_date (date_key, day, month, year, week, day_of_week)
#         VALUES %s ON CONFLICT (date_key) DO NOTHING
#     """, [tuple(r) for r in dim_date.itertuples(index=False)])
# conn.commit()
# print(f"✅ dim_date: {len(dim_date)} rows")


# # --- dim_province ---
# dim_province = load_csv("../output_dim_province/000000_0", [
#     "province_key", "province_name"
# ])
# with conn.cursor() as cur:
#     execute_values(cur, """
#         INSERT INTO dim_province (province_key, province_name)
#         VALUES %s ON CONFLICT (province_name) DO NOTHING
#     """, [tuple(r) for r in dim_province.itertuples(index=False)])
# conn.commit()
# print(f"✅ dim_province: {len(dim_province)} rows")


# # --- fact_environment ---
# fact = load_csv("../output_gold/000000_0", [
#     "date_key", "province_key", "avg_pm25", "avg_pm10", "avg_temp",
#     "total_traffic_delay", "total_incidents", "avg_humidity",
#     "total_traffic_length", "avg_wind_speed"
# ])
# with conn.cursor() as cur:
#     execute_values(cur, """
#         INSERT INTO fact_environment (
#             date_key, province_key, avg_pm25, avg_pm10, avg_temp,
#             total_traffic_delay, total_incidents, avg_humidity,
#             total_traffic_length, avg_wind_speed
#         ) VALUES %s ON CONFLICT (date_key, province_key) DO NOTHING
#     """, [tuple(r) for r in fact.itertuples(index=False)])
# conn.commit()
# print(f"✅ fact_environment: {len(fact)} rows")

# conn.close()