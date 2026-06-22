import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AttributeDefForm } from "@/components/attribute-def-form";
import { AttributeDefEditDialog } from "@/components/attribute-def-edit-dialog";
import { deleteAttributeAction } from "@/app/actions/attributes";
import { InviteCodeSection } from "@/components/invite-code-section";
import { MemberListSection } from "@/components/member-list-section";
import { ToggleFinancials } from "@/components/toggle-financials";
import { SettingsError } from "@/components/settings-error";
import { Button } from "@/components/ui/button";
import { Sliders, Trash2 } from "lucide-react";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { tenantSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.tenantId) redirect("/");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, id: session.user.tenantId },
    select: {
      id: true,
      slug: true,
      inviteCode: true,
      createdById: true,
      showFinancials: true,
    },
  });
  if (!tenant) redirect("/");

  const defs = await prisma.attributeDefinition.findMany({
    where: { tenantId: tenant.id },
    orderBy: { id: "asc" },
  });

  const isOwner = tenant.createdById === session.user.id;

  const members = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <SettingsError error={error} />
      <h1 className="font-heading font-bold text-lg tracking-wider uppercase">Settings</h1>

      {isOwner && (
        <>
          <InviteCodeSection initialCode={tenant.inviteCode} />
          <ToggleFinancials initialValue={tenant.showFinancials} />
          <MemberListSection members={members} ownerId={tenant.createdById!} />
        </>
      )}

      <div className="border bg-card p-4 space-y-5">
        <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Add a Field</h3>
        <AttributeDefForm />
      </div>

      {defs.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Existing Fields <span className="font-mono" data-number>({defs.length})</span>
          </h3>
          <div className="space-y-2">
            {defs.map((def) => (
              <div
                key={def.id}
                className="group flex items-center justify-between border bg-card px-4 py-3 hover:shadow-sm transition-all"
              >
                <div className="space-y-0.5">
                  <p className="font-sans text-sm font-medium">{def.label}</p>
                  <p className="text-xs font-sans text-muted-foreground">
                    <code className="font-mono text-[10px] bg-muted px-1 py-0.5" data-number>{def.key}</code>
                    <span className="mx-1">&middot;</span>
                    {def.type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <AttributeDefEditDialog def={def} />
                  <form action={deleteAttributeAction.bind(null, def.id)}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center space-y-4">
          <Sliders className="size-10 mx-auto text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="font-sans font-semibold">No custom fields yet</p>
            <p className="text-sm font-sans text-muted-foreground">
              Add one above to start capturing extra product details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
