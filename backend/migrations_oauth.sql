-- Migration: Add Google OAuth support
-- Run this after the initial migrations.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
