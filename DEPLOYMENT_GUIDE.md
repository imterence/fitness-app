# Hostinger VPS Deployment Guide

This guide will help you deploy your fitness application to Hostinger VPS.

## Prerequisites

- Hostinger VPS plan (Linux-based)
- Domain name (optional, can use IP address)
- SSH access to your VPS
- Basic knowledge of Linux commands

## Step 1: VPS Setup and Software Installation

### 1.1 Connect to your VPS
```bash
ssh root@your-vps-ip-address
```

### 1.2 Update system packages
```bash
apt update && apt upgrade -y
```

### 1.3 Install Node.js (LTS version)
```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.4 Install PostgreSQL
```bash
# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
```

### 1.5 Create database and user
```sql
-- In PostgreSQL prompt
CREATE DATABASE hyroxfit_db;
CREATE USER hyroxfit_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hyroxfit_db TO hyroxfit_user;
\q
```

### 1.6 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 1.7 Install Nginx (Reverse Proxy)
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

## Step 2: Application Deployment

### 2.1 Clone your repository
```bash
# Create application directory
mkdir -p /var/www/fitness-app
cd /var/www/fitness-app

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/fitness-hyrox-app.git .

# Or upload your files via SCP/SFTP
```

### 2.2 Install dependencies
```bash
npm install
```

### 2.3 Set up environment variables
```bash
# Copy environment template
cp env.example .env

# Edit environment file
nano .env
```

### 2.4 Configure production environment variables
```env
# Database Configuration
DATABASE_URL="postgresql://hyroxfit_user:your_secure_password@localhost:5432/hyroxfit_db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="https://yourdomain.com"

# Node Environment
NODE_ENV="production"
```

### 2.5 Build the application
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build
```

## Step 3: Database Setup

### 3.1 Run database migrations
```bash
npx prisma migrate deploy
```

### 3.2 Seed the database (optional)
```bash
npm run db:seed
```

## Step 4: Configure PM2

### 4.1 Create PM2 ecosystem file
```bash
nano ecosystem.config.js
```

### 4.2 PM2 configuration
```javascript
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
    }
  }]
};
```

### 4.3 Start application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 5: Configure Nginx

### 5.1 Create Nginx configuration
```bash
nano /etc/nginx/sites-available/fitness-app
```

### 5.2 Nginx configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 Enable the site
```bash
ln -s /etc/nginx/sites-available/fitness-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 6: SSL Certificate (Let's Encrypt)

### 6.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtain SSL certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 7: Firewall Configuration

### 7.1 Configure UFW
```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## Step 8: Monitoring and Maintenance

### 8.1 Check application status
```bash
pm2 status
pm2 logs fitness-app
```

### 8.2 Set up log rotation
```bash
pm2 install pm2-logrotate
```

## Troubleshooting

### Common Issues:

1. **Database connection errors**: Check PostgreSQL service and credentials
2. **Build failures**: Ensure all dependencies are installed
3. **Permission issues**: Check file ownership and permissions
4. **Port conflicts**: Ensure port 3000 is available

### Useful Commands:

```bash
# Check application logs
pm2 logs fitness-app

# Restart application
pm2 restart fitness-app

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql

# View Nginx error logs
tail -f /var/log/nginx/error.log
```

## Security Considerations

1. **Change default passwords** for database and system users
2. **Keep system updated** with security patches
3. **Configure firewall** to only allow necessary ports
4. **Use strong NEXTAUTH_SECRET** in production
5. **Regular backups** of database and application files
6. **Monitor logs** for suspicious activity

## Backup Strategy

### Database Backup
```bash
# Create backup script
nano /var/www/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hyroxfit_user -h localhost hyroxfit_db > /var/backups/hyroxfit_db_$DATE.sql
find /var/backups -name "hyroxfit_db_*.sql" -mtime +7 -delete
```

### Application Backup
```bash
# Create application backup script
nano /var/www/backup-app.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /var/backups/fitness-app_$DATE.tar.gz /var/www/fitness-app
find /var/backups -name "fitness-app_*.tar.gz" -mtime +7 -delete
```

### Set up cron jobs for automated backups
```bash
crontab -e
```

Add these lines:
```bash
# Daily database backup at 2 AM
0 2 * * * /var/www/backup-db.sh

# Weekly application backup on Sundays at 3 AM
0 3 * * 0 /var/www/backup-app.sh
```

## Performance Optimization

1. **Enable gzip compression** in Nginx
2. **Set up caching** for static assets
3. **Monitor memory usage** and adjust PM2 settings
4. **Use CDN** for static assets if needed
5. **Optimize database queries** and add indexes

This guide should get your fitness application running on Hostinger VPS. Make sure to replace placeholder values with your actual configuration details.
