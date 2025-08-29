const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTrainerRelationships() {
  try {
    console.log('🔍 Checking current trainer-client relationships...')
    
    // Get all clients
    const clients = await prisma.client.findMany({
      include: {
        user: true,
        trainer: true
      }
    })
    
    console.log(`📊 Found ${clients.length} clients`)
    
    // Get all trainers
    const trainers = await prisma.user.findMany({
      where: { role: 'TRAINER' }
    })
    
    console.log(`🏋️ Found ${trainers.length} trainers`)
    
    // Check each client
    for (const client of clients) {
      console.log(`\n👤 Client: ${client.user.name} (${client.user.email})`)
      console.log(`   Current trainerId: ${client.trainerId}`)
      console.log(`   Current trainer: ${client.trainer ? client.trainer.name : 'None'}`)
      
      // If client has no trainer, assign to first available trainer
      if (!client.trainer && trainers.length > 0) {
        const trainer = trainers[0]
        console.log(`   🔗 Assigning to trainer: ${trainer.name}`)
        
        await prisma.client.update({
          where: { id: client.id },
          data: { trainerId: trainer.id }
        })
        
        console.log(`   ✅ Assigned to ${trainer.name}`)
      }
    }
    
    console.log('\n🎉 Trainer relationships check complete!')
    
  } catch (error) {
    console.error('❌ Error fixing trainer relationships:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTrainerRelationships()
