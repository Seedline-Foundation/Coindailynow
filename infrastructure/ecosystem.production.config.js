/**
 * CoinDaily Platform - PM2 Ecosystem Configuration
 * 
 * Services:
 * - Backend API (app.sygn.live) - Port 4000
 * - News Frontend (sygn.live) - Port 3000
 * - Admin Portal (jet.sygn.live) - Port 3002
 * - PR System (press.sygn.live) - Port 3003
 * - AI Dashboard (ai.sygn.live) - Port 3004
 * - CFIS (cabfi.xyz, finance-system) - Port 3007 (3005 held by section8)
 * - Token Landing (token.sygn.live) - Port 3001 (from joy-token-landing package.json)
 */

module.exports = {
  apps: [
    // ============================================
    // BACKEND API - app.sygn.live
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
    // NEWS FRONTEND - sygn.live
    // ============================================
    {
      name: 'coindaily-news',
      cwd: '/var/www/coindaily-news',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://app.sygn.live',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.sygn.live/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.sygn.live/graphql',
        NEXT_PUBLIC_AI_URL: 'https://ai.sygn.live'
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
    // ADMIN PORTAL - jet.sygn.live
    // ============================================
    {
      name: 'coindaily-admin',
      cwd: '/var/www/coindaily-admin',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        NEXT_PUBLIC_API_URL: 'https://app.sygn.live',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.sygn.live/graphql',
        NEXT_PUBLIC_WS_URL: 'wss://app.sygn.live/graphql',
        NEXT_PUBLIC_AI_URL: 'https://ai.sygn.live',
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
    // PR SYSTEM - press.sygn.live
    // ============================================
    {
      name: 'coindaily-press',
      cwd: '/var/www/coindaily-press',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_API_URL: 'https://app.sygn.live',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.sygn.live/graphql',
        NEXT_PUBLIC_AI_URL: 'https://ai.sygn.live',
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
    // AI DASHBOARD - ai.sygn.live
    // ============================================
    {
      name: 'coindaily-ai',
      cwd: '/var/www/coindaily-ai',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        NEXT_PUBLIC_API_URL: 'https://app.sygn.live',
        NEXT_PUBLIC_GRAPHQL_URL: 'https://app.sygn.live/graphql',
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
    // AI AGENT PIPELINE - content generation, translation, review
    // This is the Node.js agent orchestrator (ai-system/),
    // NOT the Next.js dashboard (apps/ai/).
    // ============================================
    {
      name: 'coindaily-ai-pipeline',
      cwd: '/var/www/coindaily-ai-system',
      script: 'dist/orchestrator/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        OLLAMA_API_URL: 'http://localhost:11434',
        NLLB_API_ENDPOINT: 'http://localhost:8080',
        SDXL_API_ENDPOINT: 'http://localhost:7860',
        DEEPSEEK_API_URL: 'http://localhost:11434',
        REDIS_URL: 'redis://localhost:6379'
      },
      error_file: '/var/log/coindaily/ai-pipeline-error.log',
      out_file: '/var/log/coindaily/ai-pipeline-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 5000
    },

    // ============================================
    // CFIS (Finance System) - cabfi.xyz
    // Hosted on cabfi.xyz, communicates with backend.sygn.live via HMAC.
    // Deploy target: /var/www/coindaily-cfis (build output of finance-system/).
    // Port 3007 (was 3005 — section8 is holding 3005 since June 2026).
    // ============================================
    {
      name: 'coindaily-cfis',
      cwd: '/var/www/coindaily-cfis',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
        BACKEND_API_URL: 'https://backend.sygn.live',
        CFIS_PUBLIC_HOST: 'cabfi.xyz',
        CFIS_CORS_ORIGINS: 'https://cabfi.xyz,https://jet.sygn.live,https://app.sygn.live,https://press.sygn.live'
      },
      error_file: '/var/log/coindaily/cfis-error.log',
      out_file: '/var/log/coindaily/cfis-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ============================================
    // TOKEN LANDING - token.sygn.live (Already deployed)
    // Port moved from 3005 → 3006 to avoid conflict with CFIS (finance-system)
    // which has occupied :3005 since launch. Update token.sygn.live nginx
    // upstream to 127.0.0.1:3006.
    // ============================================
    {
      name: 'coindaily-token',
      cwd: '/var/www/token-landing',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
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
