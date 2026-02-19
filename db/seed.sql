-- MeetSync Seed Data
-- Run: psql -U postgres -d where2meetclone -f db/seed.sql

-- Sample organizer user
INSERT INTO users (username, email, password_hash) VALUES
  ('organizer1', 'organizer@example.com', '$2b$10$placeholder_hash_do_not_use_in_production')
ON CONFLICT (username) DO NOTHING;

-- Sample event (created by the organizer)
INSERT INTO events (id, name, date_mode, dates, start_hour, end_hour, created_by) VALUES
  ('seed0001', 'Team Weekly Sync', 'specific',
   ARRAY['2026-03-02', '2026-03-03', '2026-03-04'],
   9, 17, 1)
ON CONFLICT (id) DO NOTHING;

-- Sample shareable link for the event
INSERT INTO links (event_id, token) VALUES
  ('seed0001', 'seed-link-token-abc123xyz456def789')
ON CONFLICT (token) DO NOTHING;

-- Sample participant who joined the event
INSERT INTO participants (event_id, username) VALUES
  ('seed0001', 'alice')
ON CONFLICT (event_id, username) DO NOTHING;

-- Sample availability for alice on the first date
-- 16 slots = 9 AM to 5 PM in 30-min increments
INSERT INTO availability (participant_id, event_id, date_key, slots) VALUES
  (1, 'seed0001', '2026-03-02',
   ARRAY[false, false, true, true, true, true, true, true,
         false, false, true, true, true, true, false, false])
ON CONFLICT (participant_id, event_id, date_key) DO NOTHING;
