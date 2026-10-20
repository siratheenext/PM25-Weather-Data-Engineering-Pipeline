# from airflow import DAG
# from airflow.operators.bash import BashOperator
# from airflow.utils.dates import days_ago
# from airflow.operators.email import EmailOperator
# from datetime import timedelta

# PROJECT_DIR = '/mnt/d/ITDS344-DataEngineerProject/ITDS344-DataEngineerProject'

# default_args = {
#     'owner': 'data_engineer_team',
#     'retries': 0, # ปรับเป็น 0 เพื่อให้มันพังและส่งเมลแจ้งเตือนทันที
#     'email': ['siratheenext@gmail.com'], 
#     'email_on_failure': True, # เปิดโหมดส่งเมลเมื่อ Task พัง (Alert Error)
#     'email_on_retry': False,
# }

# with DAG(
#     'itds344_full_pipeline',
#     default_args=default_args,
#     description='E2E Pipeline: Kafka -> Bronze -> Silver -> Gold (Hive) -> Postgres',
#     schedule_interval='@daily',
#     start_date=days_ago(1),
#     catchup=False,
#     tags=['itds344', 'final_project'],
# ) as dag:

#     # 🌟 Task 1: ลบเฉพาะไฟล์ปลายทาง (Gold) เพื่อล้างกล่องพัสดุก่อนโหลดเข้า Postgres
#     # (สังเกตว่าเราไม่ลบไฟล์ใน data/bronze เพื่อสะสมประวัติศาสตร์ไว้แบบ Incremental Load)
#     clean_old_files = BashOperator(
#         task_id='clean_old_files',
#         bash_command=f"""
#         rm -rf {PROJECT_DIR}/output_bronze/*
#         rm -rf {PROJECT_DIR}/output_silver/*
#         rm -rf {PROJECT_DIR}/output_gold/*
#         """
#     )

#     # Task 2: รัน Ingestion (Kafka Producer & Consumer)
#     run_ingestion = BashOperator(
#         task_id='run_python_kafka_pipeline',
#         bash_command=f"""
#         cd {PROJECT_DIR} && \
#         python kafka/producer_air_quality.py && \
#         python kafka/producer_weather.py && \
#         python kafka/producer_traffic.py && \
#         python kafka/consumer_air_quality.py && \
#         python kafka/consumer_weather.py && \
#         python kafka/consumer_traffic.py
#         """
#     )

#     # 🌟 Task 3: โยนไฟล์เข้า Hive (อัปเดต Path ให้โยนเข้า /tmp/ ตามโค้ด SQL ใหม่ของเพื่อน)
#     prepare_hive = BashOperator(
#         task_id='prepare_hive_data',
#         bash_command=f"""
#         docker cp {PROJECT_DIR}/data/bronze/traffic/data.json hive-server:/tmp/traffic.json && \
#         docker cp {PROJECT_DIR}/data/bronze/air_quality/data.json hive-server:/tmp/air_quality.json && \
#         docker cp {PROJECT_DIR}/data/bronze/weather/data.json hive-server:/tmp/weather.json && \
#         docker cp {PROJECT_DIR}/transform_data.sql hive-server:/tmp/transform_data.sql
#         """
#     )

#     # Task 4: สั่งรันโค้ด SQL สร้าง Star Schema ภายใน Hive
#     run_transformation = BashOperator(
#         task_id='run_hive_transformation',
#         bash_command='docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -f /tmp/transform_data.sql'
#     )

#     # 🌟 Task 5: ดึงไฟล์ Gold ออกมาจาก Hive (อัปเดต Path ให้ดึงครบทั้ง 5 ตารางใหม่ และเปลี่ยนชื่อเป็น .csv สวยๆ)
#     extract_to_local = BashOperator(
#         task_id='extract_all_layers_to_local',
#         bash_command=f"""
#         mkdir -p {PROJECT_DIR}/output_bronze {PROJECT_DIR}/output_silver {PROJECT_DIR}/output_gold
        
