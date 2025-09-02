#!/bin/bash

# Fitness App Deployment Script for Hostinger VPS
# Run this script from your local machine to deploy to VPS

set -e

# Configuration
VPS_HOST="your-vps-ip-address"
VPS_USER="root"
APP_DIR="/var/www/fitness-app"
REPO_URL="https://github.com/yourusername/fitness-hyrox-app.git"

echo "🚀 Starting deployment to Hostinger VPS..."

# Check if SSH key is available
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "❌ SSH key not found. Please ensure you have SSH access to your VPS."
    exit 1
fi

# Test SSH connection
echo "🔍 Testing SSH connection..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH connection successful'"

# Create application directory if it doesn't exist
echo "📁 Setting up application directory..."
ssh $VPS_USER@$VPS_HOST "mkdir -p $APP_DIR"

# Clone or update repository
echo "📥 Updating application code..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && if [ -d .git ]; then git pull origin main; else git clone $REPO_URL .; fi"

# Install dependencies
echo "📦 Installing dependencies..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && npm install"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && npx prisma generate"

# Run database migrations
echo "🗄️ Running database migrations..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && npx prisma migrate deploy"

# Build application
echo "🏗️ Building application..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && npm run build"

# Restart application with PM2
echo "🔄 Restarting application..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && pm2 restart fitness-app || pm2 start ecosystem.config.js"

# Save PM2 configuration
ssh $VPS_USER@$VPS_HOST "pm2 save"

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at: http://$VPS_HOST"
echo "📊 Check application status with: ssh $VPS_USER@$VPS_HOST 'pm2 status'"
echo "📝 View logs with: ssh $VPS_USER@$VPS_HOST 'pm2 logs fitness-app'"
