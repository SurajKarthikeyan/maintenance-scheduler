# Machine Maintenance Scheduler

A full end-to-end machine maintenance scheduling system built on a microservices architecture. Built for the NTT Data Case Study.

## Live Demo

**Frontend:** https://machine-scheduler-deployment.up.railway.app

> Login with your provided credentials. Contact the administrator to create an account.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Query, Recharts |
| Backend | Node.js, Express |
| Database | MySQL 8.0 |
| Authentication | JWT (jsonwebtoken), bcryptjs |
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

Each service owns its own database. Inter-service communication happens via HTTP. The Scheduler Service calls the Machine Service to sync machine status when a task is updated. The Alert Service calls the Machine Service on a cron job every hour to detect overdue machines.

---

## Features

### Core
- **Machine Registry** — view, create, edit and delete machines with location, maintenance interval and status tracking
- **Automated Due Date Calculation** — `next_due_date` and `days_overdue` computed live from SQL on every query
- **Task Scheduling** — schedule, update and complete maintenance tasks per machine
- **Inter-service Status Sync** — marking a task as `In Progress` automatically sets the machine to `Under Maintenance`; marking it `Completed` resets it to `Operational`
- **Automated Alert System** — cron job runs every hour detecting overdue machines and raising `Critical`, `Overdue` or `Due Soon` alerts automatically
- **Live Dashboard** — real-time stats with date range filter, machine status chart, active alerts panel and upcoming tasks

### Authentication & Access Control
- **JWT Authentication** — secure login with 8-hour token expiry
- **Role-based Access Control** — Admin and Technician roles
  - Admins: full access including machine create/delete and user management
  - Technicians: view everything, update task statuses only
- **User Management** — admins can add and remove users from within the app

### Advanced Features
- **Bulk Task Scheduling** — schedule the same task across multiple machines at once
- **Machine Notes** — free text notes field on each machine for technician observations
- **Maintenance History Export** — export any machine's task history as CSV or PDF
- **Machine Sorting** — sort machines by status (operational first, needs maintenance first, most overdue)
- **Machine & Alert Filtering** — filter tasks and alerts by machine
- **Clickable Dashboard Stats** — stat cards navigate directly to the relevant page
- **Search & Filter** — search machines by name/location, filter by status across all pages

---

## Project Structure

```
maintenance-scheduler/
├── docker-compose.yml
├── .gitignore
├── README.md
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
│       ├── middleware/auth.js
│       ├── routes/machines.js
│       ├── routes/auth.js
│       ├── controllers/machineController.js
│       ├── controllers/authController.js
│       ├── models/Machine.js
│       └── models/User.js
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
        │   ├── alerts.js
        │   └── auth.js
        ├── components/
        │   ├── StatusBadge.jsx
        │   ├── PageHeader.jsx
        │   ├── StatCard.jsx
        │   ├── Modal.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Machines.jsx
            ├── MachineDetail.jsx
            ├── Tasks.jsx
            ├── Alerts.jsx
            └── Users.jsx
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

### Default Admin Credentials (local)

| Username | Password | Role |
|---|---|---|
| admin | NTTDATA | admin |

---

## API Reference

### Auth Endpoints (Machine Service)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login and receive JWT token |
| GET | `/api/auth/me` | Required | Get current user info |
| GET | `/api/auth/users` | Admin | List all users |
| POST | `/api/auth/register` | Admin | Create a new user |
| DELETE | `/api/auth/users/:id` | Admin | Remove a user |

### Machine Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/machines` | Required | List all machines (`?status=` filter) |
| GET | `/api/machines/overdue` | Required | Machines past their due date |
| GET | `/api/machines/:id` | Required | Single machine with computed fields |
| POST | `/api/machines` | Admin | Create a machine |
| PATCH | `/api/machines/:id` | Required | Update machine (includes notes) |
| DELETE | `/api/machines/:id` | Admin | Delete machine |

### Scheduler Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Required | List all tasks |
| GET | `/api/tasks/upcoming?days=7` | Required | Tasks due within N days |
| GET | `/api/tasks/overdue` | Required | Tasks past scheduled date |
| GET | `/api/tasks/machine/:machineId` | Required | Tasks for a machine |
| POST | `/api/tasks` | Required | Create a task |
| PATCH | `/api/tasks/:id` | Required | Update task (triggers machine sync) |
| DELETE | `/api/tasks/:id` | Required | Delete task |

### Alert Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/alerts` | Required | List alerts with filters |
| PATCH | `/api/alerts/:id/resolve` | Required | Resolve an alert |
| POST | `/api/alerts/check` | Required | Manually trigger overdue check |

---

