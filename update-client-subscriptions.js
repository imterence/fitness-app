const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateClientSubscriptions() {
  try {
    console.log('🔄 Updating client subscription fields...')

    // Update all existing clients to have default subscription values
    const updateResult = await prisma.client.updateMany({
      data: {
        subscriptionStatus: 'ACTIVE', // Set all existing clients to ACTIVE
        subscriptionPlan: 'BASIC'     // Set all existing clients to BASIC plan
      }
    })

    console.log(`✅ Updated ${updateResult.count} client records with subscription data`)

    // Show the updated clients
    const clients = await prisma.client.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    console.log('\n👥 Updated clients:')
    clients.forEach(client => {
      console.log(`  - ${client.user.name} (${client.user.email}) - Status: ${client.subscriptionStatus}, Plan: ${client.subscriptionPlan}`)
    })

  } catch (error) {
    console.error('❌ Error updating client subscriptions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateClientSubscriptions()
