# Claude Notes

Hiss-Tastic is a preserved Python/Pygame arcade prototype with an experimental browser/PWA sibling runtime.

**The browser runtime (`web/`) is deployed to Vercel at https://hiss-tastic.vercel.app.**

Before changing this repository, review:

- `AGENTS.md`
- `docs/modernization-roadmap.md`
- `README.md`
- `ARCHITECTURE.md`

Repository work should remain aligned with:

- https://github.com/sparshsam/sparshsam
- https://github.com/sparshsam/ecosystem-standards

## Deployment

| Property | Value |
|----------|-------|
| **Platform** | Vercel (static hosting) |
| **Project** | `hiss-tastic` (Sparsh Sam's projects team) |
| **Production URL** | https://hiss-tastic.vercel.app |
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

- Service worker (`web/sw.js`) pre-caches all 12 assets
- Verified ACTIVE on production with correct scope
- Offline cache full (12/12 assets cached)
- Manifest loads with correct content type (`application/manifest+json`)
- Icons serve with correct MIME type (`image/png`)

## Privacy Posture

The deployed version at https://hiss-tastic.vercel.app:

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
