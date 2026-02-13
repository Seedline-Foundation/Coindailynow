/**
 * PM2 Ecosystem Configuration
 * CoinDaily Platform - All Applications
 * 
 * Domains:
 * - coindaily.online (News) - Port 3000
 * - jet.coindaily.online (Admin) - Port 3002
 * - press.coindaily.online (PR) - Port 3003
 * - ai.coindaily.online (AI) - Port 3004
 * - app.coindaily.online (Backend) - Port 4000
 * - token.coindaily.online (MVP) - Deployed separately
 */

module.exports = {
  apps: [
    // ============================================
    // BACKEND API - app.coindaily.online
    // ============================================
    {
      name: 'coindaily-backend',
      cwd: './backend',
      script: 'dist/backend/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // NEWS APP - coindaily.online
    // ============================================
    {
      name: 'coindaily-news',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.coindaily.online/graphql'
      },
      error_file: './logs/news-error.log',
      out_file: './logs/news-out.log',
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
      cwd: './apps/admin',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.coindaily.online/graphql'
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '400M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // PR & AD NETWORK - press.coindaily.online
    // ============================================
    {
      name: 'coindaily-press',
      cwd: './apps/press',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.coindaily.online/graphql'
      },
      error_file: './logs/press-error.log',
      out_file: './logs/press-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '400M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // AI SYSTEM - ai.coindaily.online
    // ============================================
    {
      name: 'coindaily-ai',
      cwd: './apps/ai',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        NEXT_PUBLIC_API_URL: 'https://app.coindaily.online',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.coindaily.online/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.coindaily.online/graphql'
      },
      error_file: './logs/ai-error.log',
      out_file: './logs/ai-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '600M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // TRANSLATION SERVICE (Python)
    // ============================================
    {
      name: 'coindaily-translation',
      cwd: './translation-service',
      script: 'venv/bin/python',
      args: '-m uvicorn server:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PYTHONPATH: '.',
        MODEL_NAME: 'facebook/nllb-200-distilled-600M'
      },
      error_file: './logs/translation-error.log',
      out_file: './logs/translation-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '2G',
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '30s'
    }
  ]
};
