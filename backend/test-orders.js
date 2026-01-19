const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    const items = await prisma.orderItem.findMany({ 
      take: 3, 
      select: { 
        id: true, 
        type: true, 
        name: true 
      } 
    });
    console.log('\n✓ SUCCESS! Orders can be queried without errors');
    console.log('Sample OrderItems:', items);
    
    // Test getting an order with items
    const order = await prisma.order.findFirst({
      include: { orderItems: true }
    });
    
    if (order) {
      console.log('\n✓ Order with items retrieved:');
      console.log(`  Order ID: ${order.id}`);
      console.log(`  Items count: ${order.orderItems.length}`);
      if (order.orderItems.length > 0) {
        console.log(`  First item type: ${order.orderItems[0].type}`);
      }
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

test();
