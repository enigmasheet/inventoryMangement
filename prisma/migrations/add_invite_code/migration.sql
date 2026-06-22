ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "inviteCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_inviteCode_key" ON "Tenant"("inviteCode");
