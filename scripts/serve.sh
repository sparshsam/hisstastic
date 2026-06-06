#!/usr/bin/env bash
# Hiss-Tastic — Local Development Server
# ========================================
# Usage:
#   ./scripts/serve.sh          # Starts dev server on port 8080
#   ./scripts/serve.sh 3000     # Starts dev server on custom port
#
# No frameworks, no build step. Just Python's built-in HTTP server.

set -euo pipefail

PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")/../web" && pwd)"

echo "  Hiss-Tastic Local Dev Server"
echo "  ============================"
echo "  URL:      http://localhost:${PORT}"
echo "  Serving:  ${DIR}"
echo "  Quit:     Ctrl+C"
echo ""

cd "$DIR"
exec python3 -m http.server "$PORT"
