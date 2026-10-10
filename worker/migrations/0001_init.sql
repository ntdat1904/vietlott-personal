-- One row per IP (hashed). A new submission from the same IP replaces the old
-- one, so an IP holds at most one ticket in any 24-hour window.
CREATE TABLE picks (
  ip_hash    TEXT PRIMARY KEY,
  numbers    TEXT    NOT NULL, -- JSON array of 6 sorted ints, for display
  user_agent TEXT,
  created_at INTEGER NOT NULL  -- epoch ms
);
CREATE INDEX picks_created_at ON picks (created_at);

-- The same ticket split into one row per number, so the top-6 query is a plain GROUP BY.
CREATE TABLE pick_numbers (
  ip_hash    TEXT    NOT NULL,
  n          INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, n)
);
CREATE INDEX pick_numbers_created_at ON pick_numbers (created_at);
