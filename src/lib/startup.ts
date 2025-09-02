import { warmConnection, ConnectionMonitor } from './db-utils'

// Application startup utilities
export async function initializeApp() {
  console.log('🚀 Initializing application...')
  
  try {
    // Warm up database connection
    console.log('🔥 Warming up database connection...')
    await warmConnection()
    
    // Initialize connection monitor
    console.log('📊 Starting connection monitoring...')
    const monitor = ConnectionMonitor.getInstance()
    await monitor.checkHealth()
    
    // Start periodic health checks in production
    if (process.env.NODE_ENV === 'production') {
      monitor.startHealthChecks(30000) // Check every 30 seconds
    }
    
    console.log('✅ Application initialization completed')
  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    throw error
  }
}

// Call this function when your application starts
export function startApp() {
  initializeApp().catch((error) => {
    console.error('Failed to initialize app:', error)
    process.exit(1)
  })
}
