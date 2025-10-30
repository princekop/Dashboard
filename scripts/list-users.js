// Script to list all users and their admin status
// Usage: node scripts/list-users.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (users.length === 0) {
      console.log('No users found in database')
      return
    }

    console.log('\n📋 Users List')
    console.log('═══════════════════════════════════════════════════════════════\n')

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No Name'} (${user.email})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`)
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
      console.log('───────────────────────────────────────────────────────────────')
    })

    const adminCount = users.filter(u => u.isAdmin).length
    console.log(`\n📊 Summary:`)
    console.log(`   Total Users: ${users.length}`)
    console.log(`   Admins: ${adminCount}`)
    console.log(`   Regular Users: ${users.length - adminCount}\n`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
