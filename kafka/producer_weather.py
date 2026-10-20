# from kafka import KafkaProducer
# import csv
# import json
# import random

# producer = KafkaProducer(
#     bootstrap_servers='localhost:9092',
#     value_serializer=lambda v: json.dumps(v).encode('utf-8')
# )

# file_path = 'data/raw/weather/weather_data.csv'


# with open(file_path, 'r', encoding='utf-8') as file:
#     reader = csv.DictReader(file)

#     for row in reader:
#         data = {
#             "datetime": row["datetime"].replace("T", " "),
#             "temperature": float(row["temp"]),
#             "humidity": float(row["humidity"]),
#             "rainfall": float(row["precip"]),
#             "wind_speed": float(row["windspeed"]),
#         }

#         producer.send('weather', data)

# producer.flush()
# print("✅ Weather data sent to Kafka")

from kafka import KafkaProducer
import json
from datetime import datetime, timedelta
import random

# ตั้งค่า Kafka Producer
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# กำหนดช่วงเวลา: ย้อนหลัง 30 วัน จนถึงชั่วโมงปัจจุบัน
end_date = datetime.today().replace(minute=0, second=0, microsecond=0)
start_date = end_date - timedelta(days=30)

current_time = start_date
count = 0

print(f"⏳ Generating weather data from {start_date} to {end_date}...")

while current_time <= end_date:
    hour = current_time.hour

    # จำลองค่าอุณหภูมิและความชื้นตามช่วงเวลา (กลางวันร้อนกว่ากลางคืน)
    if 8 <= hour <= 17:
        temp = random.uniform(30.0, 38.0)
        humidity = random.uniform(40.0, 60.0)
    else:
        temp = random.uniform(25.0, 29.0)
        humidity = random.uniform(60.0, 85.0)

    # โอกาสฝนตก 10%
    rainfall = 0.0
    if random.random() < 0.1:
        rainfall = round(random.uniform(0.1, 15.0), 1)
        temp -= 2.0       # ฝนตกอากาศเย็นลง
        humidity += 10.0  # ความชื้นเพิ่มขึ้น

    wind_speed = random.uniform(5.0, 25.0)

    # จัดฟอร์แมตให้ตรงกับ Table ใน Hive
    data = {
        "datetime": current_time.strftime('%Y-%m-%d %H:%M:%S'),
        "temperature": round(temp, 1),
        "humidity": round(humidity, 1),
        "rainfall": round(rainfall, 1),
        "wind_speed": round(wind_speed, 1),
    }

    producer.send('weather', data)
    count += 1
    current_time += timedelta(hours=1)

producer.flush()
print(f"✅ Successfully sent {count} weather records to Kafka!")