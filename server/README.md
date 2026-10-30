# Weekly totals server

The server for Abante Minds' opt-in weekly totals: a Cloudflare Worker and a D1 database.
**It is not deployed.** The app's `ENDPOINT` in `app/tally.js` is `null`, so nothing is sent
until the owner approves and the steps below are done.

The design is in `LEGAL-RESEARCH.md`, "Update, 26 October 2026": counts only, with no ID and
nothing kept per phone, which likely puts the data outside the Data Privacy Act.

| File | What |
|---|---|
| `worker.js` | Checks a report against one strict shape, adds its numbers to running totals, keeps nothing else |
| `schema.sql` | Two tables: `totals` (week, app build, scope, item, measure, value) and `reports` (how many per week) |
| `views.sql` | Hardest levels, where learners quit, whether review works, feature use; items under 5 reports are hidden |
| `wrangler.example.toml` | Cloudflare settings, with logs off |

## What a report looks like

One per finished week, from a phone with sharing on:

```json
{ "v": 1, "week": "2026-W44", "app": "56",
  "levels": { "decimals/add-and-subtract": { "answered": 10, "right": 7, "hints": 2, "finished": 1 } },
  "review": { "3": { "right": 2, "wrong": 1 } },
  "facts": { "times/2-5-10": { "answered": 20, "right": 18, "quick": 12 } },
  "exams": { "taken": 1, "topics": { "decimals": { "right": 2, "asked": 3 } } },
  "features": { "badge-card": 3, "theme-dark": 1 },
  "errors": {} }
```

The Worker refuses anything else: an unknown field, a week that is not one of the last eight
finished weeks, a number that is not a whole count from 0 to 5,000, more than 120 items.

## Setting it up, once approved

1. Create a free Cloudflare account and install Wrangler: `npm install -g wrangler`, then
   `wrangler login`.
2. In this folder, create the database in Asia-Pacific (a hint, not a guarantee):
   `wrangler d1 create abante-minds-totals --location apac`. Copy `wrangler.example.toml` to
   `wrangler.toml` and paste in the `database_id` it prints. Do not turn on read replication.
3. Create the tables and views:
   `wrangler d1 execute abante-minds-totals --remote --file schema.sql`, then the same with
   `views.sql`.
4. Deploy: `wrangler deploy`. Note the address it prints, e.g.
   `https://abante-minds-totals.<account>.workers.dev`.
5. In the Cloudflare dashboard, add a rate-limiting rule for `/v1/tally` (for example 10 requests
   a minute). The Worker itself never reads the caller's address.
6. Check that Workers Logs are off for this Worker, as `wrangler.toml` sets.
7. In `app/tally.js`, set `ENDPOINT` to the address plus `/v1/tally`, and allow that one address
   in `tests/invariants.js` (which otherwise refuses any outside URL). Bump the cache and ship.

## Reading the results

```bash
wrangler d1 execute abante-minds-totals --remote --command "SELECT * FROM level_results ORDER BY share_right LIMIT 20"
wrangler d1 execute abante-minds-totals --remote --command "SELECT * FROM drop_off ORDER BY share_left DESC LIMIT 20"
wrangler d1 execute abante-minds-totals --remote --command "SELECT * FROM review_results"
wrangler d1 execute abante-minds-totals --remote --command "SELECT * FROM feature_use"
```

The totals hold nothing about any one learner, so there is nothing to delete on request; the
privacy page in the app says so. Keep them while they are useful and review that once a year.
