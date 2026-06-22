pnpm : Loaded Prisma config from prisma.config.ts.
At line:1 char:1
+ pnpm prisma migrate diff --from-config-datasource --to-schema "prisma ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Loaded Prisma c...isma.config.ts.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "showFinancials" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_tenantId_key_key" ON "AttributeDefinition"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

