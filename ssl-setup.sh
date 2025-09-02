#!/bin/bash

# SSL Certificate Setup Script for Hostinger VPS
# Run this after configuring your domain

set -e

# Configuration
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Check if domain is configured
echo "🔍 Checking domain configuration..."
if ! nslookup $DOMAIN > /dev/null 2>&1; then
    echo "❌ Domain $DOMAIN is not resolving. Please configure your DNS first."
    exit 1
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Test certificate renewal
echo "🔄 Testing certificate renewal..."
certbot renew --dry-run

# Set up automatic renewal
echo "⏰ Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ SSL certificate setup completed successfully!"
echo "🌐 Your site should now be available at: https://$DOMAIN"
echo "🔄 Certificate will auto-renew every 12 hours"
