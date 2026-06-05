# Security

## Scope

Hiss-Tastic is a local Python/Pygame game prototype. It does not currently use accounts, API keys, databases, external services, telemetry, or network requests.

## Environment Variables

No environment variables are required at this stage. If future modernization work adds configuration or credentials, `.env.example` must be updated with placeholder values only and real `.env` files must remain uncommitted.

## Reporting a Vulnerability

Please report security issues through GitHub issues or by contacting the maintainer directly. Do not post exploit details in unrelated public forums.

## Policy

- `.env`, `.env.*`, and `*.local` files are gitignored.
- Bundled Python installer binaries are excluded from version control.
- Dependencies should be reviewed before addition.
- No secrets, tokens, local credentials, or generated build artifacts should be committed.

For the ecosystem-wide security standard, see [ecosystem-standards](https://github.com/sparshsam/ecosystem-standards).
