# Mangalmay Sports Portal: Frontend (React + Vite)

Talks to the Spring Boot API in the `backend` project (no more localStorage mock).

## Run
```bash
# 1. start the backend first (http://localhost:8080), see its README
npm install
npm run dev          # http://localhost:5173, /api is proxied to :8080
```
Production: `npm run build`, serve `dist/`, and set `VITE_API_URL` to the backend URL (and add the site's origin to the backend's `CORS_ORIGIN`). See `.env.example`.

Admin login uses the account created by the backend on first start (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Structure
```
src/
  api.js            fetch wrapper + every API call
  common.jsx        shared helpers/components (colleges, money, validation, layout)
  main.jsx          app shell, routing, session + data loading
  pages/Landing.jsx, Auth.jsx, Student.jsx (events, registration, payment, receipt, account), Admin.jsx
```

## What was fixed vs the prototype
**Security:** hardcoded client-side admin login removed (roles are decided by the server and enforced on every admin endpoint); passwords are hashed (BCrypt) on the server and never stored in the browser; payment screenshots are uploaded to the server instead of base64 in localStorage; fee is taken from the server price, not the client.
**Registration bugs:** a pending/paid entry can no longer be reset to draft by clicking Continue; required fields and phone/team/member rules are now actually enforced (the old step 1/3 had no `<form>`); roster size is checked against the sport's team size; "Coming soon"/closed events can't be registered for; an invalid event id shows "Event not found" instead of silently using the first event; you can register for more than one sport in the same event; rejected payments can be corrected and resubmitted.
**Slots and payment:** slots are enforced per event on the server and shown live ("5 of 8 slots left", full sports are disabled); UTR must be 12 digits and unique; screenshot type/size is validated.
**Data consistency:** deleting a user/sport/event with submitted registrations is blocked instead of leaving orphan records; the landing page and account page use the live sports list (admin-added sports now appear with their icon); dead "continue" banner branch removed.
**Small stuff:** "MANAGLMAY" typo, duplicate GL Bajaj college, receipt ID now the same on screen and in the PDF, receipt explains pending/rejected status, jsPDF is loaded only when downloading a receipt, CSV export comes from the server with formula-injection protection, accessible labels on icon buttons.

## Notes
- The login token is stored in `localStorage` (simple and fine for this app). If you later need stronger protection against XSS token theft, switch to an httpOnly cookie plus CSRF protection.
- `VITE_UPI_VPA` defaults to the old placeholder UPI ID. Replace it with the institution's real merchant UPI ID before launch.
