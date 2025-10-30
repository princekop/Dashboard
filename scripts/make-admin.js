// Script to make a user admin
// Usage: node scripts/make-admin.js your@email.com

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makeAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Error: Please provide an email address')
    console.log('Usage: node scripts/make-admin.js your@email.com')
    process.exit(1)
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found`)
      process.exit(1)
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    })

    console.log('✅ Success! User is now an admin:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Name:    ${updatedUser.name || 'N/A'}`)
    console.log(`Email:   ${updatedUser.email}`)
    console.log(`Admin:   ${updatedUser.isAdmin ? '✓ Yes' : '✗ No'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  Important: User must logout and login again for changes to take effect!')
    console.log('\n📍 Steps to access admin area:')
    console.log('   1. Logout from the dashboard')
    console.log('   2. Login again with this email')
    console.log('   3. Look for "Admin" section in sidebar')
    console.log('   4. Navigate to /admin\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()
