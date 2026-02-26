-- ═══════════════════════════════════════════════════════════
-- RJ ITIN FUNNELS — PRODUCTION DATABASE SCHEMA
-- All tables for leads, clients, disputes, documents,
-- partners, analytics, email sequences, and RickBot logs
-- ═══════════════════════════════════════════════════════════

-- LEADS: Captured from funnel forms
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  plan TEXT DEFAULT 'basic',
  locale TEXT DEFAULT 'en',
  source TEXT DEFAULT 'funnel',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  mfsn_enrolled INTEGER DEFAULT 0,
  converted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_plan ON leads(plan);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

-- CLIENTS: Active paying clients
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  plan TEXT NOT NULL DEFAULT 'basic',
  locale TEXT DEFAULT 'en',
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  mfsn_username TEXT,
  mfsn_enrolled INTEGER DEFAULT 0,
  score_tu INTEGER,
  score_eq INTEGER,
  score_ex INTEGER,
  score_tu_start INTEGER,
  score_eq_start INTEGER,
  score_ex_start INTEGER,
  items_removed INTEGER DEFAULT 0,
  disputes_active INTEGER DEFAULT 0,
  disputes_total INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 1,
  partner_ref TEXT,
  lead_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_plan ON clients(plan);

-- DISPUTES: Individual dispute items per client
CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  bureau TEXT NOT NULL,
  account_type TEXT,
  amount REAL,
  status TEXT DEFAULT 'pending',
  round INTEGER DEFAULT 1,
  dispute_reason TEXT,
  fcra_section TEXT,
  letter_sent_at TEXT,
  response_at TEXT,
  result TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_disputes_client ON disputes(client_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_bureau ON disputes(bureau);

-- DOCUMENTS: Client document vault
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PDF',
  category TEXT DEFAULT 'audit',
  file_key TEXT,
  file_size INTEGER,
  uploaded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);

-- SCORE HISTORY: Track score changes over time
CREATE TABLE IF NOT EXISTS score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  score_tu INTEGER,
  score_eq INTEGER,
  score_ex INTEGER,
  recorded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_score_history_client ON score_history(client_id);

-- PARTNERS: Affiliate/referral partners
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  ref_code TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'bronze',
  status TEXT DEFAULT 'pending',
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_commission REAL DEFAULT 0,
  commission_paid REAL DEFAULT 0,
  payout_method TEXT DEFAULT 'paypal',
  payout_email TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_ref_code ON partners(ref_code);

-- REFERRALS: Track partner referrals
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  lead_id INTEGER,
  client_id INTEGER,
  status TEXT DEFAULT 'pending',
  commission_amount REAL DEFAULT 0,
  paid INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_partner ON referrals(partner_id);

-- PAYMENTS: Transaction log
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  plan TEXT,
  type TEXT DEFAULT 'one-time',
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- EMAIL LOG: Track sent emails
CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  sequence TEXT,
  step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'sent',
  resend_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON email_log(recipient);

-- ANALYTICS EVENTS: Track funnel events
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  page TEXT,
  locale TEXT,
  plan TEXT,
  visitor_id TEXT,
  ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);

-- RICKBOT CONVERSATIONS: Chat history
CREATE TABLE IF NOT EXISTS rickbot_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rickbot_session ON rickbot_logs(session_id);
