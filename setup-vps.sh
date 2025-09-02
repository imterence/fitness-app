#!/bin/bash

# Hostinger VPS Setup Script
# Run this script on your VPS to set up the environment

set -e

echo "🚀 Setting up Hostinger VPS for fitness app deployment..."

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x LTS
echo "📥 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install PM2
echo "⚙️ Installing PM2..."
npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
apt install certbot python3-certbot-nginx -y

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/fitness-app
chown -R www-data:www-data /var/www/fitness-app

# Create PM2 log directory
mkdir -p /var/log/pm2
chown -R www-data:www-data /var/log/pm2

# Create backup directory
mkdir -p /var/backups

echo "✅ VPS setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your database: sudo -u postgres psql -f database-setup.sql"
echo "2. Upload your application files to /var/www/fitness-app"
echo "3. Configure environment variables in /var/www/fitness-app/.env"
echo "4. Run: cd /var/www/fitness-app && npm install"
echo "5. Run: npx prisma generate && npx prisma migrate deploy"
echo "6. Run: npm run build"
echo "7. Start with PM2: pm2 start ecosystem.config.js"
echo "8. Configure Nginx with the provided nginx.conf"
echo "9. Set up SSL certificate with Certbot"
