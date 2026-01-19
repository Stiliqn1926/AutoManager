const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('Fixing database: converting SERVICE to LABOR...');
    
    // Use raw SQL through Prisma to update the enum values
    const result = await prisma.$executeRawUnsafe(
      'UPDATE "order_items" SET "type" = \'LABOR\' WHERE "type" = \'SERVICE\''
    );
    
    console.log(`✓ Updated ${result} rows from SERVICE to LABOR`);

    await prisma.$disconnect();
    console.log('✓ Database fix completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error fixing database:', error.message);
    process.exit(1);
  }
}

fixDatabase();
