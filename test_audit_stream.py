#!/usr/bin/env python3
"""DealSniper SSE Stream Test Runner (Root Launcher)"""
import os
import sys

# Change working directory to deal-sniper-backend so imports and relative paths match
backend_dir = os.path.join(os.path.dirname(__file__), "deal-sniper-backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Execute the main test runner
import subprocess

if __name__ == "__main__":
    script_path = os.path.join(backend_dir, "test_audit_stream.py")
    cmd = [sys.executable, script_path] + sys.argv[1:]
    sys.exit(subprocess.call(cmd))
