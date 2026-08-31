# Gift360 Admin Dashboard

Standalone admin dashboard for Gift360 — Spring Boot backend + React/Next.js frontend (frontend TBD).

## What's Inside

```
gift360-admin-backend/          ← Spring Boot project (port 8082)
├── src/main/java/              ← Java source
│   ├── controller/             ← AdminController + AuthController
│   ├── service/                ← AdminSpCaller (raw JDBC), AuditService
│   └── security/               ← JWT filter, AuthUser
├── src/main/resources/
│   ├── application.properties  ← DB config, JWT secret
│   └── db/
│       ├── admin_tables.sql    ← RBAC tables (admin_users, roles, permissions, audit)
│       └── admin_stored_procedures.sql ← 23 stored procedures
└── pom.xml                     ← Java 17, Spring Boot 3.2.5
```

## Setup Steps

### 1. Database (MySQL Workbench)
```sql
-- Connect to: 34.47.168.236:7306, user: sbuser, pass: KMmTKeK7yh77odw51gK12f
-- Run in order:
SOURCE admin_tables.sql;
SOURCE admin_stored_procedures.sql;
```

### 2. Backend
```bash
cd gift360-admin-backend
mvn spring-boot:run
```
Runs on `http://localhost:8082`

### 3. Test Login
```bash
POST http://localhost:8082/api/v1/admin/auth/login
{
  "username": "admin",
  "password": "Admin@123"
}
```

## API Docs

- `API_SPEC.md` — Full endpoint docs with request/response examples
- `API_FLAGS.md` — Endpoints with caveats or placeholder behavior
- `Gift360_Admin_Postman_Collection.json` — Import into Postman

## Key Points

- All data comes from existing `sabbpegiftvouchers` database (no duplication)
- Backend is thin API layer — calls stored procedures, returns JSON
- Auth is JWT-based, no RBAC yet (all users get all permissions)
- Some endpoints are placeholders (retry execute, config update) — flagged in API_FLAGS.md
- Geography endpoint removed (no reliable location data)
