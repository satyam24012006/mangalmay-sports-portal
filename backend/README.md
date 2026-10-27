# Mangalmay Sports Portal: Backend (Spring Boot 3, Java 17)

REST API for the Mangalmay Sports Portal React app: JWT auth, events/sports, registrations with team rosters,
UPI payment-proof upload, and admin verification, stats and CSV export.

## Run

```bash
# Java 17+ and Maven required
export ADMIN_PASSWORD='choose-a-strong-password'      # optional; if unset a random one is printed in the log on first start
export JWT_SECRET='at-least-32-characters-long-random-string'   # set this for anything beyond local dev
mvn spring-boot:run
```

API runs on http://localhost:8080. The React app (Vite, port 5173) proxies `/api` to it.
Default DB is a local H2 file (`./data`). Uploaded screenshots go to `./uploads`.

### MySQL instead of H2
```bash
export DB_URL='jdbc:mysql://localhost:3306/sportsdb?createDatabaseIfNotExist=true'
export DB_USER=root DB_PASSWORD=secret
```
(`ddl-auto: update` creates tables; for production switch to Flyway/Liquibase migrations.)

## Environment variables
| Variable | Purpose | Default |
|---|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin account created on first start | `admin@mangalmay.org` / random (logged once) |
| `JWT_SECRET` | HMAC key, 32+ chars | dev-only value, **change it** |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Database | H2 file |
| `UPLOAD_DIR` | Payment screenshot folder | `./uploads` |

## Endpoints
Auth header: `Authorization: Bearer <token>`. Errors are `{ "error": "message" }`.

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login` | public | returns `{token, user}`; login is rate-limited (5 fails / 15 min) |
| GET | `/api/auth/me` | any user | |
| GET | `/api/events`, `/api/sports?eventId=` | public | with `eventId`, each sport includes `remaining` slots for that event |
| GET | `/api/enrollments/mine` | student | |
| GET | `/api/enrollments/{id}` | owner | |
| PUT | `/api/enrollments/draft` | student | create/update draft (auto-save), partial data allowed |
| POST | `/api/enrollments/{id}/payment` | owner | multipart `utr` (12 digits) + `file` (PNG/JPG/WEBP, 3 MB). Validates everything, enforces slots, DRAFT -> PENDING |
| GET | `/api/enrollments/{id}/proof` | owner / admin | screenshot bytes |
| GET/POST/DELETE | `/api/admin/users[/{id}]` | admin | |
| POST/PUT/DELETE | `/api/admin/events[/{id}]`, `/api/admin/sports[/{id}]` | admin | |
| GET | `/api/admin/enrollments` | admin | |
| PATCH | `/api/admin/enrollments/{id}/status` | admin | body `{"status":"verified"|"rejected"}`, only from pending |
| DELETE | `/api/admin/enrollments/{id}` | admin | not while pending |
| GET | `/api/admin/stats`, `/api/admin/payments/export` | admin | CSV with formula-injection guard |

## Rules enforced on the server
- Fee always comes from the sport's price, never from the client.
- Slots are per event: a slot = one PENDING or VERIFIED entry; the sport row is locked while the last slot is taken.
- UTR must be 12 digits and unique. A user can't hold two pending/verified entries for the same sport + event.
- Roster size comes from the sport's `teamSize` text (`TeamRules.java`): "11 players" = 11 to 15 names, "Singles / Doubles" = 1 to 2. Edit that file for different rules.
- Submitted (pending/verified) registrations can't be edited. Rejected ones go back to draft for resubmission.
- Deleting a user/event/sport is blocked while it has submitted registrations (drafts are cleaned up automatically).

## Before real use
- Replace the placeholder UPI ID in the frontend (`VITE_UPI_VPA`) with the verified merchant UPI ID. Payment is confirmed manually by an admin against the bank/UPI statement.
- Serve over HTTPS, set a real `JWT_SECRET`, `ADMIN_PASSWORD` and `CORS_ORIGIN`.
- Add a privacy notice, a data-retention policy, and database backups.
