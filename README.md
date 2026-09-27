# Agent Ops

Created by **Taranjeet Singh using Codex**. For educational, non-commercial use only. See [NOTICE.md](NOTICE.md) for use restrictions, disclaimers, and privacy information. This repository is not offered under an open-source license.

A dependency-free, six-minute learning game for program managers. All agents and incidents are deterministic simulations. No accounts, AI API calls, user data collection, or persistent storage.

## Local development

With Node.js 20 or later: `npm start`, then open http://127.0.0.1:4173. Run `npm test` for game engine checks. Serve `dist/` on any static host for production; no build is required. `_headers` applies security headers on compatible hosts.

## GitHub Pages

Publish this project directory as the root of a public GitHub repository. In repository Settings → Pages, select **GitHub Actions** as the source, then push to `main` or run **Deploy Agent Ops to GitHub Pages** manually. The workflow validates the game and uploads only `dist/`; tests, configuration, and repository metadata are not part of the website artifact. Relative asset links support a repository subpath. Hosting providers may process visitor connection logs.

GitHub Pages does not apply Cloudflare-style `_headers` files. The HTML includes a compatible content-security policy and referrer policy; response-header-only protections still depend on the host.

## Structure

- `dist/questions.js`: 50 authored scenarios with stable IDs, feedback, and role metadata.
- `dist/engine.js`: uniform sampling without replacement, scoring, team tradeoffs, and deadline-based state transitions.
- `dist/coaching.js`: evidence-based focus areas, strengths, and next steps. Only answered questions contribute; scores below 15/20 flag practice areas, ranked by area average, with at most three areas shown. Unanswered questions are not assessed. Complete runs without flagged areas receive advanced practice.
- `dist/app.js`: accessible DOM rendering, event handling, countdown, and optional WebMCP.
- `dist/styles.css`: responsive layout and reduced-motion support.
- `tests/engine.test.js`: timer boundaries, scoring, duplicate submission, and budget tradeoffs.

Add or edit scenarios in `questionBank` in `dist/questions.js`. Each mission samples ten unique questions once; choosing teammates and rendering never reshuffles them. Replay samples again from all 50, so overlap across missions is possible. Team effects follow question metadata, not position. `MISSION_LENGTH` controls the number of questions; scores normalize the raw 20-point rubric to a 100-point mission total. Ten questions each contribute up to 10 points. Starting credits are 150 to accommodate the longer mission. Scores are pedagogical, not validated competency measurements. Budget can go negative and is reported independently of judgment. The wall-clock deadline continues while the tab is hidden. Refresh starts a new attempt. Static distribution scales without application servers; actual throughput depends on the host. Browser scores are not suitable for a trusted competitive leaderboard.
