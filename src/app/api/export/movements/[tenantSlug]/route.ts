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

  const movements = await prisma.stockMovement.findMany({
    where: { tenantId: tenant.id },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = "Date,Product,SKU,Type,Quantity,Note";
  const rows = movements.map(
    (m) =>
      `"${m.createdAt.toISOString().split("T")[0]}","${m.product.name}","${m.product.sku}",${m.type},${m.quantity},"${m.note ?? ""}"`
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=movements.csv",
    },
  });
}
