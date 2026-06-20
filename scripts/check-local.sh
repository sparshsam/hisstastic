#!/usr/bin/env bash
# HissTastic — Local Health Check
# =================================
# Verifies all local dev requirements are met.
# Run this from the repo root before committing.
#
# Usage: ./scripts/check-local.sh

set -euo pipefail

PASS=0
FAIL=0
PYTHON_BIN="${PYTHON:-python3}"

if [ -z "${PYTHON:-}" ] && [ -x ".venv/bin/python" ]; then
  PYTHON_BIN=".venv/bin/python"
fi

pass() { PASS=$((PASS+1)); echo "  [PASS] $1"; }
fail() { FAIL=$((FAIL+1)); echo "  [FAIL] $1"; }

echo "HissTastic Local Health Check"
echo "=============================="
echo ""

# --- Python runtime ---
echo "[Python Runtime]"
if command -v "$PYTHON_BIN" &>/dev/null || [ -x "$PYTHON_BIN" ]; then
  pass "python found: $($PYTHON_BIN --version 2>&1)"
else
  fail "python not found ($PYTHON_BIN)"
fi

if "$PYTHON_BIN" -c "import pygame" >/dev/null 2>&1; then
  pass "pygame module available"
else
  fail "pygame not installed (run: pip install pygame)"
fi

if [ -f main.py ]; then
  pass "main.py present"
else
  fail "main.py missing"
fi

if [ -f hisstastic.py ]; then
  pass "hisstastic.py (legacy) present"
else
  fail "hisstastic.py missing"
fi

# --- Browser runtime ---
echo ""
echo "[Browser Runtime]"
if [ -f web/index.html ]; then pass "web/index.html present"; else fail "web/index.html missing"; fi
if [ -f web/manifest.webmanifest ]; then pass "web/manifest.webmanifest present"; else fail "web/manifest.webmanifest missing"; fi
if [ -f web/sw.js ]; then pass "web/sw.js present"; else fail "web/sw.js missing"; fi
if [ -f web/js/app.js ]; then pass "web/js/app.js present"; else fail "web/js/app.js missing"; fi
if [ -f web/js/game.js ]; then pass "web/js/game.js present"; else fail "web/js/game.js missing"; fi
if [ -f web/js/identity.js ]; then pass "web/js/identity.js present"; else fail "web/js/identity.js missing"; fi
if [ -f web/js/audio.js ]; then pass "web/js/audio.js present"; else fail "web/js/audio.js missing"; fi
if [ -f web/js/supabase.js ]; then pass "web/js/supabase.js present"; else fail "web/js/supabase.js missing"; fi
if [ -f web/css/style.css ]; then pass "web/css/style.css present"; else fail "web/css/style.css missing"; fi
if [ -f web/assets/background-music.mp3 ]; then pass "web/assets/background-music.mp3 present"; else fail "web/assets/background-music.mp3 missing"; fi
if [ -d web/icons ]; then pass "web/icons/ directory present"; else fail "web/icons/ missing"; fi

# --- Assets ---
echo ""
echo "[Game Assets]"
for asset in snake.png rodent.png danger.png power_up.png icon.png; do
  if [ -f "assets/$asset" ]; then pass "assets/$asset present"; else fail "assets/$asset missing"; fi
done

# --- Documentation ---
echo ""
echo "[Documentation]"
for doc in README.md CHANGELOG.md ARCHITECTURE.md LICENSE; do
  if [ -f "$doc" ]; then pass "$doc present"; else fail "$doc missing"; fi
done

# --- Validation ---
echo ""
echo "[Validation]"
if "$PYTHON_BIN" -c "import py_compile; py_compile.compile('validation.py', doraise=True)" 2>/dev/null; then
  pass "validation.py compiles"
else
  fail "validation.py compile error"
fi

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
echo "=============================="

# Exit with error code if any failures
[ "$FAIL" -eq 0 ]
