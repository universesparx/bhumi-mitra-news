-- News-only D1 proposal. NOT applied to any database.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS editorial_items (
  id TEXT PRIMARY KEY,
  headline_hi TEXT NOT NULL CHECK (length(headline_hi) BETWEEN 1 AND 160),
  summary_hi TEXT NOT NULL CHECK (length(summary_hi) BETWEEN 1 AND 1000),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_publication_date TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('survey','circular','policy','service','incident','other')),
  district TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  source_verified INTEGER NOT NULL DEFAULT 0 CHECK (source_verified IN (0,1)),
  rights_checked INTEGER NOT NULL DEFAULT 0 CHECK (rights_checked IN (0,1)),
  retracted INTEGER NOT NULL DEFAULT 0 CHECK (retracted IN (0,1)),
  image_key TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_events (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES editorial_items(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('create','edit','approve','reject','retract','correct')),
  reviewer_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rights_evidence (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES editorial_items(id) ON DELETE RESTRICT,
  permission_reference TEXT NOT NULL,
  permission_scope TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_editorial_status_date
  ON editorial_items(status, source_publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_review_item_time
  ON review_events(item_id, occurred_at DESC);
