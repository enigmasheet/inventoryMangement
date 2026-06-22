import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const session = await getSession();
  if (!session?.user.tenantId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
    select: { id: true, showFinancials: true, createdById: true, currency: true },
  });
  if (!tenant) {
    return new NextResponse("Not found", { status: 404 });
  }

  const canViewCost = tenant.showFinancials || session.user.id === tenant.createdById;

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, sku: true, unitPrice: true, costPrice: true, quantity: true, unit: true, lowStockLimit: true },
    orderBy: { name: "asc" },
  });

  const header = canViewCost
    ? "Name,SKU,Selling Price,Cost Price,Quantity,Unit,Low Stock Limit"
    : "Name,SKU,Selling Price,Quantity,Unit,Low Stock Limit";
  const rows = products.map((p) =>
    canViewCost
      ? `"${p.name}","${p.sku}",${p.unitPrice},${p.costPrice},${p.quantity},"${p.unit}",${p.lowStockLimit}`
      : `"${p.name}","${p.sku}",${p.unitPrice},${p.quantity},"${p.unit}",${p.lowStockLimit}`
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=products.csv",
    },
  });
}
