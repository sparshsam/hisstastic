# Claude Notes

HissTastic is a browser-first arcade game (v0.9.0) with a preserved Python/Pygame reference implementation.
The web runtime (`web/`) is the primary build target, with Capacitor Android packaging.

**Production:** https://hisstastic.vercel.app
**Android APK:** Build from source or download releases.

Before changing this repository, review:

- `AGENTS.md`
- `README.md`
- `ARCHITECTURE.md`

Repository work should remain aligned with:

- https://github.com/sparshsam/sparshsam
- https://github.com/sparshsam/ecosystem-standards

## Deployment

| Property | Value |
|----------|-------|
| **Platform** | Vercel (static hosting) |
| **Project** | `hisstastic` (Sparsh Sam's projects team) |
| **Production URL** | https://hisstastic.vercel.app |
| **Root directory** | `web/` |
| **Config** | `web/vercel.json` — no build step, no framework, static-only |
| **Git integration** | Connected — https://github.com/sparshsam/hiss-tactic (branch: main) |
| **Team ID** | `team_yo1pKJ2giOUXt73HlPnKbkjb` |
| **Project ID** | `prj_W6TS3OxJIZzabcRcXHYG2NWrS2GU` |

### To Deploy

```bash
# Deploy browser runtime only (from web/ directory)
vercel deploy web/ --scope "sparsh-sams-projects" --public

# Promote to production
vercel deploy web/ --prod --scope "sparsh-sams-projects"

# Inspect
vercel inspect <deployment-url> --scope "sparsh-sams-projects"
```

### PWA Notes

- Service worker (`web/sw.js`) pre-caches all 15 assets (12 original + 3 new: `snakeFacts.js`, `commentary.js`, `snakeField.js`)
- Verified ACTIVE on production with correct scope
- Offline cache full (15/15 assets cached)
- Manifest loads with correct content type (`application/manifest+json`)
- Icons serve with correct MIME type (`image/png`)

## Snake Field Background

The browser runtime features a procedural snake field (`web/js/snakeField.js`) that renders up to 27 decorative snakes on a fixed background canvas. Each snake:

- Is a filled polygon silhouette built from a spine curve with natural body width profile
- Has smooth head-forward slithering via path-following + full-body sine wave
- Has a distinct head, eyes, optional tongue flick, and tapered tail
- Uses DVD-logo-style bounce at viewport edges (immediate angle reversal)
- Varies in size (5 large 14–20px, 9 medium 9–15px, 13 small 6–10px)
- Has species-appropriate colors from a 27-color palette

Key files:
- `web/js/snakeField.js` — snake rendering engine (path sampling, sine wave, polygon mesh)
- `web/js/snakeFacts.js` — 24 snake fact/roast entries for live commentary
- `web/js/commentary.js` — event-driven commentary engine

Performance: snakes pause animation when tab is hidden; count reduces on mobile (0.55× scale); respects `prefers-reduced-motion`. No external libraries, no image assets.

## Privacy Posture

The deployed version at https://hisstastic.vercel.app:

- No telemetry, analytics, or tracking scripts
- No cookies or localStorage usage
- No external API calls (only Vercel-hosted assets)
- No wallet/onchain logic
- No backend — purely static, local-first
- All 8 network requests return 200 (no broken assets)

## Rules

- Keep preservation, documentation, refactor, and feature work separate.
- Do not commit installers, generated binaries, local environment files, or secrets.
- Preserve existing gameplay unless the requested task explicitly changes it.
- Update documentation when setup, behavior, architecture, or privacy posture changes.
- Follow the roadmap order before starting advanced modernization work.
- Preserve deterministic replay behavior when changing input, spawn, state, or scoring code.
- Treat ghost racing as local-only visualization and comparison data; it must not affect active scoring.
- Treat `web/` as experimental. Python remains canonical and preserved.
- Keep PWA behavior limited to offline static asset caching unless explicitly approved.
- Do not add telemetry, accounts, external backends, wallet/onchain logic, or multiplayer networking without explicit architecture and privacy review.
- Never force-push `main` or protected/shared branches.
- Prefer normal pushes after commits. If force-push is required on an isolated feature branch, explain it in the final report.
- **Do not commit `.vercel/` directory** — it is gitignored and environment-specific (contains `project.json` with org/project IDs).
- **Root directory for auto-deployments must be `web/`** — set in Vercel Dashboard → Settings → Git if auto-deployments on push are needed.

## Required Report

At the end of every task, provide:

- Repository name
- Branch name
- Commit hash
- Files changed
- Summary of work
- Verification performed
- Push confirmation
- Standards checked
- Deferred work or risks
