import pandas as pd
from pathlib import Path

BASE = Path(".")

def read_export(folder_path, columns):
    folder = BASE / folder_path
    files = list(folder.glob("*.csv")) + list(folder.glob("000000_0"))
    if not files:
        raise FileNotFoundError(f"ไม่พบไฟล์ใน {folder_path}")
    return pd.read_csv(files[0], header=None, names=columns)

def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {name} {detail}")
    return condition

# ---------- Columns ----------
air_cols = ["datetime", "province", "pm25", "pm10", "o3", "co", "no2", "so2"]
traffic_cols = ["datetime", "province", "traffic_total_delay", "traffic_total_length",
                "traffic_incident_count", "avg_speed", "vehicle_density"]
weather_cols = ["datetime", "temperature", "humidity", "rainfall", "wind_speed"]

fact_cols = ["date_key", "time_key", "province_key", "pm25", "pm10", "o3", "co", "no2", "so2",
             "traffic_total_delay", "traffic_total_length", "traffic_incident_count",
             "avg_speed", "vehicle_density", "temperature", "humidity", "rainfall", "wind_speed"]

daily_cols = ["date_key", "province_key", "avg_pm25", "avg_pm10", "avg_o3", "avg_co", "avg_no2", "avg_so2",
              "avg_traffic_total_delay", "avg_traffic_total_length", "avg_traffic_incident_count",
              "avg_speed", "avg_vehicle_density", "avg_temperature", "avg_humidity", "avg_rainfall", "avg_wind_speed"]

dim_date_cols = ["date_key", "full_date", "year", "month", "day"]
dim_time_cols = ["time_key", "full_time", "hour"]
dim_province_cols = ["province_key", "province_name"]

# ---------- Read files ----------
bronze_air = read_export("output_bronze/bronze_air_quality", air_cols)
bronze_traffic = read_export("output_bronze/bronze_traffic", traffic_cols)
bronze_weather = read_export("output_bronze/bronze_weather", weather_cols)

silver_air = read_export("output_silver/silver_air_quality", air_cols)
silver_traffic = read_export("output_silver/silver_traffic", traffic_cols)
silver_weather = read_export("output_silver/silver_weather", weather_cols)
# silver_joined = read_export("output_silver/silver_environment_hourly_sorted", fact_cols[:2] + air_cols[2:] + traffic_cols[2:] + weather_cols[1:])
silver_joined = read_export("output_silver/silver_environment_hourly", fact_cols[:2] + air_cols[2:] + traffic_cols[2:] + weather_cols[1:])

dim_date = read_export("output_gold/dim_date", dim_date_cols)
dim_time = read_export("output_gold/dim_time", dim_time_cols)
dim_province = read_export("output_gold/dim_province", dim_province_cols)


fact = read_export("output_gold/fact_environment", fact_cols)
# --- แปลงค่าเป็นตัวเลข ---
fact[fact_cols[3:]] = fact[fact_cols[3:]].apply(pd.to_numeric, errors='coerce')

daily = read_export("output_gold/fact_environment_daily_avg", daily_cols)

print("\n========== E2E DATA QUALITY CHECK ==========\n")

passed = 0
total = 0

def run(name, condition, detail=""):
    global passed, total
    total += 1
    if check(name, condition, detail):
        passed += 1

# # 1 Row count: Bronze -> Silver
# run("Bronze air_quality -> Silver air_quality row count",
#     len(bronze_air) == len(silver_air),
#     f"{len(bronze_air)} == {len(silver_air)}")

# run("Bronze traffic -> Silver traffic row count",
#     len(bronze_traffic) == len(silver_traffic),
#     f"{len(bronze_traffic)} == {len(silver_traffic)}")

# run("Bronze weather -> Silver weather row count",
#     len(bronze_weather) == len(silver_weather),
#     f"{len(bronze_weather)} == {len(silver_weather)}")


