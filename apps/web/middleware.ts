import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Middleware de autenticação Clerk v5
 * Protege todas as rotas exceto as públicas listadas
 */
const isPublicRoute = createRouteMatcher([
    "/",
    "/login",
    "/sign-up(.*)",
    "/sign-in(.*)",
    "/api/health",
]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth();
    }
});

export const config = {
    // Matcher para aplicar o middleware
    // Ignora arquivos estáticos e rotas internas do Next.js
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
