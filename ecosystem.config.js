module.exports = {
  apps: [
    {
      name: 'coindaily-backend',
      cwd: './backend',
      script: 'dist/index.js',
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
    {
      name: 'coindaily-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'coindaily-coming-soon',
      cwd: './coming',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/coming-error.log',
      out_file: './logs/coming-out.log',
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
