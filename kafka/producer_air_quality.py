from kafka import KafkaProducer
import requests
import json
from datetime import datetime, timedelta
import random

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

edate = datetime.today()
sdate = edate - timedelta(days=30)
sdate_str = sdate.strftime('%Y-%m-%d')
edate_str = edate.strftime('%Y-%m-%d')

url = (
    f"http://air4thai.com/forweb/getHistoryData.php"
    f"?stationID=05t"
    f"&param=PM25,PM10,O3,CO,NO2,SO2"
    f"&type=hr"
    f"&sdate={sdate_str}"
    f"&edate={edate_str}"
    f"&stime=00&etime=23"
)

# ------------------------------------------------------------------ #
# Province profiles
# multiplier: คูณกับค่าจริงจาก API
# fallback:   range ใช้ตอน API คืน None
# ------------------------------------------------------------------ #
province_profiles = {
    "bangkok": {
        "multiplier": {
            "pm25": 1.0,   # baseline
            "pm10": 1.0,
            "o3":   1.0,
            "co":   1.3,   # traffic หนัก → CO สูงขึ้น
            "no2":  1.4,   # รถเยอะ → NO2 สูงขึ้น
            "so2":  1.1,
        },
        "fallback": {
            "pm25": (20.0, 55.0),
            "pm10": (35.0, 80.0),
            "o3":   (15.0, 60.0),
            "co":   (0.6,  2.5),
            "no2":  (25.0, 65.0),
            "so2":  (5.0,  20.0),
        }
    },
    "chiang_mai": {
        "multiplier": {
            "pm25": 2.2,   # เผาไร่ → ฝุ่นสูงมาก
            "pm10": 2.5,
            "o3":   1.3,   # combustion จากการเผา
            "co":   1.4,   # เผาชีวมวล → CO สูง
            "no2":  0.6,   # รถน้อยกว่า → NO2 ต่ำกว่า
            "so2":  0.5,
        },
        "fallback": {
            "pm25": (45.0, 160.0),  # burning season
            "pm10": (70.0, 220.0),
            "o3":   (25.0, 90.0),
            "co":   (0.8,  3.0),
            "no2":  (8.0,  25.0),
            "so2":  (2.0,  8.0),
        }
    },
    "chonburi": {
        "multiplier": {
            "pm25": 0.9,
            "pm10": 1.0,
            "o3":   0.9,
            "co":   0.8,
            "no2":  0.9,
            "so2":  1.8,   # โรงงานอุตสาหกรรม → SO2 สูง
        },
        "fallback": {
            "pm25": (15.0, 40.0),
            "pm10": (25.0, 65.0),
            "o3":   (10.0, 50.0),
            "co":   (0.3,  1.5),
            "no2":  (15.0, 45.0),
            "so2":  (12.0, 35.0),  # industrial
        }
    },
}

# ------------------------------------------------------------------ #

def get_value(raw, key, profile, decimal=1):
    """
    ถ้า API คืนค่า → คูณ multiplier แล้วเติม noise เล็กน้อย
    ถ้า None        → สุ่มจาก fallback range ของ province นั้น
    """
    if raw is not None:
        base = float(raw) * profile["multiplier"][key]
        noise = random.uniform(-0.05, 0.05)  # ±5% noise ให้ต่างกันเล็กน้อย
        return round(base * (1 + noise), decimal)
    else:
        lo, hi = profile["fallback"][key]
        return round(random.uniform(lo, hi), decimal)

# ------------------------------------------------------------------ #

print(f"Fetching: {url}")
response = requests.get(url)
result = response.json()

if result.get("result") != "OK":
    print(f"API Error: {result.get('error')}")
    exit(1)

stations = result.get("stations", [])
if not stations:
    print("No station data found")
    exit(1)

records = stations[0].get("data", [])
print(f"Total records: {len(records)}")

sent = 0
skipped = 0

for row in records:
    try:
        raw = {
            "pm25": row["PM25"],
            "pm10": row["PM10"],
            "o3":   row["O3"],
            "co":   row["CO"],
            "no2":  row["NO2"],
            "so2":  row["SO2"],
        }

        for province, profile in province_profiles.items():
            data = {
                "datetime": row["DATETIMEDATA"],
                "province": province,
                "pm25": get_value(raw["pm25"], "pm25", profile),
                "pm10": get_value(raw["pm10"], "pm10", profile),
                "o3":   get_value(raw["o3"],   "o3",   profile),
                "co":   get_value(raw["co"],   "co",   profile, decimal=2),
                "no2":  get_value(raw["no2"],  "no2",  profile),
                "so2":  get_value(raw["so2"],  "so2",  profile),
            }
            producer.send('air_quality', data)
            sent += 1

    except (ValueError, KeyError) as e:
        print(f"Skip bad row: {row} | Error: {e}")
        skipped += 1

producer.flush()
print(f"Done — Sent: {sent}, Skipped: {skipped}")