#         # ดึง Bronze
#         docker cp hive-server:/tmp/export_bronze_air_quality {PROJECT_DIR}/output_bronze/bronze_air_quality
#         docker cp hive-server:/tmp/export_bronze_traffic {PROJECT_DIR}/output_bronze/bronze_traffic
#         docker cp hive-server:/tmp/export_bronze_weather {PROJECT_DIR}/output_bronze/bronze_weather
        
#         # ดึง Silver
#         docker cp hive-server:/tmp/export_silver_air_quality {PROJECT_DIR}/output_silver/silver_air_quality
#         docker cp hive-server:/tmp/export_silver_traffic {PROJECT_DIR}/output_silver/silver_traffic
#         docker cp hive-server:/tmp/export_silver_weather {PROJECT_DIR}/output_silver/silver_weather
#         docker cp hive-server:/tmp/export_silver_environment_hourly_sorted {PROJECT_DIR}/output_silver/silver_environment_hourly_sorted
        
#         # ดึง Gold
#         docker cp hive-server:/tmp/export_dim_date {PROJECT_DIR}/output_gold/dim_date
#         docker cp hive-server:/tmp/export_dim_time {PROJECT_DIR}/output_gold/dim_time
#         docker cp hive-server:/tmp/export_dim_province {PROJECT_DIR}/output_gold/dim_province
#         docker cp hive-server:/tmp/export_fact_environment {PROJECT_DIR}/output_gold/fact_environment
#         docker cp hive-server:/tmp/export_fact_environment_daily_avg {PROJECT_DIR}/output_gold/fact_environment_daily_avg
#         """
#     )

#     # 🌟 Task 6: โหลดไฟล์ Gold เข้าสู่ Postgres พร้อม TRUNCATE ของเก่า 5 ตารางรวด (ทำ Idempotent)
#     load_to_postgres = BashOperator(
#         task_id='load_gold_to_postgres',
#         bash_command=f"""
#         cd {PROJECT_DIR} && \
#         docker compose exec -T warehouse_db psql -U warehouse_user -d warehouse -c "TRUNCATE TABLE fact_environment_daily_avg CASCADE; TRUNCATE TABLE fact_environment_hourly CASCADE; TRUNCATE TABLE dim_province CASCADE; TRUNCATE TABLE dim_time CASCADE; TRUNCATE TABLE dim_date CASCADE;" && \
#         cd {PROJECT_DIR}/warehouse && python load_csv_to_wh.py
#         """
#     )

#     # Task 7: ส่งอีเมลแจ้งเตือนเมื่อ Pipeline ทำงานสำเร็จ
#     send_success_email = EmailOperator(
#         task_id='send_success_email',
#         to='siratheenext@gmail.com',
#         subject='✅ [SUCCESS] ITDS344 Data Pipeline E2E Completed!',
#         html_content="""
#         <h3> Pipeline E2E Working Perfectly! </h3>
#         <p>ข้อมูลจาก Kafka ถูก Process ผ่าน Hive และอัปเดตเข้าสู่ Postgres เรียบร้อยแล้ว</p> 
#         """,
#     )

#     # จัดลำดับ Flow การทำงาน (E2E)
#     clean_old_files >> run_ingestion >> prepare_hive >> run_transformation >> extract_to_local >> load_to_postgres >> send_success_email

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago
from airflow.operators.email import EmailOperator
from datetime import timedelta

PROJECT_DIR = '/mnt/d/ITDS344-DataEngineerProject/ITDS344-DataEngineerProject'

default_args = {
    'owner': 'data_engineer_team',
    'retries': 0,
    'email': ['siratheenext@gmail.com'],
    'email_on_failure': True,   # แจ้งเตือนเมลทุก task ที่พัง
    'email_on_retry': False,
}