## Database Schema

### machines (machines_db)

| Column | Type | Description |
|---|---|---|
| machine_id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Machine name |
| location | VARCHAR(150) | Physical location |
| last_maintenance_date | DATE | Last serviced date |
| maintenance_interval_days | INT | Service frequency in days |
| status | ENUM | Operational / Needs Maintenance / Under Maintenance |
| notes | TEXT | Free text notes |
| created_at | TIMESTAMP | Auto-set on create |
| updated_at | TIMESTAMP | Auto-set on update |

**Computed fields (SQL):**
- `next_due_date` = `last_maintenance_date + maintenance_interval_days`
- `days_overdue` = `TODAY - next_due_date`

### users (machines_db)

| Column | Type | Description |
|---|---|---|
| user_id | INT AUTO_INCREMENT | Primary key |
| username | VARCHAR(50) UNIQUE | Login username |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| role | ENUM | admin / technician |
| created_at | TIMESTAMP | Auto-set on create |

### maintenance_tasks (tasks_db)

| Column | Type | Description |
|---|---|---|
| task_id | INT AUTO_INCREMENT | Primary key |
| machine_id | INT | References machine |
| task_description | VARCHAR(255) | Task details |
| scheduled_date | DATE | When task is due |
| status | ENUM | Scheduled / Pending / In Progress / Completed |
| completed_on | DATE | Auto-set when Completed |

### alerts (alerts_db)

| Column | Type | Description |
|---|---|---|
| alert_id | INT AUTO_INCREMENT | Primary key |
| machine_id | INT | References machine |
| machine_name | VARCHAR(100) | Denormalised for display |
| alert_type | ENUM | Critical / Overdue / Due Soon |
| message | VARCHAR(255) | Alert description |
| days_overdue | INT | Days past due date |
| resolved | BOOLEAN | Whether resolved |
| resolved_at | TIMESTAMP | When resolved |

---

## Authentication Flow

```
1. POST /api/auth/login { username, password }
2. Server validates password against bcrypt hash
3. Server returns JWT token (expires in 8 hours)
4. Frontend stores token in localStorage
5. Every subsequent request includes: Authorization: Bearer <token>
6. Gateway forwards Authorization header to downstream services
7. Machine Service validates token via JWT middleware
8. Role middleware enforces admin-only routes
```

---

## Alert Logic

| Condition | Alert Type | Machine Status |
|---|---|---|
| `days_overdue > 30` | Critical | Needs Maintenance |
| `days_overdue > 0` | Overdue | Needs Maintenance |
| `days_overdue >= -7` | Due Soon | No change |
| Machine is on schedule | Resolves alerts | Resets to Operational |

---

## Role Permissions

| Feature | Admin | Technician |
|---|---|---|
| View dashboard, machines, tasks, alerts | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Schedule tasks | ✅ | ✅ |
| Create machines | ✅ | ❌ |
| Edit / delete machines | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Manage users | ✅ | ❌ |

---

## Deployment (Railway)

Each service is deployed independently from the same GitHub repository with a Root Directory setting pointing to each service's subfolder.

### Live Service URLs

| Service | URL |
|---|---|
| Frontend | https://machine-scheduler-deployment.up.railway.app |
| Gateway | https://gateway-production-1e67.up.railway.app |
| Machine Service | https://maintenance-scheduler-production.up.railway.app |
| Scheduler Service | https://scheduler-service-production-829f.up.railway.app |
| Alert Service | https://alert-service-production-810d.up.railway.app |

### Required Environment Variables

| Service | Variable | Description |
|---|---|---|
| machine-service | `JWT_SECRET` | Secret key for signing JWT tokens |
| machine-service | `DB_*` | MySQL connection details |
| scheduler-service | `MACHINE_SERVICE_URL` | For inter-service calls |
| scheduler-service | `DB_*` | MySQL connection details |
| alert-service | `MACHINE_SERVICE_URL` | For overdue check and status sync |
| alert-service | `DB_*` | MySQL connection details |
| gateway | `MACHINE_SERVICE_URL` | Proxy target |
| gateway | `SCHEDULER_SERVICE_URL` | Proxy target |
| gateway | `ALERT_SERVICE_URL` | Proxy target |
| frontend | `VITE_API_BASE_URL` | Gateway URL (baked in at build time) |

---

## Seed Data

### Machines (20 machines across 2 plants)
Includes presses, conveyor lines, hydraulic presses, CNC mills, welding stations, air compressors, boilers, cooling towers and forklifts across Plant 1 and Plant 2.

### Tasks (31 tasks)
Mix of Completed, Scheduled, Pending and In Progress tasks across all machines.