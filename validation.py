"""
validation.py -- Smoke-test / validation script for Hiss-Tastic.

Checks:
  1. hiss_tastic.py compiles (py_compile).
  2. Required imports resolve (os, sys, random, time, pygame).
  3. assets/ directory contains all expected files.
  4. requirements.txt exists and declares pygame.

Does NOT import or run the game (no pygame display initialisation).
Exit code 0 = all pass; 1 = any fail.
"""
import py_compile
import sys
import os
import importlib.util

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
REQUIREMENTS_PATH = os.path.join(PROJECT_ROOT, "requirements.txt")
MAIN_MODULE = os.path.join(PROJECT_ROOT, "hiss_tastic.py")

REQUIRED_IMPORTS = ["os", "sys", "random", "time", "pygame"]
REQUIRED_ASSETS = ["snake.png", "rodent.png", "danger.png", "power_up.png", "icon.png"]

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
        ok("hiss_tastic.py compiles without errors")
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

def main():
    print("Hiss-Tastic Validation Suite")
    print("=" * 40)
    results = [check_compile(), check_imports(), check_assets(), check_requirements()]
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
