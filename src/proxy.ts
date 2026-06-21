import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("proxy");

const STATIC_SKIP = ["/_next", "/api/", "/sw.js", "/manifest.json", "/icons/"];

export default async function proxy(request: Request) {
  const url = new URL(request.url);
  if (STATIC_SKIP.some((p) => url.pathname.startsWith(p))) return NextResponse.next();

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    log.info("redirecting unauthenticated request", { path: url.pathname });
    return NextResponse.redirect(new URL("/", request.url));
  }
  log.debug("authenticated request", { path: url.pathname });
  return NextResponse.next();
}

export const config = {
  matcher: ["/:tenantSlug/:path*"],
};
