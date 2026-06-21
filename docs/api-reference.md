# API Reference

The system has two kinds of API surfaces:
1. **Server Actions** — form-driven mutations called from client components
2. **API Routes** — HTTP GET endpoints for CSV export and auth

---

## Server Actions

All Server Actions share these patterns:
- Authenticate via `auth.api.getSession({ headers: await headers() })`
- Scope queries by `session.user.tenantId` using `findFirst`
- Return `{ error?: string } | null` for internal functions
- Void-wrapped (`actionFoo`) for `<form action>` compatibility
- Log with structured logger (`createLogger`)
- Call `revalidatePath` after successful mutations

### Products (`src/app/actions/products.ts`)

#### `createProduct(tenantSlug, prevState, formData)`
- **Type**: `<form action>` action
- **Form fields**: `name`, `sku`, `unitPrice`, `costPrice`, `quantity`, `lowStockLimit`, `unit`, `attr_*`
- **Validation**: Zod schema — name required (max 200), sku required (max 50), prices ≥ 0, quantity integer ≥ 0
- **Behavior**: Creates product with nested attribute values, wraps in `$transaction`, revalidates `/products` and `/dashboard`, redirects to product list
- **Returns**: `{ error?: string } | null`

#### `updateProduct(tenantSlug, productId, prevState, formData)`
- **Type**: Server Action (used with `useActionState`)
- **Form fields**: Same as create
- **Behavior**: Finds product within tenant scope, deletes all existing attribute values, creates new ones in `$transaction`
- **Returns**: `{ error?: string } | null`

#### `deleteProduct(productId, tenantSlug)`
- **Type**: Direct async call (not as `<form action>`)
- **Behavior**: Finds product within tenant scope, deletes attribute values + stock movements + product in `$transaction`, revalidates list and dashboard
- **Returns**: `{ error?: string } | null`

### Stock Movements (`src/app/actions/stock.ts`)

#### `recordMovement(tenantSlug, productId, prevState, formData)`
- **Type**: Server Action (used with `useActionState`)
- **Form fields**: `type` (IN/OUT), `quantity` (positive int), `note` (optional, max 500)
- **Validation**: Zod — IN/OUT enum, quantity positive int, note max 500
- **Guard**: OUT movements check `product.quantity >= requested`
- **Transaction**: Creates movement + updates product quantity atomically
- **Returns**: `{ error?: string } | null`

### Attributes (`src/app/actions/attributes.ts`)

#### `createAttribute(prevState, formData)`
- **Type**: `<form action>` action
- **Form fields**: `key` (1-50 chars), `label` (1-100 chars), `type` (text/number/date)
- **Validation**: Zod — key min 1 max 50, label min 1 max 100, type must be text|number|date
- **Duplicate guard**: Catches Prisma P2002, returns user-friendly "already exists" error
- **Returns**: `{ error?: string } | null`

#### `updateAttribute(attributeId, prevState, formData)`
- **Type**: Server Action (used with `useActionState`)
- **Form fields**: Same as create
- **Behavior**: Finds definition within tenant scope, updates fields
- **Duplicate guard**: Same as create
- **Returns**: `{ error?: string } | null`

#### `deleteAttributeAction(attributeId)`
- **Type**: `<form action>` action (void wrapper around `_deleteAttribute`)
- **Behavior**: Finds definition within tenant scope, deletes all associated attribute values first, then the definition itself, in a `$transaction`
- **Returns**: `void`

### Stock Takes (`src/app/actions/stock-take.ts`)

#### `startStockTakeAction(tenantSlug)`
- **Type**: Direct async call
- **Behavior**: Checks no active stock take exists, snapshots all product quantities into StockTakeItems, creates StockTake + items in `$transaction`, redirects to stock take detail page
- **On error**: Redirects to `/[tenantSlug]/stock-take?error=...`
- **Returns**: `void`

#### `updateStockTakeItem(tenantSlug, itemId, prevState, formData)`
- **Type**: Server Action (used with `useActionState`)
- **Form fields**: `countedQuantity` (integer ≥ 0)
- **Validation**: Zod — countedQuantity integer min 0
- **Guard**: Stock take must be `in_progress`
- **Returns**: `{ error?: string } | null`

#### `completeStockTakeAction(tenantSlug, stockTakeId, applyAdjustments)`
- **Type**: Direct async call
- **Behavior**: All items must be counted, optionally adjusts product quantities + creates StockMovement records in `$transaction`, revalidates dashboard/stock-take pages
- **On error**: Redirects to `/[tenantSlug]/stock-take/[id]?error=...`
- **Returns**: `void`

#### `cancelStockTakeAction(tenantSlug, stockTakeId)`
- **Type**: Direct async call
- **Behavior**: Stock take must be `in_progress`, sets status to `cancelled`, revalidates
- **On error**: Redirects to stock take detail with `?error=`
- **Returns**: `void`

### Shop Creation (`src/app/actions.ts`)

#### `createShop(prevState, formData)`
- **Type**: `<form action>` action
- **Form fields**: `shopName` (1-100 chars), `category` (1+ chars)
- **Behavior**: Slugifies shop name, handles slug collisions (appends random suffix), creates Tenant, updates user's `tenantId`, redirects to new tenant dashboard
- **Returns**: `{ error?: string } | null`

---

## API Routes

### Better Auth Handler

```
ANY /api/auth/[...all]
```

- Handles all Better Auth routes: `/api/auth/callback/google`, `/api/auth/sign-in`, `/api/auth/sign-out`, etc.
- Configured in `src/app/api/auth/[...all]/route.ts`
- Delegates to `auth.handler`

### CSV Export

#### Products Export

```
GET /api/export/products/[tenantSlug]
```

- **Auth**: Requires valid session with matching tenantId
- **Response**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename=products.csv`
- **Columns**: Name, SKU, Selling Price, Cost Price, Quantity, Unit, Low Stock Limit
- **Status codes**: `401` (unauthorized), `404` (tenant not found)

#### Movements Export

```
GET /api/export/movements/[tenantSlug]
```

- **Auth**: Requires valid session with matching tenantId  
- **Response**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename=movements.csv`
- **Columns**: Product, Type, Quantity, Note, Date
- **Status codes**: `401` (unauthorized), `404` (tenant not found)

---

## Error Handling Pattern

All Server Actions follow this error contract:

```typescript
// Internal function → return error object
async function _doSomething(): Promise<{ error?: string } | null> {
  if (!session) return { error: "Unauthorized" };
  if (!found) return { error: "Not found" };
  return null; // success
}

// Public wrapper → redirect on error
export async function doSomethingAction(slug: string): Promise<void> {
  const result = await _doSomething();
  if (result?.error) redirect(`/${slug}/path?error=${encodeURIComponent(result.error)}`);
}

// Or with useActionState → return error to be displayed by client
export async function doSomethingForm(prev: { error?: string } | null, fd: FormData):
  Promise<{ error?: string } | null> {
  // ... return { error } or null
}
```

Client components use either:
- `useActionState` to display errors inline as toast/sonner messages
- `?error=` URL parameter for redirect-based error display
- Direct `router.refresh()` after successful non-redirect mutations
