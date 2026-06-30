# Development

## Prerequisites

- **Python 3.9+** ([python.org](https://python.org))
- **Git** ([git-scm.com](https://git-scm.com))
- **A modern browser** (Chrome, Firefox, Edge, Safari)
- **pygame** (for the Python runtime only)

## Quick Start

```bash
git clone https://github.com/sparshsam/hisstastic.git
cd hisstastic

# Start the dev server (no build step required)
bash scripts/serve.sh
# Opens at http://localhost:8080
```

## Python Runtime Setup

The Python/Pygame version is the canonical runtime.

```bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
pip install pygame
python main.py
```

**Legacy entry point:** `python hisstastic.py`

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'pygame'` | Run `pip install pygame` |
| `pygame.error: video system not initialized` | Ensure you have a display (no `DISPLAY` in SSH) |
| `pygame.error: No available video device` | Install X server or use headless mode |

On WSL or headless servers, use the browser runtime instead.

## Browser Runtime Setup

Zero-config static site. No build step, no framework, no Node.js required.

### Option A: Quick Dev Server (Recommended)

```bash
bash scripts/serve.sh
# Opens at http://localhost:8080
```

### Option B: Python HTTP Server

```bash
python -m http.server 8080 --directory web/
# Opens at http://localhost:8080
```

### Option C: Any Static Server

```bash
npx serve web/ -p 8080            # Node
php -S localhost:8080 -t web/     # PHP
```

## Testing

```bash
# Validation suite
python validation.py

# Unit tests
python -m unittest discover -v

# Local health check
bash scripts/check-local.sh
```

## Common Issues

- **Stale service worker:** Unregister in DevTools → Application → Service Workers, then hard-reload.
- **Background music doesn't play:** Click anywhere on the page first (browser autoplay policy).
- **Python black screen on WSL:** Use the browser runtime.
- **Assets not loading:** Serve via HTTP, not `file://`.
