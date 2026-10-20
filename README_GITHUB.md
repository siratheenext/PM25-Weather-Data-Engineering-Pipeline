# PM2.5 & Weather Analysis — End-to-End Data Engineering Pipeline

University group project (3-person team, course ITDS344: Data Engineering and Infrastructure, Mahidol University ICT). An end-to-end pipeline that ingests PM2.5, weather, and traffic data and turns it into a dashboard for correlation analysis — built with a real Medallion Architecture rather than a single flat ETL script.

**My contribution spanned the whole pipeline, but centered on the Apache Airflow DAG orchestration and the analytics dashboard.**

## Architecture

```
Kafka (producers/consumers)  →  Bronze (raw JSON)  →  Silver / Gold (Hive)  →  PostgreSQL Star Schema  →  Dashboard
                                                              ↑
                                                   orchestrated by an Airflow DAG
```

- **Ingestion**: Kafka producers/consumers stream PM2.5 (air quality), weather, and traffic data into a Bronze layer (`kafka/`)
- **Transformation**: Bronze → Silver → Gold Medallion Architecture implemented in Hive (`transform_data.sql`, `schema.sql`)
- **Warehousing**: Gold-layer data is loaded into a **Star Schema** PostgreSQL data warehouse, containerized with Docker (`warehouse/load_csv_to_wh.py`, `warehouse_schema.sql`, `docker-compose.yml`)
- **Orchestration**: An **Apache Airflow DAG** (`itds344_pipeline.py`) runs the full pipeline — clean old output → Kafka ingestion → load into Hive → transform → load into the Postgres warehouse — on a daily schedule, with failure-email alerting
- **Data quality**: An automated end-to-end data quality test suite (`e2e_data_quality_check.py`) validates the pipeline's output at each stage
- **Dashboard**: A Next.js/TypeScript dashboard (`frontend/`) backed by an Express API (`backend/`) visualizes PM2.5 trends, weekday/weekend patterns, and — the analytical core — **Pearson correlation between PM2.5, weather, and traffic data**

## Repository structure

```
├── itds344_pipeline.py        # Airflow DAG: orchestrates the full Kafka → Hive → Postgres pipeline
├── transform_data.sql         # Hive Bronze → Silver → Gold transformation logic
├── schema.sql                 # Hive warehouse schema
├── warehouse_schema.sql       # PostgreSQL star schema DDL
├── e2e_data_quality_check.py  # Automated end-to-end data quality tests
├── docker-compose.yml         # Kafka, Hive, and Postgres warehouse containers
├── kafka/                     # Producers & consumers for air quality, weather, and traffic streams
├── warehouse/                 # Loads transformed Gold-layer data into the Postgres warehouse
├── backend/                   # Express API serving dashboard data from the warehouse
└── frontend/                  # Next.js dashboard — trends, correlation charts, KPIs
```

Raw/intermediate data files and the Hive/Postgres output directories are not included in this repository (excluded via `.gitignore`), to keep the published code focused on the pipeline logic itself rather than generated data.

## Team

Built with two teammates as part of ITDS344. This repository mirrors the team's original project (private); contributions here reflect my part of the shared codebase, centered on the Airflow DAG and the dashboard.

## Tech stack

Apache Kafka, Apache Hive, Apache Airflow, PostgreSQL, Docker, Python, Node.js/Express, Next.js, TypeScript, Recharts
