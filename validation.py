"""
validation.py -- Smoke-test / validation script for HissTastic.

Checks:
  1. hisstastic.py compiles (py_compile).
  2. Required imports resolve (os, sys, random, time, pygame).
  3. assets/ directory contains all expected files.
  4. requirements.txt exists and declares pygame.
  5. Replay schema and ghost replay sanity utilities pass.
  6. Browser/PWA static files and manifest are coherent.

Does NOT import or run the game (no pygame display initialisation).
Exit code 0 = all pass; 1 = any fail.
"""
import py_compile
import sys
import os
import importlib.util
import json
import tempfile
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
REQUIREMENTS_PATH = os.path.join(PROJECT_ROOT, "requirements.txt")
MAIN_MODULE = os.path.join(PROJECT_ROOT, "hisstastic.py")
WEB_DIR = os.path.join(PROJECT_ROOT, "web")
MANIFEST_PATH = os.path.join(WEB_DIR, "manifest.webmanifest")
SERVICE_WORKER_PATH = os.path.join(WEB_DIR, "sw.js")

REQUIRED_IMPORTS = ["os", "sys", "random", "time", "pygame"]
REQUIRED_ASSETS = ["snake.png", "rodent.png", "danger.png", "power_up.png", "icon.png"]
REQUIRED_WEB_FILES = [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "js/app.js",
    "js/game.js",
    "js/identity.js",
    "js/replay.js",
    "js/supabase.js",
]

def ok(msg):
    print(f"  [PASS] {msg}")

def fail(msg):
    print(f"  [FAIL] {msg}")

def header(label):
    print(f"\n--- {label} ---")

def check_compile():
    header("1. Compilation")
    if not os.path.isfile(MAIN_MODULE):
        fail(f"File not found: {MAIN_MODULE}")
        return False
    try:
        py_compile.compile(MAIN_MODULE, doraise=True)
        ok("hisstastic.py compiles without errors")
        return True
    except py_compile.PyCompileError as exc:
        fail(f"Compile error: {exc}")
        return False

def check_imports():
    header("2. Imports")
    all_good = True
    for mod_name in REQUIRED_IMPORTS:
        try:
            importlib.import_module(mod_name)
            ok(f"'{mod_name}' resolves")
        except ImportError as exc:
            fail(f"'{mod_name}' cannot be imported: {exc}")
            all_good = False
    return all_good

def check_assets():
    header("3. Assets")
    if not os.path.isdir(ASSETS_DIR):
        fail(f"assets/ directory missing at {ASSETS_DIR}")
        return False
    all_good = True
    for fname in REQUIRED_ASSETS:
        fpath = os.path.join(ASSETS_DIR, fname)
        if os.path.isfile(fpath):
            ok(f"assets/{fname} present")
        else:
            fail(f"assets/{fname} MISSING")
            all_good = False
    return all_good

def check_requirements():
    header("4. requirements.txt")
    if not os.path.isfile(REQUIREMENTS_PATH):
        fail("requirements.txt not found")
        return False
    ok("requirements.txt exists")
    try:
        with open(REQUIREMENTS_PATH, encoding="utf-8") as fh:
            content = fh.read()
    except OSError as exc:
        fail(f"Cannot read requirements.txt: {exc}")
        return False
    lines = [line.strip() for line in content.splitlines()
             if line.strip() and not line.strip().startswith("#")]
    has_pygame = any(line.lower().startswith("pygame") for line in lines)
    if has_pygame:
        ok("requirements.txt declares pygame")
        return True
    else:
        fail("requirements.txt does NOT contain pygame")
        return False

