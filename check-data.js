const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const exerciseCount = await prisma.exercise.count()
    const workoutCount = await prisma.workout.count()
    
    console.log('📊 Database Status:')
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
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
