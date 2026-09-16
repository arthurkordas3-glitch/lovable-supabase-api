#!/bin/bash
clear
echo "=================================================="
echo "⚡ ALCHARMY TERMUX CONTROL CENTRE ⚡"
echo "=================================================="
echo ""
echo "📊 [1] PM2 Process Status:"
pm2 status
echo ""
echo "🌐 [2] Cloudflare Tunnel Live URL:"
pm2 logs alcharmy-tunnel --lines 50 --nostream | grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | tail -n 1 || echo "Tunnel URL loading... (run 'pm2 logs alcharmy-tunnel' to check)"
echo ""
echo "🩺 [3] Local API Health Check:"
curl -s http://localhost:3001/health || echo "Local API is offline"
echo ""
echo "📂 [4] Git Status:"
git status -s
echo "=================================================="
echo "💡 Tip: Run './control.sh' anytime to check your stack!"
echo "=================================================="
