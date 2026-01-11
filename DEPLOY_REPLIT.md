# Deploying a free demo to Replit (PlanetScale + Replit)

This guide walks you through a quick, no-credit-card deployment to demonstrate the Bus Seat Booking System using a free PlanetScale MySQL database and Replit for hosting the backend (Express) and Cloudflare Pages/Vercel for the frontend.

> Note: PlanetScale and Replit both offer free tiers that typically do not require adding credit card details for hobby/demo usage.

---

## Summary
- Database: PlanetScale (MySQL-compatible, free tier)
- Backend: Replit (Node.js, runs Express app)
- Frontend: Cloudflare Pages or Vercel (static site; free tier)

---

## Steps

1) Create a free PlanetScale database
- Sign up for PlanetScale and create a new **database** (name it e.g. `bookingbussystem`).
- Create a branch (main) and the connection credentials. You can run schema locally using the PlanetScale CLI (`pscale connect`) which opens a secure tunnel to run migrations.

2) Prepare database schema
- Clone or open the repo locally and run the migration script locally while connected to PlanetScale via `pscale connect` or using your preferred MySQL client connected to PlanetScale.

  Example (local):
  ```bash
  pscale connect bookingbussystem main --port 3307
  # In another terminal (connected to tunnel at 3307)
  mysql -u <username> -h 127.0.0.1 -P 3307 -p < bookingbussystem/database/schema.sql
  ```

- Alternatively, use the `update-database.js` script (this executes `database/schema.sql` statements):
  ```bash
  cd backend
  npm install
  npm run migrate
  ```

3) Push your repo to GitHub (if not already)
- Replit can import directly from GitHub.

4) Import project into Replit
- On Replit, create a new Repl -> Import from GitHub -> choose the `busbooking` repo.
- Set the run command to: `cd backend && npm start` (or configure Replit to run `npm start` in `backend` folder).

5) Add environment variables (Replit Secrets)
- In Replit, add the following env vars in the Secrets / Environment panel:
  - DB_HOST (PlanetScale host)
  - DB_USER (PlanetScale user)
  - DB_PASSWORD (PlanetScale password)
  - DB_NAME (bookingbussystem)
  - DB_PORT (usually 3306 or tunnel port)
  - JWT_SECRET (set a strong secret)
  - ALLOWED_ORIGINS (e.g., `https://your-frontend-url` or `*` for demo)
  - (Optional) SMTP_USER, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT (only if you want emails)

6) Run database migrations on Replit (one-time)
- Open the Replit console (shell) and run:
  ```bash
  cd backend
  npm install
  npm run migrate
  ```

7) Start the backend
- Start the Repl (Run) or run in console:
  ```bash
  cd backend
  npm start
  ```
- Replit will provide a public URL for the backend (copy it)

8) Deploy the frontend
- Deploy the `frontend` folder to Cloudflare Pages or Vercel and set the frontend API base URL to the Replit backend URL.
- For Cloudflare Pages, connect the GitHub repo and pick the `frontend` directory as the build source.
- For Vercel, import the project and set build command `npm run build` and output directory `dist`.

9) Test the app
- Open deployed frontend and create a booking. The backend is running on Replit and will connect to PlanetScale.

---

## Useful Notes & Troubleshooting
- PlanetScale sometimes requires running schema changes through the CLI (`pscale`) or by using their deploy requests (DDL restrictions on production branch). If `npm run migrate` fails, use `pscale connect` and run the SQL manually.
- If emails are not configured (no SMTP vars), the backend logs confirmation messages instead of sending an email.
- Replit free Repls sleep after inactivity — suitable for demos but not guaranteed always-on.

---

If you want, I can prepare a PR that adds this guide to the repo and adds the `npm run migrate` script (already added) and a short note in `README.md`. Tell me when you're ready and I will update the README and finish the PR changes.