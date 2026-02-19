-- MeetSync Database Schema
-- Run: psql -U postgres -d where2meetclone -f db/schema.sql

-- Users: logged-in organizers who create events
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events: scheduling polls created by anyone (organizer optional)
CREATE TABLE IF NOT EXISTS events (
  id          VARCHAR(8)  PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  date_mode   VARCHAR(20)  NOT NULL CHECK (date_mode IN ('specific', 'daysOfWeek')),
  dates       TEXT[]       NOT NULL,
  start_hour  INTEGER      NOT NULL CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour    INTEGER      NOT NULL CHECK (end_hour > 0  AND end_hour <= 24),
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links: shareable URLs tied to an event
CREATE TABLE IF NOT EXISTS links (
  id         SERIAL PRIMARY KEY,
  event_id   VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token      VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Participants: anonymous users who join an event by entering a name
CREATE TABLE IF NOT EXISTS participants (
  id        SERIAL PRIMARY KEY,
  event_id  VARCHAR(8)  NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  username  VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, username)
);

-- Availability: each participant's slot selections per date
CREATE TABLE IF NOT EXISTS availability (
  id             SERIAL PRIMARY KEY,
  participant_id INTEGER    NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id       VARCHAR(8) NOT NULL REFERENCES events(id)      ON DELETE CASCADE,
  date_key       VARCHAR(20) NOT NULL,
  slots          BOOLEAN[]  NOT NULL,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (participant_id, event_id, date_key)
);
