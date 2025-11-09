import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para proteger rotas que requerem autenticação
 *
 * Rotas protegidas:
 * - /profile/*
 * - /settings/*
 *
 * Rotas públicas:
 * - / (feed)
 * - /login
 * - /auth/* (rotas de autenticação)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que requerem autenticação
  const protectedRoutes = ['/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Verificar se o usuário tem o cookie de sessão
    const sessionId = request.cookies.get('session_id');
    const accessToken = request.cookies.get('access_token');
    const idToken = request.cookies.get('id_token');

    // Se não tiver nenhum token, redirecionar para login
    if (!sessionId && !accessToken && !idToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|auth/callback|auth/login|auth/logout|auth/refresh).*)',
  ],
};
