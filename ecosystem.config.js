module.exports = {
  apps: [{
    name: 'fitness-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/fitness-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/fitness-app-error.log',
    out_file: '/var/log/pm2/fitness-app-out.log',
    log_file: '/var/log/pm2/fitness-app.log',
    time: true
  }]
};
