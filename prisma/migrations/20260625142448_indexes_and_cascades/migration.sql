-- Add inviteCode and createdById to Tenant
ALTER TABLE "Tenant" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "createdById" TEXT;
CREATE UNIQUE INDEX "Tenant_inviteCode_key" ON "Tenant"("inviteCode");

-- Add showFinancials to Tenant
ALTER TABLE "Tenant" ADD COLUMN "showFinancials" BOOLEAN NOT NULL DEFAULT true;

-- Add unique constraint for AttributeDefinition tenantId+key
CREATE UNIQUE INDEX "AttributeDefinition_tenantId_key_key" ON "AttributeDefinition"("tenantId", "key");

-- Add FK for Tenant.createdById
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add FK cascade deletes for StockMovement -> Product
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey",
ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK cascade deletes for StockTakeItem -> Product
ALTER TABLE "StockTakeItem" DROP CONSTRAINT "StockTakeItem_productId_fkey",
ADD CONSTRAINT "StockTakeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add missing indexes
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX "ProductAttributeValue_attributeDefId_idx" ON "ProductAttributeValue"("attributeDefId");
CREATE INDEX "StockTakeItem_productId_idx" ON "StockTakeItem"("productId");