with DAG(
    'itds344_full_pipeline',
    default_args=default_args,
    description='E2E Pipeline: Kafka -> Bronze -> Silver -> Gold (Hive) -> Postgres',
    schedule_interval='@daily',
    start_date=days_ago(1),
    catchup=False,
    tags=['itds344', 'final_project'],
) as dag:

    # ─────────────────────────────────────────
    # Task 1: ล้าง output เก่า (Idempotent)
    # ไม่ลบ data/bronze เพื่อสะสมประวัติแบบ Incremental
    # ─────────────────────────────────────────
    clean_old_files = BashOperator(
        task_id='clean_old_files',
        bash_command=f"""
        rm -rf {PROJECT_DIR}/output_bronze && \
        rm -rf {PROJECT_DIR}/output_silver && \
        rm -rf {PROJECT_DIR}/output_gold
        """
    )

    # ─────────────────────────────────────────
    # Task 2: Kafka Producer + Consumer
    # Idempotent: consumer มี dedup ด้วย seen_keys อยู่แล้ว
    # ─────────────────────────────────────────
    run_ingestion = BashOperator(
        task_id='run_python_kafka_pipeline',
        bash_command=f"""
        cd {PROJECT_DIR} && \
        python kafka/producer_air_quality.py && \
        python kafka/producer_weather.py && \
        python kafka/producer_traffic.py && \
        python kafka/consumer_air_quality.py && \
        python kafka/consumer_weather.py && \
        python kafka/consumer_traffic.py
        """
    )

    # ─────────────────────────────────────────
    # Task 3: Copy JSON + SQL เข้า Hive
    # อิง path /tmp/ ตาม transform_data.sql
    # ─────────────────────────────────────────
    prepare_hive = BashOperator(
        task_id='prepare_hive_data',
        bash_command=f"""
        docker cp {PROJECT_DIR}/data/bronze/air_quality/data.json hive-server:/tmp/air_quality.json && \
        docker cp {PROJECT_DIR}/data/bronze/traffic/data.json     hive-server:/tmp/traffic.json && \
        docker cp {PROJECT_DIR}/data/bronze/weather/data.json     hive-server:/tmp/weather.json && \
        docker cp {PROJECT_DIR}/transform_data.sql                hive-server:/tmp/transform_data.sql
        """
    )

    # ─────────────────────────────────────────
    # Task 4: รัน SQL ใน Hive (Bronze → Silver → Gold)
    # Idempotent: transform_data.sql DROP ทุก table ก่อนเสมอ
    # ─────────────────────────────────────────
    run_transformation = BashOperator(
        task_id='run_hive_transformation',
        bash_command='docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -f /tmp/transform_data.sql'
    )

    # ─────────────────────────────────────────
    # Task 5: ดึง output ทุก Layer จาก Hive ออกมา local
    # อิง path /tmp/export_* จาก transform_data.sql
    # ─────────────────────────────────────────
    extract_to_local = BashOperator(
        task_id='extract_all_layers_to_local',
        bash_command=f"""
        mkdir -p {PROJECT_DIR}/output_bronze \
                  {PROJECT_DIR}/output_silver \
                  {PROJECT_DIR}/output_gold/dim_date \
                  {PROJECT_DIR}/output_gold/dim_time \
                  {PROJECT_DIR}/output_gold/dim_province \
                  {PROJECT_DIR}/output_gold/fact_environment \
                  {PROJECT_DIR}/output_gold/fact_environment_daily_avg && \

        docker cp hive-server:/tmp/export_bronze_air_quality {PROJECT_DIR}/output_bronze/bronze_air_quality && \
        docker cp hive-server:/tmp/export_bronze_traffic     {PROJECT_DIR}/output_bronze/bronze_traffic && \
        docker cp hive-server:/tmp/export_bronze_weather     {PROJECT_DIR}/output_bronze/bronze_weather && \

        docker cp hive-server:/tmp/export_silver_air_quality               {PROJECT_DIR}/output_silver/silver_air_quality && \
        docker cp hive-server:/tmp/export_silver_traffic                   {PROJECT_DIR}/output_silver/silver_traffic && \
        docker cp hive-server:/tmp/export_silver_weather                   {PROJECT_DIR}/output_silver/silver_weather && \
        docker cp hive-server:/tmp/export_silver_environment_hourly_sorted {PROJECT_DIR}/output_silver/silver_environment_hourly && \

        docker cp hive-server:/tmp/export_dim_date/000000_0                    {PROJECT_DIR}/output_gold/dim_date/000000_0 && \
        docker cp hive-server:/tmp/export_dim_time/000000_0                    {PROJECT_DIR}/output_gold/dim_time/000000_0 && \
        docker cp hive-server:/tmp/export_dim_province/000000_0                {PROJECT_DIR}/output_gold/dim_province/000000_0 && \
        docker cp hive-server:/tmp/export_fact_environment/000000_0            {PROJECT_DIR}/output_gold/fact_environment/000000_0 && \
        docker cp hive-server:/tmp/export_fact_environment_daily_avg/000000_0  {PROJECT_DIR}/output_gold/fact_environment_daily_avg/000000_0
        """
    )

    # ─────────────────────────────────────────
    # Task 6: Load เข้า Postgres
    # Idempotent: TRUNCATE ทุก table ก่อน insert
    # load_csv_to_wh.py อยู่ที่ warehouse/load_csv_to_wh.py
    # ─────────────────────────────────────────
    load_to_postgres = BashOperator(
        task_id='load_gold_to_postgres',
        bash_command=f"""
        docker compose -f {PROJECT_DIR}/docker-compose.yml exec -T warehouse_db psql -U warehouse_user -d warehouse -c "
            TRUNCATE TABLE fact_environment_daily_avg CASCADE;
            TRUNCATE TABLE fact_environment_hourly CASCADE;
            TRUNCATE TABLE dim_province CASCADE;
            TRUNCATE TABLE dim_time CASCADE;
            TRUNCATE TABLE dim_date CASCADE;
        " && \
        cd {PROJECT_DIR} && python warehouse/load_csv_to_wh.py
        """
    )

    # ─────────────────────────────────────────
    # Task 7: E2E Data Quality Check
    # ถ้า check ไม่ผ่าน → task fail → ส่งเมลแจ้งเตือนอัตโนมัติ
    # ─────────────────────────────────────────
    run_e2e_check = BashOperator(
        task_id='run_e2e_data_quality_check',
        bash_command=f"""
        cd {PROJECT_DIR} && python e2e_data_quality_check.py
        """
    )

    # ─────────────────────────────────────────
    # Task 8: ส่งเมลแจ้งเตือนเมื่อ Pipeline สำเร็จทั้งหมด
    # ─────────────────────────────────────────
    send_success_email = EmailOperator(
        task_id='send_success_email',
        to='siratheenext@gmail.com',
        subject='✅ [SUCCESS] ITDS344 Data Pipeline E2E Completed!',
        html_content="""
        <h3>Pipeline E2E สำเร็จแล้ว!</h3>
        <p>ข้อมูลจาก Kafka ถูก Process ผ่าน Hive และโหลดเข้าสู่ Postgres เรียบร้อยแล้ว</p>
        <p>E2E Data Quality Check ผ่านทั้งหมด ✅</p>
        """,
    )

    # ─────────────────────────────────────────
    # Flow: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
    # ─────────────────────────────────────────
    clean_old_files >> run_ingestion >> prepare_hive >> run_transformation >> extract_to_local >> load_to_postgres >> run_e2e_check >> send_success_email

    # ─────────────────────────────────────────
    # (Optional) Uncomment เพื่อทดสอบระบบ Alert เมล
    # ─────────────────────────────────────────
    # test_fail_task = BashOperator(
    #     task_id='test_email_alert_failure',
    #     bash_command='echo "🚨 Simulating pipeline failure..." && exit 1'
    # )
    # test_fail_task >> clean_old_files >> run_ingestion >> prepare_hive >> run_transformation >> extract_to_local >> load_to_postgres >> run_e2e_check >> send_success_email