/**
 * CoinDaily Platform - PM2 Ecosystem Configuration
 * 
 * Services:
 * - Backend API (app.coindaily.online) - Port 4000
 * - News Frontend (coindaily.online) - Port 3000
 * - Admin Portal (jet.coindaily.online) - Port 3002
 * - PR System (press.coindaily.online) - Port 3003
 * - AI Dashboard (ai.coindaily.online) - Port 3004
 * - Token Landing (token.coindaily.online) - Port 3005
 */

module.exports = {
  apps: [
    // ============================================
    // BACKEND API - app.coindaily.online
    // ============================================
    {
      name: 'coindaily-backend',
      cwd: '/var/www/coindaily-app',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/log/coindaily/backend-error.log',
      out_file: '/var/log/coindaily/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // NEWS FRONTEND - coindaily.online
    // ============================================
    {
      name: 'coindaily-news',
      cwd: '/var/www/coindaily',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.coindaily.online/graphql',
        NEXT_PUBLIC_AI_URL: 'https://ai.coindaily.online'
      },
      error_file: '/var/log/coindaily/news-error.log',
      out_file: '/var/log/coindaily/news-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // ADMIN PORTAL - jet.coindaily.online
    // ============================================
    {
      name: 'coindaily-admin',
      cwd: '/var/www/coindaily-admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.coindaily.online/graphql',
        NEXT_PUBLIC_AI_URL: 'https://ai.coindaily.online',
        ADMIN_MODE: 'true'
      },
      error_file: '/var/log/coindaily/admin-error.log',
      out_file: '/var/log/coindaily/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // PR SYSTEM - press.coindaily.online
    // ============================================
    {
      name: 'coindaily-press',
      cwd: '/var/www/coindaily-press',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_AI_URL: 'https://ai.coindaily.online',
        PR_MODE: 'true'
      },
      error_file: '/var/log/coindaily/pr-error.log',
      out_file: '/var/log/coindaily/pr-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // AI DASHBOARD - ai.coindaily.online
    // ============================================
    {
      name: 'coindaily-ai',
      cwd: '/var/www/coindaily-ai',
      script: 'node_modules/.bin/next',
      args: 'start -p 3004',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        OLLAMA_API_URL: 'http://localhost:11434',
        NLLB_API_ENDPOINT: 'http://localhost:8080',
        SDXL_API_ENDPOINT: 'http://localhost:7860',
        DEEPSEEK_API_URL: 'http://localhost:11434'
      },
      error_file: '/var/log/coindaily/ai-error.log',
      out_file: '/var/log/coindaily/ai-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '2G',
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '30s'
    },

    // ============================================
    // TOKEN LANDING - token.coindaily.online (Already deployed)
    // ============================================
    {
      name: 'coindaily-token',
      cwd: '/var/www/coindaily-token',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: '/var/log/coindaily/token-error.log',
      out_file: '/var/log/coindaily/token-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '300M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