# 1 Row count: Bronze (Unique) -> Silver (Total)
# เราจะใช้ drop_duplicates เพื่อหาจำนวนที่ควรจะเป็นจริงๆ จาก Bronze ครับ
# สำหรับ Air Quality (เช็คคู่ datetime + province)
bronze_air_unique_count = len(bronze_air.drop_duplicates(["datetime", "province"]))
run("Air Quality: Bronze Unique -> Silver Row Count",
    bronze_air_unique_count == len(silver_air),
    f"Unique Bronze: {bronze_air_unique_count} == Silver: {len(silver_air)}")

# สำหรับ Traffic (เช็คคู่ datetime + province)
bronze_traffic_unique_count = len(bronze_traffic.drop_duplicates(["datetime", "province"]))
run("Traffic: Bronze Unique -> Silver Row Count",
    bronze_traffic_unique_count == len(silver_traffic),
    f"Unique Bronze: {bronze_traffic_unique_count} == Silver: {len(silver_traffic)}")

# สำหรับ Weather (เช็คเฉพาะ datetime)
bronze_weather_unique_count = len(bronze_weather.drop_duplicates(["datetime"]))
run("Weather: Bronze Unique -> Silver Row Count",
    bronze_weather_unique_count == len(silver_weather),
    f"Unique Bronze: {bronze_weather_unique_count} == Silver: {len(silver_weather)}")

# 2 Silver joined -> Fact
run("Silver joined -> Fact row count",
    len(silver_joined) == len(fact),
    f"{len(silver_joined)} == {len(fact)}")

# 3 No duplicate keys
run("No duplicate in silver_air_quality key(datetime, province)",
    silver_air.duplicated(["datetime", "province"]).sum() == 0)

run("No duplicate in silver_traffic key(datetime, province)",
    silver_traffic.duplicated(["datetime", "province"]).sum() == 0)

run("No duplicate in silver_weather key(datetime)",
    silver_weather.duplicated(["datetime"]).sum() == 0)

run("No duplicate in fact key(date_key, time_key, province_key)",
    fact.duplicated(["date_key", "time_key", "province_key"]).sum() == 0)

run("No duplicate in daily fact key(date_key, province_key)",
    daily.duplicated(["date_key", "province_key"]).sum() == 0)

# 4 No null primary keys
run("No NULL keys in fact",
    fact[["date_key", "time_key", "province_key"]].isna().sum().sum() == 0)

run("No NULL keys in daily fact",
    daily[["date_key", "province_key"]].isna().sum().sum() == 0)

# 5 Star schema integrity
run("Fact date_key exists in dim_date",
    fact["date_key"].isin(dim_date["date_key"]).all())

run("Fact time_key exists in dim_time",
    fact["time_key"].isin(dim_time["time_key"]).all())

run("Fact province_key exists in dim_province",
    fact["province_key"].isin(dim_province["province_key"]).all())

# 6 Range checks
run("Air quality values are non-negative",
    (fact[["pm25", "pm10", "o3", "co", "no2", "so2"]] >= 0).all().all())

run("Traffic values are non-negative",
    (fact[["traffic_total_delay", "traffic_total_length", "traffic_incident_count", "avg_speed", "vehicle_density"]] >= 0).all().all())

run("Humidity is between 0 and 100",
    fact["humidity"].between(0, 100).all())

run("Rainfall and wind_speed are non-negative",
    ((fact["rainfall"] >= 0) & (fact["wind_speed"] >= 0)).all())

# 7 Daily aggregation check
expected_daily_rows = fact.groupby(["date_key", "province_key"]).size().reset_index().shape[0]
run("Daily fact row count matches date + province groups",
    len(daily) == expected_daily_rows,
    f"{len(daily)} == {expected_daily_rows}")

print("\n========== SUMMARY ==========")
print(f"Passed: {passed}/{total}")
print("Result:", "ALL PASSED" if passed == total else "SOME TESTS FAILED")