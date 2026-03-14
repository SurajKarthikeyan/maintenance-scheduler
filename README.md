# Machine Maintenance Scheduler

A full end-to-end machine maintenance scheduling system built on a microservices architecture. Built for the NTT Data Case Study.

## Live Demo

**Frontend:** https://machine-scheduler-deployment.up.railway.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Query, Recharts |
| Backend | Node.js, Express |
| Database | MySQL 8.0 |
| Architecture | Microservices with API Gateway |
| Deployment | Railway (cloud) / Docker Compose (local) |

---

## Architecture Overview

```
React Frontend
      ↓
API Gateway (port 8080)
      ↓
┌─────────────────┬──────────────────┬─────────────────┐
│ Machine Service │ Scheduler Service│ Alert Service   │
│ (port 3001)     │ (port 3002)      │ (port 3003)     │
└────────┬────────┴────────┬─────────┴────────┬────────┘
         ↓                 ↓                  ↓
    machines_db        tasks_db           alerts_db
```

Each service owns its own database. Inter-service communication happens via HTTP — the Scheduler Service calls the Machine Service to sync machine status when a task is updated. The Alert Service calls the Machine Service on a cron job every hour to detect overdue machines.

---

## Features

- **Machine Registry** — view, create, edit and delete machines with location, maintenance interval and status tracking
- **Automated Due Date Calculation** — `next_due_date` and `days_overdue` computed live from `last_maintenance_date + maintenance_interval_days`
- **Task Scheduling** — schedule, update and complete maintenance tasks per machine
- **Inter-service Status Sync** — marking a task as `In Progress` automatically sets the machine to `Under Maintenance`; marking it `Completed` resets it to `Operational`
- **Automated Alert System** — cron job runs every hour detecting overdue machines and raising `Critical`, `Overdue` or `Due Soon` alerts automatically
- **Live Dashboard** — real-time stats, machine status chart, active alerts panel and upcoming tasks
- **Search & Filtering** — filter machines and tasks by status, search by name

---

## Project Structure

```
maintenance-scheduler/
├── docker-compose.yml
├── .gitignore
├── db/
│   ├── machine-service/01_init.sql
│   ├── scheduler-service/01_init.sql
│   └── alert-service/01_init.sql
├── machine-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── config/db.js
│   └── src/
│       ├── index.js
│       ├── routes/machines.js
│       ├── controllers/machineController.js
│       └── models/Machine.js
├── scheduler-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── config/db.js
│   └── src/
│       ├── index.js
│       ├── routes/tasks.js
│       ├── controllers/taskController.js
│       └── models/Task.js
├── alert-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── config/db.js
│   └── src/
│       ├── index.js
│       ├── routes/alerts.js
│       ├── controllers/alertController.js
│       ├── models/Alert.js
│       └── jobs/overdueCheck.js
├── gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── src/index.js
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api/
        │   ├── client.js
        │   ├── machines.js
        │   ├── tasks.js
        │   └── alerts.js
        ├── components/
        │   ├── StatusBadge.jsx
        │   ├── PageHeader.jsx
        │   ├── StatCard.jsx
        │   └── Modal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Machines.jsx
            ├── MachineDetail.jsx
            ├── Tasks.jsx
            └── Alerts.jsx
```

---

## Running Locally

### Prerequisites

- Node.js v20+
- Docker Desktop
- Git

### Steps

```bash
# Clone the repo
git clone https://github.com/SurajKarthikeyan/maintenance-scheduler.git
cd maintenance-scheduler

# Start all services
docker compose up --build
```

### Local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Gateway | http://localhost:8080 |
| Machine Service | http://localhost:3001 |
| Scheduler Service | http://localhost:3002 |
| Alert Service | http://localhost:3003 |
| machines_db | localhost:3307 |
| tasks_db | localhost:3308 |
| alerts_db | localhost:3309 |

---

## API Reference

