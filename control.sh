#!/bin/bash
clear
echo "=================================================="
echo "⚡ ALCHARMY ULTIMATE TERMUX CONTROL CENTRE ⚡"
echo "=================================================="
echo ""
echo "📊 [1] PM2 Process Status:"
pm2 status
echo ""
echo "🌐 [2] Cloudflare Tunnel Live URL:"
pm2 logs alcharmy-tunnel --lines 50 --nostream | grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | tail -n 1 || echo "Tunnel URL loading..."
echo ""
echo "🩺 [3] Local API Health Check:"
curl -s http://localhost:3001/health || echo "Local API is offline"
echo ""
echo "📂 [4] Git Status & Last Commit:"
git status -s
echo -n "Last Commit: "
git log -1 --format="%h - %an: %s (%ar)" 2>/dev/null || echo "No git log found"
echo ""
echo "💻 [5] System & Resource Usage:"
echo "Disk Space:"
df -h . | tail -n 1
echo "System Uptime & Load:"
uptime 2>/dev/null || echo "Uptime unavailable"
echo ""
echo "⚙️ [6] Runtime & Tooling Versions:"
echo "Node: $(node -v 2>/dev/null || echo 'Not found') | NPM: $(npm -v 2>/dev/null || echo 'Not found') | PM2: $(pm2 -v 2>/dev/null || echo 'Not found')"
echo ""
echo "🔑 [7] Environment & Supabase Config:"
if [ -f .env ]; then
    echo ".env file: Present ✅"
    grep -q "SUPABASE_URL" .env && echo "SUPABASE_URL: Configured ✅" || echo "SUPABASE_URL: Missing ❌"
else
    echo ".env file: Missing ❌"
fi
echo ""
echo "📜 [8] Recent API Logs (Last 5 lines):"
pm2 logs alcharmy-api --lines 5 --nostream 2>/dev/null || echo "No logs available"
echo ""
echo "🌐 [9] Network Connectivity:"
ping -c 1 8.8.8.8 >/dev/null 2>&1 && echo "Internet: Connected ✅" || echo "Internet: Offline ❌"
echo ""
echo "☁️ [10] Fly.io Cloud Config Check:"
if [ -f fly.toml ]; then
    echo "fly.toml: Present ✅ (App: $(grep 'app =' fly.toml | cut -d'"' -f2))"
else
    echo "fly.toml: Missing ❌"
fi
echo "=================================================="
echo "💡 Tip: Run './control.sh' anytime for a full system audit!"
echo "=================================================="
