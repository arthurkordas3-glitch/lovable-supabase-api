#!/bin/bash
echo "🚀 Initiating Alcharmy Full Production Deployment..."

cd ~/lovable-supabase-api

# 1. Ensure logs directory exists
mkdir -p logs

# 2. Check for .env file
if [ ! -f .env ]; then
  echo "❌ Error: .env file missing! Production aborted."
  exit 1
fi

# 3. Check if PM2 is installed globally, install if missing
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2 process manager..."
  npm install -g pm2
fi

# 4. Stop existing PM2 instances if any
pm2 delete alcharmy-api 2>/dev/null || true

# 5. Start app via PM2 CommonJS ecosystem config
echo "⚙️ Starting Alcharmy API cluster in production mode..."
pm2 start ecosystem.config.cjs

# 6. Save PM2 state for system reboots
pm2 save

echo "=================================================="
echo "🎉 ALCHARMY PRODUCTION DEPLOYMENT COMPLETE!"
echo "=================================================="
echo "📊 Run 'pm2 status' to monitor processes."
echo "📜 Run 'pm2 logs alcharmy-api' to view live traffic."
echo "=================================================="
