import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Package, Settings, ClipboardList } from "lucide-react";
import { createLogger } from "@/lib/logger";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const log = createLogger("layout:tenant");

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stock-take", label: "Stock Take", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await getSession();

  if (!session?.user.tenantId) {
    log.warn("tenant layout redirect — no tenantId in session", { tenantSlug });
    redirect("/");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });
  if (!tenant || tenant.id !== session.user.tenantId) {
    log.warn("tenant layout redirect — tenant mismatch", { tenantSlug, sessionTenantId: session.user.tenantId });
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="flex h-12 items-center px-4 sm:px-6 gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 shrink-0">
            <Image src="/web/icons8-inventory-arcade-32.png" alt="" width={32} height={32} className="size-7" />
            <Link
              href={`/${tenantSlug}/dashboard`}
              className="font-heading font-bold text-sm tracking-widest uppercase hover:text-primary transition-colors"
            >
              {tenant.shopName}
            </Link>
            <span className="hidden sm:inline text-[10px] font-heading font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5">
              {tenant.category}
            </span>
          </div>
          <nav className="ml-auto flex items-center gap-0.5 text-xs">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${tenantSlug}${item.href}`}
                className="flex items-center gap-1 px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 font-heading font-bold uppercase tracking-wider"
              >
                <item.icon className="size-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 pl-2 border-l">
            <span className="hidden sm:block text-[11px] font-sans text-muted-foreground max-w-28 truncate">
              {session.user.email}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="main-content" className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