def check_replay_schema():
    header("5. Replay schema")
    try:
        from hisstastic.ghost import GhostReplay
        from hisstastic.replay import validate_replay_data, verify_replay
    except ImportError as exc:
        fail(f"Replay modules cannot be imported: {exc}")
        return False

    replay = {
        "version": "1.0.0",
        "game": "hisstastic",
        "metadata": {
            "deterministic": True,
            "local_only": True,
            "networked": False,
            "mode": "solo",
            "duration_ticks": 1,
        },
        "seed": 123,
        "timestamp": "2026-06-04T00:00:00Z",
        "score": 0,
        "snake_length": 1,
        "inputs": [{"tick": 0, "direction": "RIGHT"}],
        "frames": [{
            "tick": 0,
            "head": [300, 200],
            "body": [[300, 200]],
            "score": 0,
            "snake_length": 1,
            "alive": True,
        }],
    }

    try:
        validate_replay_data(replay)
    except Exception as exc:
        fail(f"Replay schema validation failed: {exc}")
        return False

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as fh:
        json.dump(replay, fh)
        replay_path = fh.name

    try:
        result = verify_replay(replay_path)
        ghost_result = GhostReplay(replay_path).sanity_check()
    finally:
        try:
            os.remove(replay_path)
        except OSError:
            pass

    if not result.get("match"):
        fail(f"Replay verify failed: {result.get('error')}")
        return False
    if not ghost_result.get("valid"):
        fail("Ghost replay sanity check failed")
        return False

    ok("Replay schema validation passes")
    ok("Ghost replay sanity validation passes")
    return True

def check_browser_pwa():
    header("6. Browser/PWA")
    if not os.path.isdir(WEB_DIR):
        fail("web/ directory missing")
        return False

    all_good = True
    for relative_path in REQUIRED_WEB_FILES:
        path = os.path.join(WEB_DIR, *relative_path.split("/"))
        if os.path.isfile(path):
            ok(f"web/{relative_path} present")
        else:
            fail(f"web/{relative_path} missing")
            all_good = False

    try:
        with open(MANIFEST_PATH, encoding="utf-8") as fh:
            manifest = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"manifest.webmanifest invalid: {exc}")
        return False

    if manifest.get("start_url") == "./" and manifest.get("scope") == "./":
        ok("manifest uses web-root relative start_url and scope")
    else:
        fail("manifest start_url/scope should be './' for web/ document-root serving")
        all_good = False

    icons = manifest.get("icons", [])
    for icon in icons:
        src = icon.get("src")
        if not src:
            fail("manifest icon missing src")
            all_good = False
            continue
        icon_path = os.path.join(WEB_DIR, *src.split("/"))
        if os.path.isfile(icon_path):
            ok(f"manifest icon present: {src}")
        else:
            fail(f"manifest icon missing: {src}")
            all_good = False

    try:
        with open(SERVICE_WORKER_PATH, encoding="utf-8") as fh:
            sw_content = fh.read()
    except OSError as exc:
        fail(f"Cannot read service worker: {exc}")
        return False

    if "/web/" in sw_content:
        fail("service worker should not cache /web/ absolute paths")
        all_good = False
    else:
        ok("service worker cache paths are relative to web/")

    if "navigator.serviceWorker.register('./sw.js')" in _read_web_app():
        ok("app registers service worker with relative path")
    else:
        fail("app.js does not register ./sw.js")
        all_good = False

    node = _find_node()
    if node:
        for relative_path in ["js/app.js", "js/game.js", "js/identity.js", "js/replay.js", "js/supabase.js", "sw.js"]:
            path = os.path.join(WEB_DIR, *relative_path.split("/"))
            result = subprocess.run(
                [node, "--check", path],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                ok(f"JavaScript syntax valid: web/{relative_path}")
            else:
                fail(f"JavaScript syntax invalid: web/{relative_path}: {result.stderr.strip()}")
                all_good = False
    else:
        ok("node not found; skipped JavaScript syntax checks")

    return all_good

def _read_web_app():
    app_path = os.path.join(WEB_DIR, "js", "app.js")
    try:
        with open(app_path, encoding="utf-8") as fh:
            return fh.read()
    except OSError:
        return ""

def _find_node():
    for command in ("node", "node.exe"):
        try:
            result = subprocess.run(
                [command, "--version"],
                capture_output=True,
                text=True,
            )
        except OSError:
            continue
        if result.returncode == 0:
            return command
    return None

def main():
    print("HissTastic Validation Suite")
    print("=" * 40)
    results = [
        check_compile(),
        check_imports(),
        check_assets(),
        check_requirements(),
        check_replay_schema(),
        check_browser_pwa(),
    ]
    passed = sum(results)
    total = len(results)
    print(f"\n{'=' * 40}")
    print(f"Result: {passed}/{total} checks passed")
    if all(results):
        print("  [PASS] All checks passed -- the project is ready.")
        return 0
    else:
        print("  [FAIL] Some checks failed. Review the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
