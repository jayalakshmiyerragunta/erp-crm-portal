import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Users ──────────────────────────────────────────────
  const users = [
    {
      name: 'Admin User',
      email: 'admin@erp.com',
      password: 'Admin@123',
      role: 'ADMIN' as const,
    },
    {
      name: 'Sales User',
      email: 'sales@erp.com',
      password: 'Sales@123',
      role: 'SALES' as const,
    },
    {
      name: 'Warehouse User',
      email: 'warehouse@erp.com',
      password: 'Ware@123',
      role: 'WAREHOUSE' as const,
    },
    {
      name: 'Accounts User',
      email: 'accounts@erp.com',
      password: 'Acct@123',
      role: 'ACCOUNTS' as const,
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    createdUsers[u.role] = user.id;
    console.log(`  ✅ User: ${u.email} (${u.role})`);
  }

  const adminId = createdUsers['ADMIN'];

  // ── Customers ───────────────────────────────────────────
  const customers = [
    {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@wholesaleco.com',
      businessName: 'Wholesale Co.',
      gstNumber: '29ABCDE1234F1Z5',
      customerType: 'WHOLESALE' as const,
      address: '45 MG Road, Bengaluru, Karnataka',
      status: 'ACTIVE' as const,
      notes: 'High-value client, prefers bulk orders.',
    },
    {
      name: 'Priya Sharma',
      mobile: '9988776655',
      email: 'priya@retailstore.in',
      businessName: 'Priya Retail Store',
      customerType: 'RETAIL' as const,
      address: '12 Nehru Street, Chennai, Tamil Nadu',
      status: 'ACTIVE' as const,
      notes: 'Regular monthly orders.',
    },
    {
      name: 'Amit Distributors',
      mobile: '8877665544',
      businessName: 'Amit & Sons Distributors',
      gstNumber: '27XYZAB5678G1Z3',
      customerType: 'DISTRIBUTOR' as const,
      address: '78 APMC Yard, Mumbai, Maharashtra',
      status: 'LEAD' as const,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Contacted via trade fair. Follow up on pricing.',
    },
    {
      name: 'Sunita Verma',
      mobile: '7766554433',
      email: 'sunita@greenmart.com',
      businessName: 'Green Mart',
      customerType: 'RETAIL' as const,
      address: '33 Civil Lines, Jaipur, Rajasthan',
      status: 'INACTIVE' as const,
      notes: 'Last order 6 months ago. Re-engage.',
    },
  ];

  const customerIds: string[] = [];
  for (const c of customers) {
    const customer = await prisma.customer.create({ data: c });
    customerIds.push(customer.id);
    console.log(`  ✅ Customer: ${c.name}`);
  }

  // Add follow-up notes
  await prisma.customerFollowup.createMany({
    data: [
      {
        customerId: customerIds[0],
        note: 'Called regarding Q1 order. Confirmed 500 units of Product A.',
        createdBy: adminId,
      },
      {
        customerId: customerIds[2],
        note: 'Sent pricing brochure via email. Awaiting response.',
        createdBy: adminId,
      },
    ],
  });

  // ── Products ────────────────────────────────────────────
  const products = [
    {
      name: 'Premium Basmati Rice (25kg)',
      sku: 'RICE-BAS-25',
      category: 'Food Grains',
      unitPrice: 1850,
      currentStock: 120,
      minStockQty: 20,
      warehouseLocation: 'A-01',
    },
    {
      name: 'Refined Sunflower Oil (15L)',
      sku: 'OIL-SFW-15',
      category: 'Edible Oils',
      unitPrice: 1420,
      currentStock: 75,
      minStockQty: 15,
      warehouseLocation: 'B-03',
    },
    {
      name: 'Toor Dal (50kg)',
      sku: 'DAL-TOOR-50',
      category: 'Pulses',
      unitPrice: 3200,
      currentStock: 8,
      minStockQty: 10,
      warehouseLocation: 'A-04',
    },
    {
      name: 'Sugar (50kg)',
      sku: 'SUGAR-50',
      category: 'Sugar & Sweeteners',
      unitPrice: 1950,
      currentStock: 200,
      minStockQty: 25,
      warehouseLocation: 'C-01',
    },
    {
      name: 'Wheat Flour Maida (50kg)',
      sku: 'FLOUR-MAIDA-50',
      category: 'Food Grains',
      unitPrice: 1650,
      currentStock: 3,
      minStockQty: 10,
      warehouseLocation: 'A-02',
    },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const product = await prisma.product.create({ data: p });
    productIds.push(product.id);

    // Log initial stock as IN movement
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: product.currentStock,
        movementType: 'IN',
        reason: 'Initial stock entry',
        createdBy: adminId,
      },
    });
    console.log(`  ✅ Product: ${p.name} (Stock: ${p.currentStock})`);
  }

  // ── Challans ─────────────────────────────────────────────
  const challan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260910-0001',
      customerId: customerIds[0],
      customerSnapshot: {
        name: 'Rajesh Kumar',
        mobile: '9876543210',
        businessName: 'Wholesale Co.',
        gstNumber: '29ABCDE1234F1Z5',
      },
      status: 'CONFIRMED',
      totalQty: 10,
      totalAmount: 18500,
      createdBy: adminId,
      items: {
        create: [
          {
            productId: productIds[0],
            productSnapshot: {
              name: 'Premium Basmati Rice (25kg)',
              sku: 'RICE-BAS-25',
              category: 'Food Grains',
            },
            quantity: 10,
            unitPrice: 1850,
            totalPrice: 18500,
          },
        ],
      },
    },
  });

  // Deduct stock for this confirmed challan
  await prisma.product.update({
    where: { id: productIds[0] },
    data: { currentStock: { decrement: 10 } },
  });
  await prisma.stockMovement.create({
    data: {
      productId: productIds[0],
      quantity: 10,
      movementType: 'OUT',
      reason: `Challan #${challan.challanNumber}`,
      createdBy: adminId,
    },
  });
  console.log(`  ✅ Challan: ${challan.challanNumber} (CONFIRMED)`);

  // Draft challan
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260910-0002',
      customerId: customerIds[1],
      customerSnapshot: {
        name: 'Priya Sharma',
        mobile: '9988776655',
        businessName: 'Priya Retail Store',
      },
      status: 'DRAFT',
      totalQty: 5,
      totalAmount: 7100,
      createdBy: adminId,
      items: {
        create: [
          {
            productId: productIds[1],
            productSnapshot: {
              name: 'Refined Sunflower Oil (15L)',
              sku: 'OIL-SFW-15',
              category: 'Edible Oils',
            },
            quantity: 5,
            unitPrice: 1420,
            totalPrice: 7100,
          },
        ],
      },
    },
  });
  console.log('  ✅ Challan: CH-20260910-0002 (DRAFT)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  admin@erp.com     / Admin@123');
  console.log('  sales@erp.com     / Sales@123');
  console.log('  warehouse@erp.com / Ware@123');
  console.log('  accounts@erp.com  / Acct@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
