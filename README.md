# cwi-release-timeline — Release Timeline Automator

$0 countdown generator for music releases. Given a release date, outputs the dated task list + content specs for the full release cycle (T-6wk distributor freeze → T-4wk editorial pitch → T-2wk tease → T-1wk push → release-day assets → 4-week post-release micro-asset waterfall), wired to peak-hour scheduler window definitions from 2026 platform research.

**Live app:** https://cumulativewebinc.github.io/cwi-release-timeline/

Zero dependencies. Static HTML + JS; deterministic engine (same date → same timeline). Export as copy-paste text or downloadable `.ics`.

## Structure
- `docs/` — the deployed app (GitHub Pages serves `/docs`): `index.html`, `app.js`, `timeline.js` (shared engine), `README.md`
- `tests/` — stdlib node test suite: `node --test tests/run-tests.js` (11 tests green)
