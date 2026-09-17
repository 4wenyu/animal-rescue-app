import { auth } from "./app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const protectedPaths = ["/dashboard", "/intake", "/medical"];
  // Tier 0.4: the citizen intake portal (/intake/public) is PUBLIC — an
  // anonymous community member reporting a stray or surrendering their pet
  // must NOT be forced to log in. It is excluded from the auth gate.
  const publicPaths = ["/intake/public"];
  // Staff-only tooling: even a logged-in CITIZEN must not reach the intake
  // document scanner or the medical-records surface.
  const staffOnlyPaths = ["/intake/document-scan", "/intake/medical", "/medical"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  const isStaffOnly = staffOnlyPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected && !isPublicPath && !session?.user) {
    const redirectUrl = new URL("/login", request.nextUrl.origin);
    redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated but not staff: send citizens back to their dashboard
  // instead of the staff tooling surfaces.
  if (isStaffOnly && session?.user) {
    const role = (session.user as Record<string, unknown> | undefined)?.role;
    if (role !== "STAFF" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/intake/:path*", "/medical/:path*"],
};