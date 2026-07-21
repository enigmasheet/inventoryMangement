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
    select: { id: true },
  });
  if (!tenant) {
    return new NextResponse("Not found", { status: 404 });
  }

  const MAX_EXPORT = 10000;
  const total = await prisma.stockMovement.count({ where: { tenantId: tenant.id } });
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId: tenant.id },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT,
  });

  const header = "Date,Product,SKU,Type,Quantity,Note";
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = movements.map(
    (m) =>
      `${esc(m.createdAt.toISOString().split("T")[0])},${esc(m.product.name)},${esc(m.product.sku)},${m.type},${m.quantity},${esc(m.note ?? "")}`
  );
  const truncated = total > MAX_EXPORT ? `# Note: Export limited to ${MAX_EXPORT} of ${total} movements.\n` : "";
  const csv = [header, ...rows, truncated].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=movements.csv",
    },
  });
}
