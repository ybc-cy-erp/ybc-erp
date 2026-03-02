-- Migration 006: Link Memberships and Events to Counterparties
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Replace customer_name with counterparty_id in memberships and events

-- 1. Add counterparty_id to memberships (nullable initially)
ALTER TABLE memberships 
  ADD COLUMN counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL;

-- 2. Create index for performance
CREATE INDEX idx_memberships_counterparty ON memberships(counterparty_id);

-- 3. Add counterparty_id to events (nullable)
ALTER TABLE events
  ADD COLUMN counterparty_id UUID REFERENCES counterparties(id) ON DELETE SET NULL;

-- 4. Create index for events
CREATE INDEX idx_events_counterparty ON events(counterparty_id);

-- 5. Keep customer_name for backward compatibility and manual entries
-- Don't drop customer_name - allow both ways:
--   - Link to counterparty (preferred)
--   - Or enter manual name (fallback for quick entries)

COMMENT ON COLUMN memberships.counterparty_id IS 'Link to counterparty (preferred). If null, use customer_name';
COMMENT ON COLUMN events.counterparty_id IS 'Optional link to counterparty organizer/sponsor';
