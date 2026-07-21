import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("proxy");
const STATIC_SKIP = ["/_next", "/api/", "/web/"];

export default async function proxy(request: Request) {
  try {
    const url = new URL(request.url);
    if (STATIC_SKIP.some((p) => url.pathname.startsWith(p))) return NextResponse.next();

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (e) {
    log.error("proxy error", e);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/:tenantSlug/:path*"],
};
