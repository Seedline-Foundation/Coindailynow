module.exports = {
  apps: [
    {
      name: 'token-landing',
      cwd: './MVP/token-landing',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/token-landing-error.log',
      out_file: './logs/token-landing-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'email-cron',
      cwd: './MVP/token-landing',
      script: 'node',
      args: '-e "setInterval(() => fetch(\'http://localhost:3001/api/cron/send-emails\', { headers: { \'Authorization\': \'Bearer \' + (process.env.CRON_SECRET || \'your-secret-token-change-in-production\') } }).then(r => r.json()).then(console.log).catch(console.error), 3600000)"',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      cron_restart: '0 * * * *', // Restart every hour at minute 0
      watch: false
    }
  ]
};
