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
- Assign a responsible team to each feature
- Declare a display name (no login) so updates show who changed a run
- Parallel QA updates with optimistic locking (409 on conflict)
- Excel import from existing QA spreadsheets
- Excel and PDF report export per version

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and/or the full stack)

## Quick Start

### Docker Compose (full stack)

```bash
docker compose up -d --build
```

- App: http://localhost:8080
- API (direct): http://localhost:3001
- Postgres (host): `localhost:5433`

The frontend container writes `/config.json` from `API_URL` at startup, so you can point the browser at a different backend **without rebuilding the image**.

### Local development

**1. Start PostgreSQL**

```bash
docker compose up -d postgres
```

**2. Backend**

```bash
cd backend
cp .env.example .env   # if .env doesn't exist
# If using Compose Postgres, set DATABASE_URL host port to 5433
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Backend runs at http://localhost:3001

**3. Frontend**

```bash
cd frontend
npm install
npm start
```

Frontend runs at http://localhost:8080 and proxies `/api` to the backend. Default [`frontend/public/config.json`](frontend/public/config.json) uses `"apiUrl": "/api"`. To call a remote API from local `ng serve`, change that file (no rebuild of env-specific bundles).

## Environment variables

### Frontend container

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `/api` | Backend URL the **browser** calls. Relative (`/api`) for same-origin / Ingress, or absolute (`https://qa-api.example.com/api`). |
| `BACKEND_URL` | unset | Optional nginx reverse-proxy target (e.g. `http://backend:3000`). When unset, nginx serves the SPA only. |
| `PORT` | `8080` | nginx listen port (unprivileged; required on OpenShift). |

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | required | PostgreSQL connection string. |
| `PORT` | `3000` | Listen port. OpenShift typically sets `8080`. |
| `HOST` | `0.0.0.0` | Bind address. |
| `PUPPETEER_EXECUTABLE_PATH` | set in image | Chromium path for PDF reports. |

The API allows all browser origins (`Access-Control-Allow-Origin: *`), so the SPA can call it from another host when `API_URL` is an absolute URL.

Point the client at another backend without rebuilding:

```bash
docker compose run --rm -e API_URL=https://qa-api.example.com/api -e PORT=8080 -p 8080:8080 frontend
```

Or set `API_URL` on the frontend Deployment / ConfigMap. Sample Kubernetes/OpenShift YAML is in [`deploy/k8s/`](deploy/k8s/).

PDF generation on a cluster may need a writable `/dev/shm` (emptyDir `Memory`) because Chromium is launched with `--no-sandbox`.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/actors` | Display names that have updated runs |
| GET/POST/PATCH/DELETE | `/api/teams` | Teams responsible for features |
| GET/POST/PATCH/DELETE | `/api/features` | Feature groups |
| GET/POST/PATCH/DELETE | `/api/test-cases` | Test cases |
| GET/POST | `/api/versions` | App versions |
| GET | `/api/versions/:id` | Single version with stats |
| POST | `/api/versions/:id/finish` | Finish and snapshot a version |
| GET | `/api/versions/:id/runs` | Test runs for a version |
| PATCH | `/api/versions/:id/runs/:runId` | Update run status (with `rowVersion`) |
| GET | `/api/versions/:id/report.xlsx` | Excel report |
| GET | `/api/versions/:id/report.pdf` | PDF report |
| POST | `/api/import/excel` | Import Excel file |

Write requests (POST/PATCH/DELETE) require an `X-Actor-Name` header. The UI asks each person to declare a display name and sends it automatically. This is identification on a trusted network, not authentication.

## Excel Import Format

Columns (Hebrew headers):

| Column | Description |
|--------|-------------|
| תכולה | Feature name (can span multiple rows) |
| צוות | Optional team name; created if missing and assigned to the feature |
| תרחיש | Scenario |
| שלבים לביצוע | Steps |
| תוצר צפוי | Expected result |
| האם בוצע | כן / הצליח = done+success, לא / נכשל = done+failed, באג = has_bug, להריץ מחדש = need_to_rerun, empty = need to run |
| הערות | Notes |

## Project Structure

```
QA-client/
  backend/          Express API + Prisma
  frontend/         Angular RTL app
  deploy/k8s/       Sample Kubernetes / OpenShift manifests
  docker-compose.yml
```
