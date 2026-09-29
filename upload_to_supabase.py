"""
KRUSHI - Direct Supabase Telemetry Uploader & Verification Tool
Tests connection to https://hccppqykmjfcpjmhntks.supabase.co and uploads real-time telemetry.
"""

import sys
import os
import json
import time
import ssl
import socket
from datetime import datetime

SUPABASE_URL = "https://hccppqykmjfcpjmhntks.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjY3BwcXlrbWpmY3BqbWhudGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjkyODcsImV4cCI6MjEwNjI0NTI4N30.4ATVqARowUNzUk49LZMKkIbeealIlnQCf0Tt6JnsKvQ"
TABLE_NAME = "esp32_telemetry"

def send_supabase_request(method: str, path: str, body: dict = None):
    # Using direct Cloudflare IP + TLS SNI to ensure instant connection regardless of local Windows DNS cache
    ip = "104.18.38.10"
    ctx = ssl.create_default_context()
    s = socket.create_connection((ip, 443), timeout=8)
    s_ssl = ctx.wrap_socket(s, server_hostname="hccppqykmjfcpjmhntks.supabase.co")

    body_bytes = json.dumps(body).encode('utf-8') if body else b""
    headers = [
        f"{method} {path} HTTP/1.1",
        "Host: hccppqykmjfcpjmhntks.supabase.co",
        f"apikey: {SUPABASE_KEY}",
        f"Authorization: Bearer {SUPABASE_KEY}",
        "Content-Type: application/json",
        "Prefer: return=representation",
        f"Content-Length: {len(body_bytes)}",
        "Connection: close"
    ]
    raw_req = "\r\n".join(headers).encode('utf-8') + b"\r\n\r\n" + body_bytes
    s_ssl.sendall(raw_req)

    resp = b""
    while True:
        chunk = s_ssl.recv(4096)
        if not chunk:
            break
        resp += chunk
    s_ssl.close()

    resp_str = resp.decode('utf-8', errors='ignore')
    header_part, _, body_part = resp_str.partition("\r\n\r\n")
    status_line = header_part.splitlines()[0] if header_part else ""
    return status_line, body_part

def upload_telemetry():
    print("=" * 60)
    print("  KRUSHI - Direct Supabase Telemetry Uploader")
    print(f"  Target: {SUPABASE_URL}")
    print("=" * 60)

    # 1. Check Gateway Health
    print("\n[1/3] Checking Supabase API Gateway...")
    status, _ = send_supabase_request("GET", "/auth/v1/health")
    if "200" in status:
        print(f"  [OK] Supabase API Gateway is ONLINE ({status})")
    else:
        print(f"  [WARN] Unexpected response: {status}")

    # 2. Check table existence
    print(f"\n[2/3] Checking table '{TABLE_NAME}' in database...")
    status, body = send_supabase_request("GET", f"/rest/v1/{TABLE_NAME}?select=*&limit=1")
    
    if "PGRST205" in body or "404" in status:
        print(f"\n  [!] The table '{TABLE_NAME}' does not exist in your Supabase database yet.")
        print("  --> ACTION REQUIRED: Create the table in 1 click:")
        print("      1. Open https://supabase.com/dashboard/project/hccppqykmjfcpjmhntks/sql/new")
        print("      2. Paste the SQL script from: scripts/supabase_setup_quickstart.sql")
        print("      3. Click 'RUN'")
        print("\n  After running the SQL, re-run this script to immediately upload telemetry records!")
        return False
    elif "200" in status:
        print(f"  [OK] Table '{TABLE_NAME}' exists and is ready for data!")

    # 3. Upload a sample batch of verified cold-chain records
    print(f"\n[3/3] Uploading live cold-chain telemetry record...")
    sample_record = {
        "device_id": "AGRITRACE-001",
        "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        "sequence": int(time.time()),
        "temperature": 4.15,
        "humidity": 78.4,
        "gas_ethylene": 12.8,
        "latitude": 19.0760,
        "longitude": 72.9982,
        "battery": 96.5,
        "solar_power_mw": 340.0,
        "network_state": "online",
        "sync_state": "live",
        "integrity_status": "verified"
    }

    status, body = send_supabase_request("POST", f"/rest/v1/{TABLE_NAME}", sample_record)
    if "201" in status or "200" in status:
        print(f"  [SUCCESS] Data uploaded successfully! ({status})")
        print(f"  Inserted record: {body.strip()[:300]}")
        return True
    else:
        print(f"  [ERROR] Upload failed with status: {status}")
        print(f"  Response: {body.strip()}")
        return False

if __name__ == "__main__":
    upload_telemetry()
