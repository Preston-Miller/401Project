require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, etc.) and any localhost port
      if (!origin || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      // Also allow an explicit FRONTEND_URL if set
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// Map snake_case DB row to camelCase MeetEvent for the frontend
function rowToEvent(row) {
  return {
    id: row.id,
    name: row.name,
    dateMode: row.date_mode,
    dates: row.dates,
    startHour: row.start_hour,
    endHour: row.end_hour,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function generateEventId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// -----------------------------------------------------------------------
// POST /api/events — create a new event
// This is the "one working button" vertical slice: Create Event button
// -----------------------------------------------------------------------
app.post("/api/events", async (req, res) => {
  const { name, dateMode, dates, startHour, endHour } = req.body;

  if (!name || !dateMode || !dates?.length || startHour == null || endHour == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (startHour >= endHour) {
    return res.status(400).json({ error: "startHour must be less than endHour" });
  }

  const id = generateEventId();
  const token = crypto.randomBytes(16).toString("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      `INSERT INTO events (id, name, date_mode, dates, start_hour, end_hour)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, dateMode, dates, startHour, endHour]
    );

    await client.query(
      `INSERT INTO links (event_id, token) VALUES ($1, $2)`,
      [id, token]
    );

    await client.query("COMMIT");
    res.status(201).json(rowToEvent(eventResult.rows[0]));
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/events error:", err);
    res.status(500).json({ error: "Failed to create event" });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------
// GET /api/events/:id — load a single event by ID
// -----------------------------------------------------------------------
app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(rowToEvent(result.rows[0]));
  } catch (err) {
    console.error("GET /api/events/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------------------------------------------------
// POST /api/events/:id/participants — register a participant by username
// Body: { username: string }
// -----------------------------------------------------------------------
app.post("/api/events/:id/participants", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO participants (event_id, username)
       VALUES ($1, $2)
       ON CONFLICT (event_id, username) DO UPDATE SET username = EXCLUDED.username
       RETURNING *`,
      [req.params.id, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/events/:id/participants error:", err);
    res.status(500).json({ error: "Failed to register participant" });
  }
});

// -----------------------------------------------------------------------
// GET /api/events/:id/availability — get all participant availability
// -----------------------------------------------------------------------
app.get("/api/events/:id/availability", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.username, a.date_key, a.slots
       FROM availability a
       JOIN participants p ON a.participant_id = p.id
       WHERE a.event_id = $1`,
      [req.params.id]
    );

    // Build AvailabilityMap: { username: { dateKey: boolean[] } }
    const map = {};
    for (const row of result.rows) {
      if (!map[row.username]) map[row.username] = {};
      map[row.username][row.date_key] = row.slots;
    }
    res.json(map);
  } catch (err) {
    console.error("GET /api/events/:id/availability error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------------------------------------------------
// PUT /api/events/:id/availability — save a participant's availability
// Body: { username: string, slots: Record<string, boolean[]> }
// -----------------------------------------------------------------------
app.put("/api/events/:id/availability", async (req, res) => {
  const { username, slots } = req.body;
  if (!username || !slots) {
    return res.status(400).json({ error: "Missing username or slots" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Upsert participant
    const pResult = await client.query(
      `INSERT INTO participants (event_id, username)
       VALUES ($1, $2)
       ON CONFLICT (event_id, username) DO UPDATE SET username = EXCLUDED.username
       RETURNING id`,
      [req.params.id, username]
    );
    const participantId = pResult.rows[0].id;

    // Upsert availability for each date
    for (const [dateKey, slotArray] of Object.entries(slots)) {
      await client.query(
        `INSERT INTO availability (participant_id, event_id, date_key, slots)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (participant_id, event_id, date_key)
         DO UPDATE SET slots = EXCLUDED.slots, updated_at = NOW()`,
        [participantId, req.params.id, dateKey, slotArray]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("PUT /api/events/:id/availability error:", err);
    res.status(500).json({ error: "Failed to save availability" });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MeetSync backend running on http://localhost:${PORT}`);
});
