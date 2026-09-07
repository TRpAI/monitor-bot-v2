// ==============================================================================
// PM2 Ecosystem Configuration for Bare-metal / VPS deployment (原始部署)
// ==============================================================================
module.exports = {
  apps: [
    {
      name: 'monitor-bot-web',
      script: './dist/server.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // TELEGRAM_BOT_TOKEN: 'your_token',
        // TELEGRAM_CHAT_ID: 'your_chat_id',
      }
    }
  ]
};
