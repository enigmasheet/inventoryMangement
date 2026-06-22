import { getSession } from "@/lib/session";
import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";
import { Package, TrendingUp, Bell, Settings, Store, ArrowRight, LayoutDashboard, BarChart3, Shield, Zap, Users } from "lucide-react";

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
  const session = await getSession();

  let tenantSlug: string | null = null;
  if (session?.user.tenantId) {
    const { prisma } = await import("@/lib/db");
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    });
    if (tenant) tenantSlug = tenant.slug;
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-card">
        <div className="flex h-12 items-center px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Image src="/web/icons8-inventory-arcade-32.png" alt="" width={32} height={32} className="size-7" priority unoptimized />
            <span className="font-heading font-bold text-sm tracking-widest uppercase">Sajilo Inventory</span>
          </div>
          <div className="ml-auto">
            {tenantSlug ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${tenantSlug}/dashboard`}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
                <SignOutButton />
              </div>
            ) : session?.user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-1.5 border bg-card px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:bg-muted transition-all"
                >
                  <Users className="size-3.5" />
                  Join Shop
                </Link>
                <Link
                  href="/create-shop"
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  <Store className="size-3.5" />
                  Create Shop
                </Link>
                <SignOutButton />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
          <div className="relative flex flex-col items-center justify-center px-4 py-20 sm:py-28 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 border bg-card px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
                <Package className="size-3.5 text-primary" />
                Multitenant Inventory
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight uppercase text-balance leading-[1.1]">
                Manage your shop&apos;s inventory,{" "}
                <span className="text-primary">your way</span>
              </h1>
              <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-balance leading-relaxed">
                Track stock movements, define custom product attributes, and get
                low-stock alerts — all in one place, across all your shops.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {tenantSlug ? (
                  <Link
                    href={`/${tenantSlug}/dashboard`}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                ) : session?.user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/join"
                      className="inline-flex items-center gap-2 border bg-card px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-muted transition-all"
                    >
                      <Users className="size-4" />
                      Join Shop
                    </Link>
                    <Link
                      href="/create-shop"
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                    >
                      <Store className="size-4" />
                      Create Shop
                    </Link>
                  </div>
                ) : (
                  <SignInButton />
                )}
              </div>
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

        <section className="border-t py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10 space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider">
                How It Works
              </h2>
              <p className="font-sans text-sm text-muted-foreground">
                From sign-up to stock tracking in four simple steps.
              </p>
            </div>
            <div className="relative grid gap-6 sm:grid-cols-4">
              <div className="hidden sm:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-border" />
              {[
                { step: 1, icon: "01", title: "Sign In", desc: "Use your Google account — no passwords to remember." },
                { step: 2, icon: "02", title: "Create Shop", desc: "Name your shop, pick a category, and get an invite code." },
                { step: 3, icon: "03", title: "Add Products", desc: "Define custom fields, set prices, and stock quantities." },
                { step: 4, icon: "04", title: "Track & Manage", desc: "Record movements, get low-stock alerts, and view insights." },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-center text-center space-y-3 p-4">
                  <div className="size-10 flex items-center justify-center bg-primary/10 text-primary font-heading font-bold text-sm z-10">
                    {item.icon}
                  </div>
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider">{item.title}</h3>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16 border-b-0">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10 space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider">
                Why Sajilo Inventory?
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { icon: Shield, title: "Data Isolation", desc: "Each shop's data is fully isolated. Your products, stock, and settings stay private." },
                { icon: Zap, title: "Fast Setup", desc: "Sign in with Google, create your shop, and start adding products in under a minute." },
                { icon: BarChart3, title: "Real-Time Insights", desc: "Dashboard updates instantly with every stock movement. Know your numbers at a glance." },
              ].map((item) => (
                <div key={item.title} className="text-center space-y-3 p-6">
                  <div className="size-10 flex items-center justify-center bg-primary/10 mx-auto">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider">{item.title}</h3>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10 space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { q: "What is Sajilo Inventory?", a: "A multitenant inventory system for small shops. Track stock, define custom product fields, and manage everything from one dashboard." },
                { q: "How does data isolation work?", a: "Each shop's data is completely separate. Products, stock movements, and settings from one shop are never visible to another." },
                { q: "Can I customise product fields?", a: "Yes. Add custom attributes like expiry dates, sizes, colors — any field your shop needs — without writing code." },
                { q: "How do I add team members?", a: "The owner generates an invite code from Settings. Share it with your team — they sign in with Google and join with one click." },
                { q: "Is my data secure?", a: "Yes. Authentication uses Google OAuth, and every query is scoped to your shop. Your data stays private and isolated." },
                { q: "Can I use it on my phone?", a: "The app is fully responsive and can be installed as a PWA, giving you a native-like experience on any device." },
              ].map((faq) => (
                <div key={faq.q} className="border bg-card p-4 space-y-2">
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                    {faq.q}
                  </h3>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16 sm:py-20 bg-card">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider">
              Ready to get started?
            </h2>
            <p className="font-sans text-sm text-muted-foreground">
              Sign in with Google and create your shop in under a minute.
            </p>
            <div className="pt-2">
              {tenantSlug ? (
                <Link
                  href={`/${tenantSlug}/dashboard`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Go to Dashboard
                  <ArrowRight className="size-4" />
                </Link>
              ) : session?.user ? (
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/join"
                    className="inline-flex items-center gap-2 border bg-card px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-muted transition-all"
                  >
                    <Users className="size-4" />
                    Join Shop
                  </Link>
                  <Link
                    href="/create-shop"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                  >
                    <Store className="size-4" />
                    Create Shop
                  </Link>
                </div>
              ) : (
                <SignInButton />
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 bg-card">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-sans text-muted-foreground">
          Sajilo Inventory — Multitenant Inventory Management
        </div>
      </footer>
    </div>
  );
}
