import { prisma } from './prisma'

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const CONNECTION_TIMEOUT = 10000 // 10 seconds

// Retry logic for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a connection-related error
      const isConnectionError = 
        error instanceof Error && (
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('cold start') ||
          error.message.includes('serverless')
        )

      if (!isConnectionError || attempt === maxRetries) {
        throw error
      }

      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error)
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await withRetry(async () => {
      await prisma.$queryRaw`SELECT 1`
    }, 2, 500)
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Connection warming function
export async function warmConnection(): Promise<void> {
  try {
    await withRetry(async () => {
      // Run a simple query to warm up the connection
      await prisma.$queryRaw`SELECT 1`
      console.log('Database connection warmed up successfully')
    }, 2, 500)
  } catch (error) {
    console.error('Failed to warm database connection:', error)
  }
}

// Enhanced database operations with retry logic
export const db = {
  // User operations
  async findUser(where: any) {
    return withRetry(() => prisma.user.findUnique({ where }))
  },

  async findUsers(where?: any) {
    return withRetry(() => prisma.user.findMany({ where }))
  },

  async createUser(data: any) {
    return withRetry(() => prisma.user.create({ data }))
  },

  async updateUser(where: any, data: any) {
    return withRetry(() => prisma.user.update({ where, data }))
  },

  // Exercise operations
  async findExercises(where?: any) {
    return withRetry(() => prisma.exercise.findMany({ where }))
  },

  async findExercise(where: any) {
    return withRetry(() => prisma.exercise.findUnique({ where }))
  },

  async createExercise(data: any) {
    return withRetry(() => prisma.exercise.create({ data }))
  },

  // Workout operations
  async findWorkouts(where?: any) {
    return withRetry(() => prisma.workout.findMany({ where }))
  },

  async findWorkout(where: any) {
    return withRetry(() => prisma.workout.findUnique({ where }))
  },

  async createWorkout(data: any) {
    return withRetry(() => prisma.workout.create({ data }))
  },

  // Client operations
  async findClients(where?: any) {
    return withRetry(() => prisma.client.findMany({ where }))
  },

  async findClient(where: any) {
    return withRetry(() => prisma.client.findUnique({ where }))
  },

  // Count operations
  async countUsers(where?: any) {
    return withRetry(() => prisma.user.count({ where }))
  },

  async countExercises(where?: any) {
    return withRetry(() => prisma.exercise.count({ where }))
  },

  async countWorkouts(where?: any) {
    return withRetry(() => prisma.workout.count({ where }))
  },

  // Transaction operations
  async transaction<T>(fn: (tx: any) => Promise<T>) {
    return withRetry(() => prisma.$transaction(fn))
  },

  // Raw queries
  async rawQuery<T = any>(query: any) {
    return withRetry(() => prisma.$queryRaw<T>(query))
  },

  // Disconnect
  async disconnect() {
    return prisma.$disconnect()
  }
}

// Connection pool monitoring
export class ConnectionMonitor {
  private static instance: ConnectionMonitor
  private isHealthy: boolean = true
  private lastCheck: Date = new Date()

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor()
    }
    return ConnectionMonitor.instance
  }

  async checkHealth(): Promise<boolean> {
    this.lastCheck = new Date()
    this.isHealthy = await checkDatabaseHealth()
    return this.isHealthy
  }

  getHealthStatus(): { isHealthy: boolean; lastCheck: Date } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck
    }
  }

  // Start periodic health checks
  startHealthChecks(intervalMs: number = 30000) {
    setInterval(async () => {
      await this.checkHealth()
    }, intervalMs)
  }
}

// Initialize connection monitor
const connectionMonitor = ConnectionMonitor.getInstance()

// Start health checks in production
if (process.env.NODE_ENV === 'production') {
  connectionMonitor.startHealthChecks()
}
