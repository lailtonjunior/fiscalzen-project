import { authMiddleware } from "@clerk/nextjs";

/**
 * Middleware de autenticação Clerk
 * Protege todas as rotas exceto as públicas listadas
 */
export default authMiddleware({
    // Rotas públicas que não requerem autenticação
    publicRoutes: [
        "/",
        "/login",
        "/sign-up",
        "/sign-in",
        "/api/health",
    ],
});

export const config = {
    // Matcher para aplicar o middleware
    // Ignora arquivos estáticos e rotas internas do Next.js
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
