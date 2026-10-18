import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/icon(.*)",
  "/apple-icon(.*)",
  "/opengraph-image(.*)",
]);

function allowDemoOrPublic(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/demo")) {
    if (process.env.DEMO_SCREENSHOT === "1") return NextResponse.next();
    return new NextResponse("Not found", { status: 404 });
  }
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isPublic(req)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  return NextResponse.redirect(url);
}

const withClerk = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/demo")) {
    if (process.env.DEMO_SCREENSHOT === "1") return;
    return new NextResponse("Not found", { status: 404 });
  }
  if (!isPublic(req)) await auth.protect();
});

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

// Keyless mode is development-only in @clerk/nextjs. Production without keys
// still serves the marketing site and the screenshot demo instead of throwing.
export default process.env.NODE_ENV !== "production" || clerkConfigured ? withClerk : allowDemoOrPublic;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
