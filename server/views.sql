-- Abante Minds: the four questions the totals answer. Every view hides an
-- item that fewer than five reports mentioned (its "reports" measure), so no
-- figure rests on one or two phones.
--   wrangler d1 execute abante-minds-totals --remote --command "SELECT * FROM level_results ORDER BY share_right"

DROP VIEW IF EXISTS level_results;
DROP VIEW IF EXISTS drop_off;
DROP VIEW IF EXISTS review_results;
DROP VIEW IF EXISTS feature_use;

-- Which levels learners find hardest: share right first time, per week.
CREATE VIEW level_results AS
SELECT week, item AS level,
       SUM(CASE WHEN measure = 'reports'  THEN value END) AS reports,
       SUM(CASE WHEN measure = 'answered' THEN value END) AS answered,
       SUM(CASE WHEN measure = 'right'    THEN value END) AS right_first_time,
       SUM(CASE WHEN measure = 'hints'    THEN value END) AS hints,
       ROUND(1.0 * SUM(CASE WHEN measure = 'right' THEN value END) / NULLIF(SUM(CASE WHEN measure = 'answered' THEN value END), 0), 3) AS share_right
FROM totals WHERE scope = 'level'
GROUP BY week, item
HAVING SUM(CASE WHEN measure = 'reports' THEN value END) >= 5;

-- Where learners quit: rounds left early against rounds finished.
CREATE VIEW drop_off AS
SELECT week, item AS level,
       SUM(CASE WHEN measure = 'finished' THEN value END) AS finished,
       SUM(CASE WHEN measure = 'left'     THEN value END) AS left_early,
       ROUND(1.0 * SUM(CASE WHEN measure = 'left' THEN value END) /
             NULLIF(SUM(CASE WHEN measure IN ('finished', 'left') THEN value END), 0), 3) AS share_left
FROM totals WHERE scope = 'level'
GROUP BY week, item
HAVING SUM(CASE WHEN measure = 'reports' THEN value END) >= 5;

-- Whether spaced review works: right share by how long a question waited.
CREATE VIEW review_results AS
SELECT week, item AS waited_days,
       SUM(CASE WHEN measure = 'right' THEN value END) AS right,
       SUM(CASE WHEN measure = 'wrong' THEN value END) AS wrong,
       ROUND(1.0 * SUM(CASE WHEN measure = 'right' THEN value END) /
             NULLIF(SUM(CASE WHEN measure IN ('right', 'wrong') THEN value END), 0), 3) AS share_right
FROM totals WHERE scope = 'review'
GROUP BY week, item
HAVING SUM(CASE WHEN measure = 'reports' THEN value END) >= 5;

-- Which features are used, against the week's reports.
CREATE VIEW feature_use AS
SELECT t.week, t.item AS feature, SUM(t.value) AS count, r.n AS reports
FROM totals t JOIN (SELECT week, SUM(n) AS n FROM reports GROUP BY week) r ON r.week = t.week
WHERE t.scope = 'feature'
GROUP BY t.week, t.item
HAVING r.n >= 5;
