#!/bin/bash

# Monitoring and Maintenance Setup Script
# Run this to set up monitoring and backup systems

set -e

echo "📊 Setting up monitoring and maintenance..."

# Create backup scripts
echo "💾 Creating backup scripts..."

# Database backup script
cat > /var/www/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups"
DB_NAME="hyroxfit_db"
DB_USER="hyroxfit_user"

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/hyroxfit_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/hyroxfit_db_$DATE.sql

# Remove backups older than 7 days
find $BACKUP_DIR -name "hyroxfit_db_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: hyroxfit_db_$DATE.sql.gz"
EOF

# Application backup script
cat > /var/www/backup-app.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups"
APP_DIR="/var/www/fitness-app"

# Create backup (excluding node_modules and .git)
tar -czf $BACKUP_DIR/fitness-app_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    -C $APP_DIR .

# Remove backups older than 7 days
find $BACKUP_DIR -name "fitness-app_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: fitness-app_$DATE.tar.gz"
EOF

# Make backup scripts executable
chmod +x /var/www/backup-db.sh
chmod +x /var/www/backup-app.sh

# Set up cron jobs for automated backups
echo "⏰ Setting up automated backups..."
(crontab -l 2>/dev/null; echo "# Daily database backup at 2 AM") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/backup-db.sh") | crontab -
(crontab -l 2>/dev/null; echo "# Weekly application backup on Sundays at 3 AM") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 /var/www/backup-app.sh") | crontab -

# Install PM2 log rotation
echo "📝 Setting up log rotation..."
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Create system monitoring script
cat > /var/www/monitor.sh << 'EOF'
#!/bin/bash

# System monitoring script
LOG_FILE="/var/log/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if application is running
if ! pm2 list | grep -q "fitness-app.*online"; then
    echo "[$DATE] ERROR: Application is not running" >> $LOG_FILE
    # Restart application
    pm2 restart fitness-app
    echo "[$DATE] INFO: Application restarted" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Check database connection
if ! sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[$DATE] ERROR: Database connection failed" >> $LOG_FILE
fi
EOF

chmod +x /var/www/monitor.sh

# Set up monitoring cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "# System monitoring every 5 minutes") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/monitor.sh") | crontab -

# Create log cleanup script
cat > /var/www/cleanup-logs.sh << 'EOF'
#!/bin/bash

# Clean up old logs
find /var/log -name "*.log" -mtime +30 -delete
find /var/log -name "*.gz" -mtime +30 -delete

echo "Log cleanup completed"
EOF

chmod +x /var/www/cleanup-logs.sh

# Set up weekly log cleanup
(crontab -l 2>/dev/null; echo "# Weekly log cleanup on Sundays at 4 AM") | crontab -
(crontab -l 2>/dev/null; echo "0 4 * * 0 /var/www/cleanup-logs.sh") | crontab -

echo "✅ Monitoring and maintenance setup completed!"
echo ""
echo "📊 Monitoring features:"
echo "- Application auto-restart if it crashes"
echo "- Disk and memory usage monitoring"
echo "- Database connection monitoring"
echo "- Automated daily database backups"
echo "- Weekly application backups"
echo "- Log rotation and cleanup"
echo ""
echo "📝 Logs location:"
echo "- Application logs: pm2 logs fitness-app"
echo "- System monitoring: /var/log/system-monitor.log"
echo "- Backups: /var/backups/"
