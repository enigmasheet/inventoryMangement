import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { Package, TrendingUp, Bell, Settings } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Inventory Tracking",
    description: "Track products, stock levels, and movement history in real time.",
  },
  {
    icon: Settings,
    title: "Custom Attributes",
    description: "Define your own product fields — expiry dates, sizes, colors, or anything else.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard Insights",
    description: "See total stock value, low-stock alerts, and profit at a glance.",
  },
  {
    icon: Bell,
    title: "Low-Stock Alerts",
    description: "Get notified when products hit your custom low-stock thresholds.",
  },
];

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.tenantId) {
    const tenant = await import("@/lib/db").then(({ prisma }) =>
      prisma.tenant.findUnique({ where: { id: session.user.tenantId! } })
    );
    if (tenant) {
      redirect(`/${tenant.slug}/dashboard`);
    }
  }

  if (session?.user && !session.user.tenantId) {
    redirect("/create-shop");
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-card">
        <div className="flex h-12 items-center px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="size-7 flex items-center justify-center bg-primary text-primary-foreground font-heading text-xs font-bold tracking-wider">
              SP
            </div>
            <span className="font-heading font-bold text-sm tracking-widest uppercase">StockPilot</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-4 py-20 sm:py-28 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 border bg-card px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
              <Package className="size-3.5 text-primary" />
              Multitenant Inventory
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight uppercase text-balance">
              Manage your shop&apos;s inventory,{" "}
              <span className="text-primary">your way</span>
            </h1>
            <p className="font-sans text-base text-muted-foreground max-w-lg mx-auto text-balance">
              Track stock movements, define custom product attributes, and get
              low-stock alerts — all in one place.
            </p>
            <div className="pt-4">
              <SignInButton />
            </div>
          </div>
        </section>

        <section className="border-t py-16 sm:py-20 bg-card">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10 space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider">
                Everything you need
              </h2>
              <p className="font-sans text-sm text-muted-foreground">
                Built for small business owners who value simplicity.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group border bg-background p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex gap-3">
                    <div className="size-9 flex items-center justify-center bg-primary/10 shrink-0">
                      <f.icon className="size-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-xs uppercase tracking-wider">{f.title}</h3>
                      <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider">
              Ready to get started?
            </h2>
            <p className="font-sans text-sm text-muted-foreground">
              Sign in with Google and create your shop in under a minute.
            </p>
            <SignInButton />
          </div>
        </section>
      </main>

      <footer className="border-t py-6 bg-card">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-sans text-muted-foreground">
          StockPilot — Multitenant Inventory Management
        </div>
      </footer>
    </div>
  );
}
