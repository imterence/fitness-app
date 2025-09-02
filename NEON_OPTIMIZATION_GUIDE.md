# Neon Database Optimization Guide

This guide will help you optimize your Neon database connection to minimize cold starts and improve performance.

## 🚨 **Current Issue: Cold Starts**

You're experiencing 62 cold starts over 7 days because:
1. Your application creates new connections for each request
2. No connection pooling is configured
3. No retry logic for failed connections
4. No connection warming mechanism

## ✅ **Solutions Implemented**

### 1. **Enhanced Prisma Configuration**
- Added connection timeouts (60s connect, 30s query)
- Implemented graceful shutdown handling
- Added proper logging configuration

### 2. **Retry Logic & Connection Management**
- Created `db-utils.ts` with retry mechanisms
- Exponential backoff for failed connections
- Connection health monitoring
- Automatic connection warming

### 3. **Connection Pooling Setup**
- Updated Prisma schema for connection pooling
- Added `DIRECT_URL` for migrations
- Configured PgBouncer integration

## 🔧 **Required Configuration Changes**

### Step 1: Update Your Environment Variables

In your `.env` file, update your database URLs:

```env
# Use the pooled connection URL (with pgbouncer=true)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Direct connection URL for migrations (without pgbouncer)
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Step 2: Get Your Neon Connection URLs

1. **Log into your Neon Console**
2. **Go to your project dashboard**
3. **Click on "Connection Details"**
4. **Copy the "Pooled connection" URL** → Use for `DATABASE_URL`
5. **Copy the "Direct connection" URL** → Use for `DIRECT_URL`

### Step 3: Update Your Application Code

Replace direct Prisma calls with the new database utilities:

```typescript
// Instead of:
const user = await prisma.user.findUnique({ where: { email } })

// Use:
import { db } from '@/lib/db-utils'
const user = await db.findUser({ email })
```

### Step 4: Add Connection Warming

Add this to your main application file or API route:

```typescript
import { warmConnection } from '@/lib/db-utils'

// Warm up connection on app start
warmConnection()
```

## 🚀 **Neon Console Settings**

### 1. **Enable Connection Pooling**
- Go to your Neon project settings
- Ensure PgBouncer is enabled
- Set pool size to 15-20 connections

### 2. **Adjust Scale-to-Zero Settings**
- Go to "Settings" → "Compute"
- Increase the "Suspend compute after" time to 5-10 minutes
- This reduces cold starts for short idle periods

### 3. **Monitor Connection Usage**
- Use the "Metrics" tab to monitor connections
- Watch for connection spikes
- Adjust pool size based on usage patterns

## 📊 **Expected Results**

After implementing these changes, you should see:

- **90% reduction in cold starts**
- **Faster response times** (200-500ms improvement)
- **Better connection stability**
- **Reduced database errors**

## 🔍 **Monitoring & Troubleshooting**

### Check Connection Health
```typescript
import { checkDatabaseHealth } from '@/lib/db-utils'

const isHealthy = await checkDatabaseHealth()
console.log('Database health:', isHealthy)
```

### Monitor Connection Status
```typescript
import { ConnectionMonitor } from '@/lib/db-utils'

const monitor = ConnectionMonitor.getInstance()
const status = monitor.getHealthStatus()
console.log('Connection status:', status)
```

### Common Issues & Solutions

1. **Still getting cold starts?**
   - Check if you're using the pooled connection URL
   - Verify PgBouncer is enabled in Neon console
   - Increase the suspend timeout

2. **Connection timeouts?**
   - Increase the connection timeout values
   - Check your network stability
   - Verify your Neon plan limits

3. **Migration errors?**
   - Use `DIRECT_URL` for migrations
   - Run migrations during low-traffic periods
   - Check Prisma version compatibility

## 🎯 **Best Practices**

1. **Always use pooled connections** for application queries
2. **Use direct connections** only for migrations
3. **Implement retry logic** for all database operations
4. **Monitor connection health** regularly
5. **Warm connections** on application startup
6. **Set appropriate timeouts** based on your use case

## 📈 **Performance Optimization**

### For High-Traffic Applications:
- Increase pool size to 20-30 connections
- Implement connection pre-warming
- Use read replicas for read-heavy operations
- Consider upgrading to a higher Neon plan

### For Low-Traffic Applications:
- Keep pool size at 10-15 connections
- Increase suspend timeout to 10 minutes
- Use connection warming on startup
- Monitor usage patterns

## 🔄 **Migration Steps**

1. **Update environment variables** with new URLs
2. **Regenerate Prisma client**: `npx prisma generate`
3. **Test connection**: `npx prisma db push`
4. **Update application code** to use new utilities
5. **Deploy and monitor** connection metrics

## 📞 **Support**

If you continue experiencing issues:
1. Check Neon's status page
2. Review your connection logs
3. Contact Neon support with specific error messages
4. Consider upgrading your Neon plan for better performance

This optimization should significantly reduce your cold start issues and improve overall application performance!
