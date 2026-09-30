"""
KRUSHI Platform Single-Command Launcher
Starts both FastAPI Backend and React Frontend concurrently.
Usage:
    python start.py [--no-browser] [--install]
"""

import os
import sys
import subprocess
import time
import signal
import webbrowser
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

def print_banner():
    print("\n" + "=" * 62)
    print("  🌾 KRUSHI (कृषि) — Farm-to-Fork Cold-Chain Platform")
    print("=" * 62)
    print("  🚀 Backend API:       http://127.0.0.1:8000")
    print("  📖 Interactive Docs:  http://127.0.0.1:8000/docs")
    print("  📱 Web Dashboard:     http://localhost:5173")
    print("=" * 62)
    print("  Press Ctrl+C at any time to gracefully stop all services.\n")

def check_and_install_deps(auto_install=False):
    # Check frontend node_modules
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    if not os.path.exists(node_modules) or auto_install:
        print("[*] Installing frontend dependencies (npm install)...")
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)
        print("[✓] Frontend dependencies ready.\n")

    if auto_install:
        print("[*] Installing backend dependencies (pip install -r requirements.txt)...")
        req_file = os.path.join(BACKEND_DIR, "requirements.txt")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", req_file], check=True)
        print("[✓] Backend dependencies ready.\n")

def main():
    auto_install = "--install" in sys.argv
    no_browser = "--no-browser" in sys.argv

    # Verify python and npm availability
    npm_bin = shutil.which("npm.cmd" if sys.platform == "win32" else "npm")
    if not npm_bin:
        print("[!] Error: 'npm' was not found in PATH. Please install Node.js 18+.")
        sys.exit(1)

    check_and_install_deps(auto_install=auto_install)
    print_banner()

    # 1. Start FastAPI backend
    backend_cmd = [
        sys.executable,
        "-m", "uvicorn",
        "main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]
    print("[1/2] Starting Backend (FastAPI)...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR
    )

    # 2. Start Vite frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    print("[2/2] Starting Frontend (Vite)...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR
    )

    # Open browser automatically after a brief delay
    if not no_browser:
        def open_ui():
            time.sleep(2.5)
            try:
                webbrowser.open("http://localhost:5173")
            except Exception:
                pass
        import threading
        threading.Thread(target=open_ui, daemon=True).start()

    def shutdown(signum=None, frame=None):
        print("\n[*] Stopping KRUSHI platform services...")
        for proc, name in [(frontend_proc, "Frontend"), (backend_proc, "Backend")]:
            try:
                if sys.platform == "win32":
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
            except Exception:
                pass
        print("[✓] All services stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print(f"[!] Backend stopped unexpectedly (exit code {backend_proc.returncode})")
                shutdown()
            if frontend_proc.poll() is not None:
                print(f"[!] Frontend stopped unexpectedly (exit code {frontend_proc.returncode})")
                shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
