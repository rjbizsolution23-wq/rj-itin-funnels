-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   CLEAN IT UP FUNNEL — Database Schema                         ║
-- ║   D1 SQLite for Cloudflare Workers                             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Leads table: captures all funnel submissions
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  plan TEXT DEFAULT 'basic',
  source TEXT DEFAULT 'funnel',
  status TEXT DEFAULT 'new',
  stripe_customer_id TEXT,
  stripe_checkout_id TEXT,
  mfsn_enrolled INTEGER DEFAULT 0,
  mfsn_username TEXT,
  audit_status TEXT DEFAULT 'pending',
  notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments table: tracks all Stripe transactions
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  stripe_payment_id TEXT UNIQUE,
  stripe_checkout_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  description TEXT,
  status TEXT DEFAULT 'pending',
  payment_type TEXT DEFAULT 'audit_fee',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Disputes table: tracks credit disputes filed
CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  bureau TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT,
  dispute_reason TEXT,
  fcra_section TEXT,
  letter_sent_at DATETIME,
  response_due_at DATETIME,
  response_received_at DATETIME,
  result TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Activity log: audit trail for compliance (CROA/FCRA)
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_lead ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_disputes_lead ON disputes(lead_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_log(lead_id);
