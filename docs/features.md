# Features

## Product Catalog

### Product List (`/[tenantSlug]/products`)

A table of all products with key columns:

| Column | Description |
|---|---|
| Name | Linked to product detail page |
| SKU | Monospace badge |
| Sell (unitPrice) | Currency-formatted |
| Cost (costPrice) | Currency-formatted |
| Margin | Percentage with color coding (green = profit, red = loss) |
| Qty | Integer + unit suffix |
| Status | Pill badge: **OK** (green), **Low** (amber), **Out** (red) |

**Actions:**
- **Search** — filters by name via `?q=` query parameter
- **Pagination** — 20 products per page via `?page=` query parameter
- **CSV Export** — downloads `products.csv` via `/api/export/products/[tenantSlug]`
- **New Product** — navigates to product create form
- **Edit / Delete** — per-row buttons (edit navigates to edit form, delete uses confirmation dialog)

### Product Detail (`/[tenantSlug]/products/[productId]`)

Six information cards:
1. **Basic Info** — name, SKU, unit, status pill
2. **Pricing** — unit price, cost price, margin % and amount
3. **Stock** — current quantity, low stock limit
4. **Timestamps** — created at date
5. **Custom Attributes** — list of attribute key-value pairs (e.g., "Expiry Date: 2026-08-15")
6. **Recent Movements** — last 10 stock transactions

**Expiry Warning Strip** — if any date-typed attribute value is within 30 days, a red warning banner appears at the top.

**Movement Form** — record stock IN or OUT directly from the detail page. Validates sufficient stock for OUT movements.

### Product Create/Edit

Both create (`/[tenantSlug]/products/new`) and edit (`/[tenantSlug]/products/[productId]/edit`) use the same form with fields:

- Name (required)
- SKU (required, unique per tenant)
- Unit Price (required, min 0)
- Cost Price (min 0, default 0)
- Quantity (integer, min 0, default 0)
- Low Stock Limit (integer, min 0, default 5)
- Unit (select: pcs, kg, ltr, bottle, pack, box, bag, dozen)
- Custom Attributes — dynamically generated from the tenant's `AttributeDefinition` records

On the edit form, the product's existing attribute values are pre-filled. On create, attribute fields are empty.

### Status Logic

```typescript
const isOut = quantity === 0;
const isLow = quantity <= lowStockLimit && quantity > 0;
```

| Condition | Label | Color |
|---|---|---|
| `quantity === 0` | Out | Red |
| `quantity <= lowStockLimit` | Low | Amber |
| Otherwise | OK | Green |

---

## Stock Movements

### Recording Movements

From the product detail page, a form captures:
- **Type** — IN (stock addition) or OUT (stock removal)
- **Quantity** — positive integer
- **Note** — optional description

### Transactional Guarantee

```typescript
await prisma.$transaction(async (tx) => {
  await tx.stockMovement.create({ data: { ... } });
  await tx.product.update({
    where: { id: productId },
    data: { quantity: type === "IN" ? { increment: qty } : { decrement: qty } },
  });
});
```

Both the movement record and the quantity update happen atomically. If either fails, neither is applied.

### Insufficient Stock Guard

OUT movements are rejected if `product.quantity < requested quantity`:

```typescript
if (parsed.data.type === "OUT" && product.quantity < parsed.data.quantity) {
  return { error: `Insufficient stock. Available: ${product.quantity}` };
}
```

### Movement History

The product detail page shows the 10 most recent movements in reverse chronological order, displaying:
- Type (IN/OUT)
- Quantity
- Note
- Timestamp

---

## Stock Takes

### Purpose

A stock take reconciles the system's expected product quantities against physical counts. Discrepancies can optionally adjust the system quantities.

### Lifecycle

```
1. Start Stock Take ──► 2. Count Products ──► 3. Complete (with/without adjustments)
                              │
                         Cancel ──► Cancelled
```

### Starting a Stock Take

- From the stock take list page (`/[tenantSlug]/stock-take`), click "Start New Stock Take"
- Validates: no active stock take already exists (one at a time)
- Creates a `StockTake` record with status `in_progress`
- Creates `StockTakeItem` records for every product in the tenant, snapshotted with `expectedQuantity = product.quantity`

### Counting

The stock take detail page (`/[tenantSlug]/stock-take/[id]`) shows a table:

| Product | SKU | Expected | Counted | Discrepancy |
|---|---|---|---|---|
| Whisky | WH-001 | 50 | 48 | 2 ✔ |
| Vodka | VD-002 | 30 | — | — (not counted) |

- Users enter counted quantities per row
- Each row auto-saves on input via `useActionState` + debounce
- Discrepancy = `abs(expected - counted)` shown when both values are present

