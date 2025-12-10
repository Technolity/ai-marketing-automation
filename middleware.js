import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/auth/login",
    "/auth/signup",
    "/admin/login",
    "/sign-in",
    "/sign-up",
    "/api/webhooks(.*)",
    "/api/webhooks/clerk"
  ],
  ignoredRoutes: [
    "/((?!api|trpc))(_next.*|.+\\.[\\w]+$)",
    "/api/webhooks/clerk"
  ]
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
