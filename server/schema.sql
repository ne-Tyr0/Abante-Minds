-- Abante Minds weekly totals (Cloudflare D1). Only running totals: there is
-- no table of reports, phones or learners, so nothing here belongs to anyone.

CREATE TABLE IF NOT EXISTS totals (
  week    TEXT    NOT NULL,             -- ISO week, e.g. 2026-W44
  app     TEXT    NOT NULL,             -- the app's build number
  scope   TEXT    NOT NULL,             -- level, facts, review, exam, exam-topic, feature, error
  item    TEXT    NOT NULL,             -- e.g. decimals/add-and-subtract, 3, badge-card
  measure TEXT    NOT NULL,             -- e.g. answered, right, reports
  value   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (week, app, scope, item, measure)
) WITHOUT ROWID;

-- How many reports each week brought: for hiding small groups.
CREATE TABLE IF NOT EXISTS reports (
  week TEXT    NOT NULL,
  app  TEXT    NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (week, app)
) WITHOUT ROWID;