### Completing a Stock Take

- All items must be counted (no null `countedQuantity` values)
- Optional: "Apply adjustments" checkbox
  - If checked: product quantities are updated to match counted values, and stock movements are created for each adjustment
  - If unchecked: the stock take is recorded but no product quantities change
- After completion, products and movements pages are revalidated

### Cancelling a Stock Take

- Cancels an in-progress stock take (sets status to `cancelled`)
- No adjustments are made

---

## Dashboard (`/[tenantSlug]/dashboard`)

### Metric Cards

| Card | Content |
|---|---|
| Total Products | Count of all products |
| Low Stock | Products where `quantity <= lowStockLimit && quantity > 0` |
| Out of Stock | Products where `quantity === 0` |
| Expiring Soon | Products with a date-typed attribute value within 30 days |

Low stock and out-of-stock metrics use raw SQL because Prisma cannot filter on calculated conditions (quantity vs lowStockLimit) easily.

### Low Stock List

Below the metrics, a compact list of products with `quantity <= lowStockLimit`, sorted by ascending quantity. Each item shows:
- Product name (linked to detail)
- Current quantity
- Low stock threshold

### Expiring Soon

Products with date-typed attribute values within 30 days of now. Each item shows:
- Product name
- Expiry date
- Days remaining

### Active Stock Take Card

If a stock take is `in_progress`, a card links directly to `/[tenantSlug]/stock-take/[id]`.

---

## Custom Attributes

### Attribute Definition CRUD

On the settings page (`/[tenantSlug]/settings`), each tenant defines their own attribute schema:

- **Add** — key (programmatic name), label (display name), type (text/number/date)
- **Edit** — change any field; duplicate key validation
- **Delete** — removes the attribute definition AND all associated product attribute values (cascade via `$transaction`)

### Dynamic Forms

The product create/edit form dynamically renders fields based on the tenant's `AttributeDefinition` records. Each attribute type maps to an appropriate input:
- `text` → text input
- `number` → number input
- `date` → date input

### Expiry Detection

The dashboard and product detail page check date-typed attributes specifically. Any value that parses as a date within 30 days triggers an expiry alert.

---

## CSV Export

Two API routes generate CSV files:

### Products Export
```
GET /api/export/products/[tenantSlug]
```
Columns: Name, SKU, Selling Price, Cost Price, Quantity, Unit, Low Stock Limit

### Movements Export
```
GET /api/export/movements/[tenantSlug]
```
Columns: Product, Type, Quantity, Note, Date

Both routes:
- Authenticate via session
- Verify tenant membership
- Return `text/csv` with `Content-Disposition: attachment`

---

## Dark Mode

- **Default**: Dark mode (`#0a0a0a` background)
- **Toggle**: Header button with sun/moon icon
- **Persistence**: Saved to `localStorage.theme`
- **Hydration-safe**: A blocking `<Script>` reads `localStorage` before React hydrates; `suppressHydrationWarning` on `<html>` prevents mismatch

### Implementation

```typescript
// Script in layout.tsx — runs before React
<script
  dangerouslySetInnerHTML={{
    __html: `document.documentElement.classList.toggle('dark', localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches))`,
  }}
  strategy="beforeInteractive"
/>
```

```typescript
// Theme toggle — uses useSyncExternalStore + MutationObserver
const isDark = useSyncExternalStore(subscribe, getSnapshot);
// Toggle adds/removes .dark class on <html>, saves to localStorage
```

### CSS Variable Structure

- `:root` = light mode palette
- `.dark` = dark mode palette (replaces all variables)

---

## PWA (Progressive Web App)

- **Manifest**: `public/manifest.json` with app name, icons, display mode
- **Service Worker**: `public/sw.js` — Network-first strategy with cache fallback
- **Icons**: 192×192 and 512×512 PNGs in `public/icons/`
- **Registration**: Script in root layout registers the SW
- **Installable**: Users can "Add to Home Screen" on supported browsers

---

## Error, Loading & Empty States

### Loading State

A skeleton layout (`loading.tsx`) with pulsing placeholder rectangles matching the page layout.

### Error State

An error boundary (`error.tsx`) with:
- Error icon
- Error message display
- "Try Again" button (calls `reset()`)

### Not Found (404)

A custom not-found page (`not-found.tsx`) per tenant segment with:
- Warning icon
- "Page not found" message
- "Back to Dashboard" link (dynamically scoped to the correct tenant slug)

### Empty States

Pages with no data display illustrative empty states:
- Products: "No products yet. Click 'New Product' to add one."
- Stock takes: "No stock takes yet."
- Dashboard: Guidance to add products first
- Settings: "No custom attributes defined."
