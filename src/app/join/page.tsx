import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JoinShopForm } from "@/components/join-shop-form";
import { Users, ArrowLeft } from "lucide-react";

export default async function JoinShopPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { slug: true },
      });
      if (tenant) {
        redirect(`/${tenant.slug}/dashboard`);
      }
    } catch {
      // Tenant lookup failed — show join-shop form
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
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wider uppercase">Join a Shop</h1>
            <p className="text-sm font-sans text-muted-foreground mt-1">
              Enter the invite code shared by the shop owner
            </p>
          </div>
        </div>
        <JoinShopForm />
        <p className="text-center text-xs font-sans text-muted-foreground">
          Don&apos;t have a code?{" "}
          <Link href="/create-shop" className="text-primary hover:underline font-heading font-bold uppercase tracking-wider">
            Create your own shop
          </Link>
        </p>
      </div>
    </div>
  );
}
