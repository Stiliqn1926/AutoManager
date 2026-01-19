const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFix() {
  try {
    console.log('Checking database state...\n');

    // Step 1: Check what types exist in database
    const types = await prisma.$queryRaw`SELECT DISTINCT "type" FROM "order_items"`;
    console.log('✓ Types in database:', types);

    // Step 2: Check enum definition
    const enumCheck = await prisma.$queryRaw`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'OrderItemType'
      ORDER BY e.enumsortorder
    `;
    console.log('✓ Enum values in database:', enumCheck);

    await prisma.$disconnect();
  } catch (error) {
    console.error('✗ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAndFix();
