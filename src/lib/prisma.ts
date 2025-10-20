import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client configuration for Neon database with connection pooling
const createPrismaClient = () => {
  // Optimize connection string for Neon's serverless environment
  const databaseUrl = process.env.DATABASE_URL
  const connectionUrl = databaseUrl?.includes('?')
    ? `${databaseUrl}&connection_limit=1&pool_timeout=0`
    : `${databaseUrl}?connection_limit=1&pool_timeout=0`
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})


