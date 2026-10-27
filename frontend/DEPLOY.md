# Deploying for the college event (read this once before going live)

## 1. Test locally first (10 minutes)
1. Start the backend (`mvn spring-boot:run`) and note the admin password.
2. Run `python3 smoke_test.py http://localhost:8080 admin@mangalmay.org 'ADMIN_PASSWORD'`. Every line must say PASS.
3. Start the frontend, then click through the whole flow once on your phone and once on a laptop: signup -> register -> pay -> admin verify.

## 2. Hosting that will not lose data
Free tiers often wipe the disk on every redeploy. That would delete your database AND all payment screenshots.
- **Database:** use MySQL/Postgres from the host (not the default H2 file). Set `DB_URL`, `DB_USER`, `DB_PASSWORD`.
- **Screenshots:** attach a persistent volume and point `UPLOAD_DIR` at it (e.g. `/data/uploads`). Without a volume, screenshots disappear on redeploy.
- **Backend env vars:** `JWT_SECRET` (32+ chars), `ADMIN_PASSWORD`, `CORS_ORIGIN=https://your-frontend-url`, DB vars, `UPLOAD_DIR`.
- **Backend build:** a Dockerfile is included (works on Railway, Render, Fly.io).
- **Frontend:** deploy `dist/` on Netlify/Vercel (the `_redirects` / `vercel.json` files make page refresh and direct links work). Set `VITE_API_URL=https://your-backend-url` BEFORE `npm run build`, plus `VITE_UPI_VPA`.
- Use HTTPS for both.

## 3. Day-before checklist
- [ ] Real UPI ID set and a Rs.1 test payment made to it
- [ ] Admin password changed from any test value; only you know it
- [ ] Event status set to "Registration open", sports/fees/slots correct in the admin panel
- [ ] 3 friends registered from their own phones; you verified/rejected one
- [ ] Take a backup of the database (and the uploads folder) once registration starts, then daily
- [ ] Tell students: payment screenshot must show the 12-digit UTR

## 4. During the event
- Check the Payments tab regularly; match each UTR with your bank/UPI statement before pressing verify.
- Export the CSV every evening as your own backup.
