const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function quickRestore() {
  try {
    console.log('🔄 Quick data check...')

    // Just check what we have
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log('📊 Current Database Status:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`👤 Clients: ${clientCount}`)
    console.log(`💪 Exercises: ${exerciseCount}`)
    console.log(`🏋️ Workouts: ${workoutCount}`)

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { name: true, email: true, role: true }
      })
      console.log('\n👥 Users in database:')
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
      })
    }

    if (clientCount > 0) {
      const clients = await prisma.client.findMany({
        select: { 
          user: { select: { name: true, email: true } },
          goals: true 
        }
      })
      console.log('\n👤 Client records:')
      clients.forEach(client => {
        console.log(`  - ${client.user.name} (${client.user.email}) - Goals: ${client.goals}`)
      })
    }

    console.log('\n✅ Database check completed!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickRestore()
