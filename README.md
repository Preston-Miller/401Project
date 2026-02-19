# MeetSync

A When2Meet-style group availability scheduler.

---

## App Summary

Coordinating schedules across a group is a frustrating, time-consuming problem — endless reply-all email chains and chat messages trying to find a time that works for everyone. MeetSync solves this by giving anyone the ability to create a scheduling poll in seconds, share a single link, and let every participant mark their own availability on an interactive grid. The primary users are anyone who needs to organize a meeting, event, or hangout with multiple people — no account required to participate. An organizer fills out an event name, picks specific dates or recurring days of the week, and sets a time window. Participants open the shared link, enter a display name, and drag across the grid to mark when they are free. MeetSync then overlays everyone's responses into a group heatmap that makes the best shared time slot immediately obvious. All event and participant data is persisted in a PostgreSQL database, so responses are preserved across devices and browser sessions — unlike tools that rely on local storage alone.

---

## Tech Stack

| Layer          | Technology |
|----------------|-----------|
| **Frontend**   | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), React 19, TypeScript |
| **UI**         | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) component library, Lucide icons |
| **Backend**    | [Express.js 4](https://expressjs.com/) (Node.js) |
| **Database**   | [PostgreSQL](https://www.postgresql.org/) via the [`pg`](https://node-postgres.com/) driver |
| **Auth**       | None (participants are anonymous; users table is scaffolded for future organizer login) |
| **Dev tooling**| pnpm (frontend), nodemon (backend), dotenv |

---

## Architecture Diagram

```mermaid
flowchart TD
    User(["👤 User\n(Browser)"])

    subgraph Frontend["Frontend — Next.js · localhost:3000"]
        Pages["Pages\n/ and /event/[id]"]
        Context["EventProvider\n(React Context)"]
    end

    subgraph Backend["Backend — Express · localhost:3001"]
        API["/api/events\n/api/events/:id\n/api/events/:id/participants\n/api/events/:id/availability"]
    end

    subgraph Database["Database — PostgreSQL"]
        DB[("where2meetclone\n─────────────\nusers\nevents\nlinks\nparticipants\navailability")]
    end

    User -->|"HTTP (browser)"| Pages
    Pages -->|"React state / props"| Context
    Context -->|"fetch() POST/GET/PUT\nJSON over HTTP"| API
    API -->|"SQL queries\nvia node-postgres"| DB
    DB -->|"Result rows"| API
    API -->|"JSON response"| Context
```

---

## Prerequisites

Make sure the following are installed and available in your system PATH before continuing.

| Software | Version | Install | Verify |
|----------|---------|---------|--------|
| **Node.js** | 18 or higher | [nodejs.org](https://nodejs.org/en/download) | `node --version` |
| **npm** | bundled with Node | — | `npm --version` |
| **pnpm** | latest | `npm install -g pnpm` | `pnpm --version` |
| **PostgreSQL** | 14 or higher | [postgresql.org/download](https://www.postgresql.org/download/) | `psql --version` |
| **psql CLI** | bundled with PostgreSQL | — | `psql --version` |

> **Windows users:** after installing PostgreSQL, add `C:\Program Files\PostgreSQL\<version>\bin` to your system PATH so that `psql` is available in PowerShell.

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd 401Project
```

### 2. Create the PostgreSQL database

```powershell
psql -U postgres -c "CREATE DATABASE where2meetclone"
```

### 3. Run the schema and seed scripts

Run both commands from the **project root** (`401Project/`):

```powershell
psql -U postgres -d where2meetclone -f db/schema.sql
psql -U postgres -d where2meetclone -f db/seed.sql
```

Expected output for `schema.sql`: five `CREATE TABLE` messages.  
Expected output for `seed.sql`: five `INSERT 0 1` messages.

### 4. Configure backend environment variables

```powershell
copy backend\.env.example backend\.env
```

Open `backend/.env` and replace `YOUR_PASSWORD_HERE` with your PostgreSQL password:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/where2meetclone
PORT=3001
```

### 5. Install backend dependencies

```powershell
cd backend
npm install
cd ..
```

### 6. Install frontend dependencies

```powershell
cd frontend
pnpm install
cd ..
```

---

## Running the Application

Start the **backend** and **frontend** in two separate terminal windows.

**Terminal 1 — Backend:**

```powershell
cd backend
npm run dev
```

You should see:
```
MeetSync backend running on http://localhost:3001
```

**Terminal 2 — Frontend:**

```powershell
cd frontend
pnpm dev
```

You should see:
```
▲ Next.js 16.1.6 (Turbopack)
- Local: http://localhost:3000
```

> If port 3000 is already in use, Next.js will automatically pick the next available port (e.g. 3001, 3002). Check the terminal output for the actual URL.

Open the URL shown in the frontend terminal in your browser.

---

## Verifying the Vertical Slice

The implemented vertical slice is **Create Event** — clicking the button sends the event to the Express backend, which persists it to PostgreSQL and returns the saved record to the frontend.

### Step-by-step

1. Open the app in your browser (e.g. `http://localhost:3000`).
2. Fill in an event name, select one or more dates, and choose a time range.
3. Click **Create Event**.
4. You are redirected to `/event/<id>` — the ID was generated and returned by the database, not the browser.
5. On the event page, enter a participant name and click **Join**.

### Confirm the database was updated

Open a new terminal and run:

```powershell
psql -U postgres -d where2meetclone -c "SELECT * FROM events;"
psql -U postgres -d where2meetclone -c "SELECT * FROM participants;"
psql -U postgres -d where2meetclone -c "SELECT * FROM links;"
```

You should see your newly created event row, a participant row for the name you entered, and an auto-generated shareable link token.

### Verify persistence after refresh

1. Copy the URL from your browser (e.g. `http://localhost:3000/event/abc12345`).
2. Close the browser tab.
3. Open a new tab and paste the URL.
4. The event loads from the database — the name, dates, and time range are all restored.
5. If you re-enter the same participant name, the group availability grid picks up where you left off.
