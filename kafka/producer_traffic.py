from kafka import KafkaProducer
import json
from datetime import datetime, timedelta
import random

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

end_date   = datetime.today().replace(minute=0, second=0, microsecond=0)
start_date = end_date.replace(hour=0) - timedelta(days=30)

provinces = ["bangkok", "chonburi", "chiang_mai"]

# Traffic scale ต่างกันตาม province (bangkok หนักสุด)
province_scale = {
    "bangkok":    1.0,
    "chonburi":   0.6,
    "chiang_mai": 0.4,
}

current_time = start_date
count = 0

while current_time <= end_date:
    hour = current_time.hour

    # Base values ตาม time-of-day
    if 7 <= hour <= 9 or 16 <= hour <= 19:      # Rush hour
        base_delay    = random.randint(5000, 15000)
        base_length   = random.randint(10000, 30000)
        base_incident = random.randint(100, 250)
        base_speed    = random.uniform(8.0, 20.0)    # กม./ชม.
        base_density  = random.uniform(80.0, 150.0)  # คัน/กม.

    elif 10 <= hour <= 15 or 20 <= hour <= 22:  # Medium
        base_delay    = random.randint(2000, 5000)
        base_length   = random.randint(5000, 10000)
        base_incident = random.randint(40, 100)
        base_speed    = random.uniform(25.0, 45.0)
        base_density  = random.uniform(30.0, 80.0)

    else:                                        # Off-peak
        base_delay    = random.randint(0, 1000)
        base_length   = random.randint(0, 2000)
        base_incident = random.randint(0, 20)
        base_speed    = random.uniform(50.0, 80.0)
        base_density  = random.uniform(5.0, 30.0)

    # ส่ง 1 message ต่อ province → ได้ 3 rows ต่อ 1 datetime
    for province in provinces:
        scale = province_scale[province]

        data = {
            "datetime":               current_time.strftime('%Y-%m-%d %H:%M:%S'),
            "province":               province,
            "traffic_total_delay":    int(base_delay    * scale),
            "traffic_total_length":   int(base_length   * scale),
            "traffic_incident_count": int(base_incident * scale),
            # --- keys เพิ่มสำหรับ AQ correlation ---
            "avg_speed":              round(base_speed / scale, 1),    # ยิ่งติด ยิ่งช้า → ไอเสียมากขึ้น
            "vehicle_density":        round(base_density * scale, 1),  # คัน/กม. → สัมพันธ์กับ PM2.5, NOx, CO โดยตรง
        }

        producer.send('traffic', data)
        count += 1

    current_time += timedelta(hours=1)

producer.flush()
print(f"✅ Sent {count} records")