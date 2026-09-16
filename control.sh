#!/bin/bash
echo "=================================================="
echo "       ALCHARMY 10-POINT DIAGNOSTIC CONTROL       "
echo "=================================================="

# 1. Node.js check
echo -n "[1] Node.js Environment: "
if command -v node &> /dev/null; then
    echo "Present ✅ ($(node -v))"
else
    echo "Missing ❌"
fi

# 2. PM2 check
echo -n "[2] PM2 Process Manager: "
if command -v pm2 &> /dev/null; then
    echo "Present ✅"
else
    echo "Missing ❌"
fi

# 3. PM2 Daemons check
echo -n "[3] PM2 Daemons Status: "
if pm2 list 2>/dev/null | grep -q "online"; then
    echo "Running ✅"
else
    echo "Inactive ❌"
fi

# 4. API Server File check
echo -n "[4] API Server Script (server-live.js): "
if [ -f server-live.js ]; then
    echo "Present ✅"
else
    echo "Missing ❌"
fi

# 5. Environment File check
echo -n "[5] Environment Configuration (.env): "
if [ -f .env ]; then
    echo "Present ✅"
else
    echo "Missing ❌"
fi

# 6. Package Configuration check
echo -n "[6] Package Configuration (package.json): "
if [ -f package.json ]; then
    echo "Present ✅"
else
    echo "Missing ❌"
fi

# 7. Cloudflare Tunnel check
echo -n "[7] Cloudflare Quick Tunnel: "
if pm2 list 2>/dev/null | grep -q "alcharmy-tunnel"; then
    echo "Active ✅"
else
    echo "Inactive ❌"
fi

# 8. Supabase Connection check
echo -n "[8] Supabase Client Config: "
if grep -q "SUPABASE_URL" .env 2>/dev/null; then
    echo "Configured ✅"
else
    echo "Missing Config ❌"
fi

# 9. Network Connectivity check
echo -n "[9] Network Connectivity: "
if curl -s --head https://github.com &>/dev/null; then
    echo "Internet: Connected ✅"
else
    echo "Offline ❌"
fi

# 10. Koyeb & Dockerfile Config Check
echo -n "[10] Koyeb & Dockerfile Config Check: "
if [ -f koyeb.yaml ] && [ -f Dockerfile ]; then
    echo "koyeb.yaml & Dockerfile: Present ✅"
else
    echo "Missing Configuration Files ❌"
fi

echo "=================================================="
echo "💡 Tip: Run './control.sh' anytime for a full system audit!"
echo "=================================================="
