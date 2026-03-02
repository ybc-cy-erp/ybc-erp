-- Migration 008: Demo Data Seeding
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Insert demo data for testing and demonstration

-- Insert demo counterparties (only if not exists)
INSERT INTO counterparties (tenant_id, name, email, phone, address, tags)
SELECT 
  'e5a61f2f-5a98-4ff3-bd16-a53a6720dd00'::uuid,
  name,
  email,
  phone,
  address,
  tags
FROM (VALUES
  ('Олег Польчін', 'oleg@example.com', '+357 99 123456', 'Limassol, Cyprus', ARRAY['VIP', 'Founder']),
  ('Марія Коваленко', 'maria@example.com', '+357 99 234567', 'Paphos, Cyprus', ARRAY['Regular']),
  ('ТОВ "Спорт Плюс"', 'info@sportplus.cy', '+357 25 345678', 'Nicosia, Cyprus', ARRAY['Partner', 'Corporate']),
  ('Іван Шевченко', 'ivan@example.com', '+357 99 456789', 'Larnaca, Cyprus', ARRAY['Student'])
) AS demo_data(name, email, phone, address, tags)
WHERE NOT EXISTS (
  SELECT 1 FROM counterparties 
  WHERE tenant_id = 'e5a61f2f-5a98-4ff3-bd16-a53a6720dd00'::uuid 
  AND name = demo_data.name
);

-- Insert demo membership plans (only if not exists)
INSERT INTO membership_plans (tenant_id, name, type, duration_days, daily_rate, status)
SELECT 
  'e5a61f2f-5a98-4ff3-bd16-a53a6720dd00'::uuid,
  name,
  type,
  duration_days,
  daily_rate,
  'active'
FROM (VALUES
  ('Базовий місячний', 'monthly', 30, 1.67),
  ('Квартальний', 'quarterly', 90, 1.50),
  ('Річний VIP', 'annual', 365, 1.23),
  ('Безстроковий', 'lifetime', NULL, 0)
) AS demo_plans(name, type, duration_days, daily_rate)
WHERE NOT EXISTS (
  SELECT 1 FROM membership_plans 
  WHERE tenant_id = 'e5a61f2f-5a98-4ff3-bd16-a53a6720dd00'::uuid 
  AND name = demo_plans.name
);

COMMENT ON COLUMN counterparties.tags IS 'Demo data includes VIP, Regular, Partner, Corporate, Student tags';
COMMENT ON COLUMN membership_plans.daily_rate IS 'Demo rates: Basic €1.67/day (€50/mo), Quarterly €1.50/day, Annual €1.23/day, Lifetime €0';
