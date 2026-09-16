#!/data/data/com.termux/files/usr/bin/bash

set -e

APP="ALCHARMY_PADDLE"
PORT="3001"
DOMAIN="alcharmy.site"
LOG="$HOME/alcharmy-cloudflared.log"

echo "========================================"
echo " ALCHARMY LIVE CLOUDFLARE WRAPPER"
echo "========================================"

echo "[1] Checking Paddle..."
if ! curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/health"; then
    echo
    echo "ERROR: Paddle is not running on ${PORT}"
    exit 1
fi

echo
echo "[2] Checking cloudflared..."
command -v cloudflared >/dev/null 2>&1 || {
    echo "ERROR: cloudflared is not installed"
    exit 1
}

cloudflared --version

echo
echo "[3] Starting Cloudflare tunnel..."
echo "Domain: ${DOMAIN}"
echo "Origin: http://127.0.0.1:${PORT}"
echo

cloudflared tunnel --url "http://127.0.0.1:${PORT}" \
    --http-host-header "$DOMAIN" \
    2>&1 | tee -a "$LOG"
