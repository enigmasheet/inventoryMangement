import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("proxy");

export default async function proxy(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/_next") || url.pathname.startsWith("/api/")) return NextResponse.next();

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
