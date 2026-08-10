# QA Test Management Application

Hebrew RTL web app for managing manual and automatic QA test runs across app versions.

## Stack

- **Frontend:** Angular 19 + Angular Material (RTL Hebrew UI)
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Database:** PostgreSQL 16

## Features

- Master test catalog grouped by feature (תכולה)
- Create app versions that snapshot all active tests
- Track run status: צריך להריץ / בוצע / צריך להריץ מחדש
- Track result status: הצליח / נכשל / יש באג
- Parallel QA updates with optimistic locking (409 on conflict)
- Excel import from existing QA spreadsheets
- Excel and PDF report export per version

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # if .env doesn't exist
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Backend runs at http://localhost:3001

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at http://localhost:8080 (proxies `/api` to backend)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/features` | Feature groups |
| GET/POST/PATCH/DELETE | `/api/test-cases` | Test cases |
| GET/POST | `/api/versions` | App versions |
| GET | `/api/versions/:id/runs` | Test runs for a version |
| PATCH | `/api/versions/:id/runs/:runId` | Update run status (with `rowVersion`) |
| GET | `/api/versions/:id/report.xlsx` | Excel report |
| GET | `/api/versions/:id/report.pdf` | PDF report |
| POST | `/api/import/excel` | Import Excel file |

## Excel Import Format

Columns (Hebrew headers):

| Column | Description |
|--------|-------------|
| תכולה | Feature name (can span multiple rows) |
| תרחיש | Scenario |
| שלבים לביצוע | Steps |
| תוצר צפוי | Expected result |
| האם בוצע | כן = done/success, empty = need to run |
| הערות | Notes |

## Project Structure

```
QA-client/
  backend/          Express API + Prisma
  frontend/         Angular RTL app
  docker-compose.yml
```
