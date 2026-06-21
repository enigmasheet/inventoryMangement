import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateShopForm } from "@/components/create-shop-form";
import { Store } from "lucide-react";

export default async function CreateShopPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.tenantId) {
    const { prisma } = await import("@/lib/db");
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });
    if (tenant) {
      redirect(`/${tenant.slug}/dashboard`);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="size-10 flex items-center justify-center bg-primary text-primary-foreground mx-auto font-heading text-sm font-bold tracking-wider">
            <Store className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wider uppercase">Create Your Shop</h1>
            <p className="text-sm font-sans text-muted-foreground mt-1">
              Set up your inventory management workspace
            </p>
          </div>
        </div>
        <CreateShopForm />
      </div>
    </div>
  );
}
