module.exports = {
  apps: [
    {
      name: 'alcharmy-api',
      script: 'server-live.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'alcharmy-tunnel',
      script: 'cloudflared',
      args: 'tunnel --url http://localhost:3001',
      autorestart: true,
      watch: false,
      error_file: './logs/tunnel-err.log',
      out_file: './logs/tunnel-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
