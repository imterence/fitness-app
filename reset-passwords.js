const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetPasswords() {
  try {
    console.log('🔄 Resetting all user passwords to "password123"...')

    // Hash the new password
    const hashedPassword = await bcrypt.hash('password123', 12)
    console.log('✅ Password hashed successfully')

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    })

    console.log(`👥 Found ${users.length} users to update:`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })

    // Update all user passwords
    const updateResult = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    })

    console.log(`\n✅ Successfully updated ${updateResult.count} user passwords!`)
    console.log('\n🔑 All users can now login with:')
    console.log('   Username: their email address')
    console.log('   Password: password123')

    // Show the updated users
    console.log('\n👥 Updated users:')
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })

  } catch (error) {
    console.error('❌ Error resetting passwords:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswords()
