const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const products = [
  {
    name: "Miner Revo",
    description: "Perfect starter plan with 1 port, subdomain, and 1 backup. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 4,
    cpu: 1,
    storage: 20,
    price: 100,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Chinna X",
    description: "Enhanced performance with 2 ports, subdomain, and 3 backups. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 6,
    cpu: 1.5,
    storage: 30,
    price: 150,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Parle Max",
    description: "Great for medium workloads with 2 ports, subdomain, and 3 backups. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 8,
    cpu: 2,
    storage: 40,
    price: 200,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Huka Pro",
    description: "Professional tier with 2 ports, subdomain, and 3 backups. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 10,
    cpu: 2.5,
    storage: 60,
    price: 250,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Notty OP",
    description: "Advanced performance with 3 ports, subdomain, and 5 backups. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 12,
    cpu: 3.5,
    storage: 70,
    price: 300,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Dark Plus",
    description: "Premium plan with 4 ports, subdomain, and 5 backups. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 14,
    cpu: 4,
    storage: 80,
    price: 350,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Darky Zone",
    description: "High-performance with 8 ports, subdomain, and 6 backups. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 16,
    cpu: 5,
    storage: 90,
    price: 400,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Dark Neo",
    description: "Elite tier with 12 ports, subdomain, 9 backups, and 1 free Discord bot hosting. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 20,
    cpu: 6,
    storage: 100,
    price: 500,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "DarkByte V1",
    description: "Flagship plan with 13 ports, subdomain, 10 backups, and 2 free Discord bot hostings. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 24,
    cpu: 7,
    storage: 120,
    price: 600,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Byte Elite",
    description: "Ultimate performance with 13 ports, subdomain, 10 backups, and 4 free Discord bot hostings. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 26,
    cpu: 8,
    storage: 140,
    price: 650,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Byte Ultra",
    description: "Extreme power with 15 ports, subdomain, 12 backups, and 5 free Discord bot hostings. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 30,
    cpu: 9,
    storage: 160,
    price: 750,
    billing: "monthly",
    duration: 30,
    isActive: true
  },
  {
    name: "Byte Supreme",
    description: "Maximum capacity with 18 ports, subdomain, 16 backups, and 6 free Discord bot hostings. Powered by Xeon @3GHz (OC 3.8GHz)",
    ram: 32,
    cpu: 10,
    storage: 200,
    price: 800,
    billing: "monthly",
    duration: 30,
    isActive: true
  }
]

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Delete existing products
  console.log('🗑️  Clearing existing products...')
  await prisma.product.deleteMany({})
  
  console.log('📦 Creating products...')
  
  for (const product of products) {
    const created = await prisma.product.create({
      data: product
    })
    console.log(`✅ Created: ${created.name} - ₹${created.price}/month`)
  }
  
  console.log('\n🎉 Seed completed successfully!')
  console.log(`📊 Total products created: ${products.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
