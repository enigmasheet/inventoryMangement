import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
  });
  if (!tenant) {
    return new NextResponse("Not found", { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  const header = "Name,SKU,Selling Price,Cost Price,Quantity,Unit,Low Stock Limit";
  const rows = products.map(
    (p) =>
      `"${p.name}","${p.sku}",${p.unitPrice},${p.costPrice},${p.quantity},"${p.unit}",${p.lowStockLimit}`
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=products.csv",
    },
  });
}
