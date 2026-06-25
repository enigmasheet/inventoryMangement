export const CACHE_TAGS = {
  dashboard: (tenantId: string) => `dashboard-${tenantId}`,
  products: (tenantId: string) => `products-${tenantId}`,
  stockTake: (tenantId: string) => `stock-take-${tenantId}`,
  settings: (tenantId: string) => `settings-${tenantId}`,
} as const;
