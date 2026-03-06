import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/admin/login",
    "/sign-in",
    "/sign-up",
    "/api/webhooks(.*)",
    "/api/rag(.*)",
    "/api/admin/setup-pgvector",
    "/api/integrations/oauth/callback",
    "/api/integrations/oauth/debug",
    "/api/oauth/callback",
    "/api/maintenance-status",
    "/api/cron(.*)",
  ],
  ignoredRoutes: [
    // Static files and Next.js internals only — never ignore API routes
    "/_next(.*)",
    "/favicon.ico",
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
