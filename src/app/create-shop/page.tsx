import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateShopForm } from "@/components/create-shop-form";
import { Store, ArrowLeft, Users } from "lucide-react";

export default async function CreateShopPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.tenantId) {
    const { prisma } = await import("@/lib/db");
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    });
    if (tenant) {
      redirect(`/${tenant.slug}/dashboard`);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          Back
        </Link>
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
        <p className="text-center text-xs font-sans text-muted-foreground">
          Already have an invite code?{" "}
          <Link href="/join" className="text-primary hover:underline font-heading font-bold uppercase tracking-wider inline-flex items-center gap-1">
            <Users className="size-3" />
            Join a shop
          </Link>
        </p>
      </div>
    </div>
  );
}