### Machine Service

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/machines` | List all machines (`?status=` filter) |
| GET | `/api/machines/overdue` | Machines past their due date |
| GET | `/api/machines/:id` | Single machine with computed fields |
| POST | `/api/machines` | Create a machine |
| PATCH | `/api/machines/:id` | Update machine |
| DELETE | `/api/machines/:id` | Delete machine |

### Scheduler Service

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/tasks` | List all tasks (`?machine_id=` `?status=` filters) |
| GET | `/api/tasks/upcoming?days=7` | Tasks due within N days |
| GET | `/api/tasks/overdue` | Tasks past their scheduled date |
| GET | `/api/tasks/machine/:machineId` | All tasks for a machine |
| GET | `/api/tasks/:id` | Single task |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task (triggers machine status sync) |
| DELETE | `/api/tasks/:id` | Delete task |

### Alert Service

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/alerts` | List alerts (`?resolved=` `?machine_id=` `?alert_type=` filters) |
| GET | `/api/alerts/:id` | Single alert |
| PATCH | `/api/alerts/:id/resolve` | Resolve an alert |
| POST | `/api/alerts/check` | Manually trigger overdue check |

### Gateway

| Route | Forwards To |
|---|---|
| `/api/machines/*` | Machine Service |
| `/api/tasks/*` | Scheduler Service |
| `/api/alerts/*` | Alert Service |

---

## Database Schema

### machines

| Column | Type | Description |
|---|---|---|
| machine_id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Machine name |
| location | VARCHAR(150) | Physical location |
| last_maintenance_date | DATE | Last serviced date |
| maintenance_interval_days | INT | Service frequency in days |
| status | ENUM | Operational / Needs Maintenance / Under Maintenance |
| created_at | TIMESTAMP | Auto-set on create |
| updated_at | TIMESTAMP | Auto-set on update |

**Computed fields (SQL):**
- `next_due_date` = `last_maintenance_date + maintenance_interval_days`
- `days_overdue` = `TODAY - next_due_date`

### maintenance_tasks

| Column | Type | Description |
|---|---|---|
| task_id | INT AUTO_INCREMENT | Primary key |
| machine_id | INT | References machine |
| task_description | VARCHAR(255) | Task details |
| scheduled_date | DATE | When task is due |
| status | ENUM | Scheduled / Pending / In Progress / Completed |
| completed_on | DATE | Auto-set when status = Completed |

### alerts

| Column | Type | Description |
|---|---|---|
| alert_id | INT AUTO_INCREMENT | Primary key |
| machine_id | INT | References machine |
| machine_name | VARCHAR(100) | Denormalized for display |
| alert_type | ENUM | Critical / Overdue / Due Soon |
| message | VARCHAR(255) | Alert description |
| days_overdue | INT | Days past due date |
| resolved | BOOLEAN | Whether alert is resolved |
| resolved_at | TIMESTAMP | When resolved |

---

## Alert Logic

The Alert Service runs a cron job every hour:

| Condition | Alert Type |
|---|---|
| `days_overdue > 30` | Critical |
| `days_overdue > 0` | Overdue |
| `days_overdue >= -7` | Due Soon |
| Machine is on schedule | Resolves existing alerts |

---

## Inter-Service Communication

When a task status is updated via the Scheduler Service:

| Task Status | Machine Status | Additional Update |
|---|---|---|
| In Progress | Under Maintenance | — |
| Completed | Operational | `last_maintenance_date` = today |

---

## Seed Data

### Machines
| Name | Location | Interval | Status |
|---|---|---|---|
| Press 101 | Plant 1 - Section A | 30 days | Operational |
| Press 102 | Plant 1 - Section A | 30 days | Needs Maintenance |
| Conveyor Line 3 | Plant 2 - Packaging Area | 7 days | Operational |
| Pump X7 | Plant 1 - Basement | 90 days | Under Maintenance |
| Generator G1 | Plant 2 - Power Room | 180 days | Operational |

### Tasks
| Machine | Description | Status |
|---|---|---|
| Press 101 | Replace hydraulic oil | Completed |
| Press 101 | General inspection | Completed |
| Press 101 | Replace coolant filter | Scheduled |
| Press 102 | Lubrication check | Pending |
| Press 102 | Inspect safety guards | Completed |
| Conveyor Line 3 | Weekly belt alignment | Completed |
| Conveyor Line 3 | Motor temperature check | Scheduled |
| Pump X7 | Replace valve seals | In Progress |
| Pump X7 | Pressure test | Completed |
| Generator G1 | Inspect generator coils | Completed |
| Generator G1 | Change oil filter | Scheduled |
