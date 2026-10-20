from kafka import KafkaConsumer
import json
import os
import pandas as pd

consumer = KafkaConsumer(
    'weather',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),
    consumer_timeout_ms=5000
)

output_path = 'data/bronze/weather'
os.makedirs(output_path, exist_ok=True)

file_path = os.path.join(output_path, 'data.json')

# --- โหลด existing keys ก่อนเริ่ม loop ---
seen_keys = set()

if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
    try:
        existing_df = pd.read_json(file_path, lines=True)
        for _, row in existing_df.iterrows():
            seen_keys.add((row['datetime']))
        print(f"Loaded {len(seen_keys)} existing keys from file")
    except Exception as e:
        print(f"Warning: Could not load existing file, starting fresh: {e}")
else:
    print("No existing file found, starting fresh")

# --- Write เฉพาะ record ที่ยังไม่มี ---
new_count = 0
skip_count = 0

with open(file_path, 'a', encoding='utf-8') as f:
    print("Listening for air quality data...")
    for msg in consumer:
        record = msg.value
        key = (record.get('datetime'), record.get('province'))

        if key in seen_keys:
            skip_count += 1
            continue

        seen_keys.add(key)
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
        f.flush()
        new_count += 1

print(f"Done — New: {new_count}, Skipped (duplicate): {skip_count}")