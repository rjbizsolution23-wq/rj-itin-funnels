-- Seed data for local development testing
INSERT OR IGNORE INTO leads (name, email, phone, plan, status, source) VALUES
  ('Test User', 'test@example.com', '5551234567', 'basic', 'new', 'funnel'),
  ('Jane Demo', 'jane@demo.com', '5559876543', 'basic', 'audit_complete', 'funnel');
