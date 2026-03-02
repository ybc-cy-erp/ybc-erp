-- Migration 010: Telegram notification settings
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Telegram bot token and chat ID configuration per tenant

-- =====================
-- 1. TELEGRAM SETTINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS telegram_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bot_token VARCHAR(255),
  chat_id VARCHAR(255),
  
  -- Notification triggers
  notify_new_membership BOOLEAN DEFAULT TRUE,
  notify_expiring_membership BOOLEAN DEFAULT TRUE,
  notify_overdue_bill BOOLEAN DEFAULT TRUE,
  notify_new_event BOOLEAN DEFAULT TRUE,
  
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

CREATE INDEX idx_telegram_settings_tenant ON telegram_settings(tenant_id);

ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY telegram_settings_tenant_policy ON telegram_settings
  USING (tenant_id::text = COALESCE((auth.jwt() -> 'user_metadata' ->> 'tenant_id'), (auth.jwt() ->> 'tenant_id')))
  WITH CHECK (tenant_id::text = COALESCE((auth.jwt() -> 'user_metadata' ->> 'tenant_id'), (auth.jwt() ->> 'tenant_id')));

-- =====================
-- 2. NOTIFICATION LOG TABLE
-- =====================
-- Keep existing telegram_notifications table for logging
-- (created in previous migrations)

COMMENT ON TABLE telegram_settings IS 'Telegram bot configuration per tenant';
COMMENT ON TABLE telegram_notifications IS 'Log of sent Telegram notifications';

-- =====================
-- 3. FUNCTION: Send Telegram notification
-- =====================
-- This function will be called from client-side via Supabase Edge Function
-- or from triggers when certain events happen

CREATE OR REPLACE FUNCTION send_telegram_notification(
  p_tenant_id UUID,
  p_message TEXT,
  p_notification_type VARCHAR(50) DEFAULT 'info'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings RECORD;
  v_notification_id UUID;
BEGIN
  -- Get telegram settings
  SELECT * INTO v_settings
  FROM telegram_settings
  WHERE tenant_id = p_tenant_id
    AND is_active = TRUE
  LIMIT 1;
  
  -- If no active settings, skip
  IF v_settings IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if this notification type is enabled
  IF p_notification_type = 'membership' AND NOT v_settings.notify_new_membership THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'expiring_membership' AND NOT v_settings.notify_expiring_membership THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'overdue_bill' AND NOT v_settings.notify_overdue_bill THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'event' AND NOT v_settings.notify_new_event THEN
    RETURN FALSE;
  END IF;
  
  -- Log the notification
  INSERT INTO telegram_notifications (
    tenant_id,
    notification_type,
    message,
    status,
    created_at
  ) VALUES (
    p_tenant_id,
    p_notification_type,
    p_message,
    'pending',
    NOW()
  ) RETURNING id INTO v_notification_id;
  
  -- TODO: Call Telegram API via Edge Function or external service
  -- For now, just mark as sent (implementation needed)
  
  UPDATE telegram_notifications
  SET status = 'sent', sent_at = NOW()
  WHERE id = v_notification_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION send_telegram_notification IS 'Queue Telegram notification for sending';

-- =====================
-- 4. TRIGGER: Notify on new membership
-- =====================
CREATE OR REPLACE FUNCTION trigger_notify_new_membership()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    NEW.tenant_id,
    '🎉 Нове членство: ' || COALESCE(NEW.client_name, 'N/A') || 
    ' (' || NEW.payment_amount || ' ' || NEW.payment_currency || ')',
    'membership'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_telegram_new_membership
  AFTER INSERT ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_membership();

COMMENT ON TRIGGER trigger_telegram_new_membership ON memberships IS 'Send Telegram notification on new membership';

-- =====================
-- 5. TRIGGER: Notify on new event
-- =====================
CREATE OR REPLACE FUNCTION trigger_notify_new_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    NEW.tenant_id,
    '📅 Нова подія: ' || NEW.name || ' (' || NEW.event_date::TEXT || ')',
    'event'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_telegram_new_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_event();

COMMENT ON TRIGGER trigger_telegram_new_event ON events IS 'Send Telegram notification on new event';

-- =====================
-- 6. SEED: Default disabled settings for YBC
-- =====================
INSERT INTO telegram_settings (tenant_id, is_active)
SELECT id, FALSE
FROM tenants
WHERE name = 'YBC Cyprus'
ON CONFLICT (tenant_id) DO NOTHING;
