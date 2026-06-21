# Setup Guide

A complete walkthrough from zero to running application.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.9+ | Runtime (required by Next.js 16) |
| pnpm | 9+ | Package manager |
| Docker Desktop | Latest | Local PostgreSQL |
| Git | Latest | Version control |
| Google Cloud account | Free | OAuth credentials |

---

## Step 1: Clone & Install

```sh
git clone <repo-url> inventory-management
cd inventory-management
pnpm install
```

This installs all dependencies including Prisma 7, Better Auth, shadcn/ui, Zod, slugify, sonner, etc.

---

## Step 2: Start PostgreSQL

```sh
docker compose up -d
```

This creates a PostgreSQL 17 container (`inventory-db`) on port **5433** with:
- User: `invuser`
- Password: `invpass`
- Database: `inventory`
- Persistent volume: `pgdata` (survives container restarts)

### Verify

```sh
docker compose ps
# Should show "inventory-db" as "Up (healthy)"
```

### Health Check

The Docker Compose file includes a health check:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U invuser -d inventory"]
  interval: 5s
  timeout: 5s
  retries: 5
```

Wait until the container reports "healthy" before running migrations.

---

## Step 3: Configure Environment

```sh
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://invuser:invpass@localhost:5433/inventory

GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxx

BETTER_AUTH_SECRET=your_random_hex_string
BETTER_AUTH_URL=http://localhost:3000

NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=silent
```

### Generating a Better Auth Secret

```sh
openssl rand -hex 32
```

### Getting Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Choose **External** user type
5. Fill in app name, user support email, developer email
6. Add scopes: `email`, `profile`, `openid`
7. Add test users (your Gmail address)
8. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
9. Application type: **Web application**
10. Add Authorized redirect URIs:
    - `http://localhost:3000/api/auth/callback/google`
11. Copy Client ID and Client Secret into `.env`

---

## Step 4: Run Database Migrations

```sh
pnpm prisma migrate dev --name init
```

This creates all 11 tables: `Tenant`, `User`, `Session`, `Account`, `Verification`, `AttributeDefinition`, `Product`, `ProductAttributeValue`, `StockMovement`, `StockTake`, `StockTakeItem`.

### If Migrations Are Already Applied

```sh
pnpm prisma migrate dev
```

This checks if the schema matches the last migration and re-applies if needed.

### Prisma Studio (Optional)

```sh
pnpm prisma studio
```

Opens a browser-based database UI at `http://localhost:5555`.

---

## Step 5: Seed Demo Data (Optional)

```sh
pnpm seed
```

This seeds:
- **Liquor Shop** (`liquor-shop`) — 10+ products (whisky, vodka, beer, rum, wine), attribute definitions (Alcohol %, Expiry Date, Volume), stock movements
- **Bicycle Shop** (`bike-shop`) — 8+ products (mountain bike, road bike, helmet, gloves), attribute definitions (Size, Color, Weight), stock movements

The seed script:
1. Creates tenants
2. Creates attribute definitions
3. Creates products with custom attribute values
4. Records initial stock movements

If you need to re-seed, reset the database first:
```sh
pnpm prisma migrate reset --force
pnpm seed
```

---

## Step 6: Start Dev Server

```sh
pnpm dev
```

Open **http://localhost:3000**.

### Expected Flow

1. **Landing page** — "Sign in with Google" button
2. **Google OAuth** — Sign in with your Google account
3. **Post-sign-in** — If no shop exists, "Create Shop" form appears
4. **Create Shop** — Enter name and category
5. **Redirect** — To `/[tenantSlug]/dashboard`
6. **Navigate** — Products, Stock Take, Settings

### If You Seeded

You'll need to sign in with Google, create your own shop, or manually set your user's `tenantId` to one of the seeded tenants via Prisma Studio.

---

## Step 7: Verify

### Build Check

```sh
pnpm next build
```

Should complete in ~10s with no errors:
```
✓ Compiled successfully in 9.0s
✓ Generating static pages (5/5)
```

### Lint Check

```sh
pnpm eslint .
```

### Test Check

```sh
pnpm test
```

All 7 isolation tests should pass. Requires Docker PostgreSQL running with seed data.

---

## Common Issues & Fixes

### Port 5433 already in use

Change the host port in `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Changed from 5433
```
Then update `DATABASE_URL` accordingly.

### Docker container exits immediately

Check Docker logs:
```sh
docker compose logs postgres
```

### Prisma client not generated

```sh
pnpm prisma generate
```

### "Cannot find module @prisma/client"

Prisma client is generated to `src/generated/prisma/client`. If it's missing:
```sh
pnpm prisma generate
```

### Google OAuth "redirect_uri_mismatch"

Ensure the redirect URI in Google Cloud Console exactly matches:
```
http://localhost:3000/api/auth/callback/google
```
No trailing slash.

### "better-call" version errors

Better Auth requires `better-call@1.3.6`. It's pinned in `package.json`. If removed, run:
```sh
pnpm add better-call@1.3.6
```

### Proxy redirect loop for Google OAuth

The proxy skips `/api/` paths, which includes `/api/auth/...`. Verify `proxy.ts`:
```typescript
if (url.pathname.startsWith("/_next") || url.pathname.startsWith("/api/"))
  return NextResponse.next();
```

### Windows: PowerShell execution policy

If scripts fail to run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
