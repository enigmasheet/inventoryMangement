import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/*
 * Demo seed for two tenants.
 *
 * USAGE: pnpm seed
 *
 * After running, sign in via Google, then run:
 *   UPDATE "User" SET "tenantId" = '<printed-tenant-id>' WHERE email = 'your-email@example.com';
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const LIQUOR_SLUG = "liquor-shop";
const BIKE_SLUG = "bike-shop";

async function main() {
  console.log("Seeding demo data...\n");

  await prisma.stockMovement.deleteMany({
    where: { product: { tenant: { slug: { in: [LIQUOR_SLUG, BIKE_SLUG] } } } },
  });
  await prisma.productAttributeValue.deleteMany({
    where: { product: { tenant: { slug: { in: [LIQUOR_SLUG, BIKE_SLUG] } } } },
  });
  await prisma.product.deleteMany({
    where: { tenant: { slug: { in: [LIQUOR_SLUG, BIKE_SLUG] } } },
  });
  await prisma.attributeDefinition.deleteMany({
    where: { tenant: { slug: { in: [LIQUOR_SLUG, BIKE_SLUG] } } },
  });
  await prisma.tenant.deleteMany({
    where: { slug: { in: [LIQUOR_SLUG, BIKE_SLUG] } },
  });

  // ===== LIQUOR SHOP =====
  const liquor = await prisma.tenant.create({
    data: { slug: LIQUOR_SLUG, shopName: "Liquor Shop", category: "liquor" },
  });

  const liqExpiry = await prisma.attributeDefinition.create({
    data: { tenantId: liquor.id, key: "expiryDate", label: "Expiry Date", type: "date" },
  });
  const liqVolume = await prisma.attributeDefinition.create({
    data: { tenantId: liquor.id, key: "volume", label: "Volume (ml)", type: "number" },
  });
  const liqAlc = await prisma.attributeDefinition.create({
    data: { tenantId: liquor.id, key: "alcoholPercentage", label: "Alcohol %", type: "number" },
  });

  const whisky = await prisma.product.create({
    data: {
      tenantId: liquor.id, name: "Whisky", sku: "WHISKY-001",
      unitPrice: 45.00, costPrice: 32.00, quantity: 12, lowStockLimit: 5, unit: "bottle",
    },
  });
  await prisma.productAttributeValue.createMany({
    data: [
      { productId: whisky.id, attributeDefId: liqExpiry.id, value: "2027-06-01" },
      { productId: whisky.id, attributeDefId: liqVolume.id, value: "750" },
      { productId: whisky.id, attributeDefId: liqAlc.id, value: "40" },
    ],
  });

  const vodka = await prisma.product.create({
    data: {
      tenantId: liquor.id, name: "Vodka", sku: "VODKA-001",
      unitPrice: 30.00, costPrice: 20.00, quantity: 3, lowStockLimit: 5, unit: "bottle",
    },
  });
  await prisma.productAttributeValue.createMany({
    data: [
      { productId: vodka.id, attributeDefId: liqExpiry.id, value: "2028-03-15" },
      { productId: vodka.id, attributeDefId: liqVolume.id, value: "1000" },
      { productId: vodka.id, attributeDefId: liqAlc.id, value: "37.5" },
    ],
  });

  await prisma.stockMovement.createMany({
    data: [
      { tenantId: liquor.id, productId: whisky.id, type: "IN", quantity: 20, note: "Initial stock" },
      { tenantId: liquor.id, productId: whisky.id, type: "OUT", quantity: 5, note: "Sold to customer" },
      { tenantId: liquor.id, productId: whisky.id, type: "OUT", quantity: 3, note: "Bar order" },
      { tenantId: liquor.id, productId: vodka.id, type: "IN", quantity: 15, note: "Initial stock" },
      { tenantId: liquor.id, productId: vodka.id, type: "OUT", quantity: 10, note: "Sold to customer" },
      { tenantId: liquor.id, productId: vodka.id, type: "OUT", quantity: 2, note: "Restaurant supply" },
    ],
  });

  // ===== BICYCLE SHOP =====
  const bike = await prisma.tenant.create({
    data: { slug: BIKE_SLUG, shopName: "Bicycle Shop", category: "bicycle" },
  });

  const bikeSize = await prisma.attributeDefinition.create({
    data: { tenantId: bike.id, key: "frameSize", label: "Frame Size (inches)", type: "number" },
  });
  const bikeColor = await prisma.attributeDefinition.create({
    data: { tenantId: bike.id, key: "color", label: "Color", type: "text" },
  });
  const bikeWeight = await prisma.attributeDefinition.create({
    data: { tenantId: bike.id, key: "weight", label: "Weight (kg)", type: "number" },
  });

  const mtb = await prisma.product.create({
    data: {
      tenantId: bike.id, name: "Mountain Bike", sku: "MTB-001",
      unitPrice: 650.00, costPrice: 420.00, quantity: 2, lowStockLimit: 3, unit: "pcs",
    },
  });
  await prisma.productAttributeValue.createMany({
    data: [
      { productId: mtb.id, attributeDefId: bikeSize.id, value: "29" },
      { productId: mtb.id, attributeDefId: bikeColor.id, value: "Matte Black" },
      { productId: mtb.id, attributeDefId: bikeWeight.id, value: "14.5" },
    ],
  });

  const road = await prisma.product.create({
    data: {
      tenantId: bike.id, name: "Road Bike", sku: "ROAD-001",
      unitPrice: 1200.00, costPrice: 850.00, quantity: 0, lowStockLimit: 2, unit: "pcs",
    },
  });
  await prisma.productAttributeValue.createMany({
    data: [
      { productId: road.id, attributeDefId: bikeSize.id, value: "56" },
      { productId: road.id, attributeDefId: bikeColor.id, value: "Red" },
      { productId: road.id, attributeDefId: bikeWeight.id, value: "8.2" },
    ],
  });

  await prisma.stockMovement.createMany({
    data: [
      { tenantId: bike.id, productId: mtb.id, type: "IN", quantity: 5, note: "Supplier order" },
      { tenantId: bike.id, productId: mtb.id, type: "OUT", quantity: 3, note: "Sold" },
      { tenantId: bike.id, productId: road.id, type: "IN", quantity: 2, note: "Initial stock" },
      { tenantId: bike.id, productId: road.id, type: "OUT", quantity: 2, note: "Sold out" },
    ],
  });

  console.log("=== DEMO TENANTS CREATED ===\n");
  console.log(`1. ${liquor.shopName} (slug: ${liquor.slug})`);
  console.log(`   Tenant ID: ${liquor.id}`);
  console.log(`   URL: http://localhost:3000/${liquor.slug}/dashboard`);
  console.log(`   Products: Whisky (qty 12 bottles, low-stock limit 5), Vodka (qty 3, low-stock!)`);
  console.log();
  console.log(`2. ${bike.shopName} (slug: ${bike.slug})`);
  console.log(`   Tenant ID: ${bike.id}`);
  console.log(`   URL: http://localhost:3000/${bike.slug}/dashboard`);
  console.log(`   Products: Mountain Bike (qty 2, low-stock!), Road Bike (qty 0, out of stock!)`);
  console.log();
  console.log("After signing in via Google, link your user to a tenant:");
  console.log(`  UPDATE "User" SET "tenantId" = '${liquor.id}' WHERE email = 'your@email.com';`);
  console.log(`  or: UPDATE "User" SET "tenantId" = '${bike.id}' WHERE email = 'your@email.com';`);
  console.log();

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});
