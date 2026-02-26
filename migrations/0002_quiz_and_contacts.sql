-- ═══════════════════════════════════════════════════════════
-- RJ ITIN FUNNELS — QUIZ RESPONSES & CONTACT SUBMISSIONS
-- Migration 0002: Add quiz_responses and contact_submissions tables
-- ═══════════════════════════════════════════════════════════

-- QUIZ RESPONSES: ITIN Credit Roadmap Quiz submissions
CREATE TABLE IF NOT EXISTS quiz_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  locale TEXT DEFAULT 'en',
  -- Quiz answers
  negative_items TEXT,
  credit_score_range TEXT,
  goal TEXT,
  timeline TEXT,
  has_monitoring TEXT,
  -- Computed recommendation
  recommended_plan TEXT,
  -- Tracking
  source TEXT DEFAULT 'quiz',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ref TEXT,
  converted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quiz_email ON quiz_responses(email);
CREATE INDEX IF NOT EXISTS idx_quiz_created ON quiz_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_plan ON quiz_responses(recommended_plan);

-- CONTACT SUBMISSIONS: Contact form entries
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at);
