import { jwtDecode } from 'jwt-decode';
import { config } from '../config';

export interface User {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  [key: string]: any;
}

export interface JWTPayload extends User {
  exp?: number;
  iat?: number;
  iss?: string;
}

/**
 * API client para autenticação
 */
export class AuthAPI {
  private static baseUrl = config.gatewayUrl;

  /**
   * Inicia o fluxo de login redirecionando para o OIDC provider
   */
  static login(): void {
    window.location.href = `${this.baseUrl}/auth/login`;
  }

  /**
   * Faz logout do usuário
   * Redireciona para o endpoint de logout que irá:
   * 1. Limpar a sessão do Redis
   * 2. Limpar os cookies HTTP-only
   * 3. Redirecionar para o logout do Keycloak (RP-Initiated Logout)
   * 4. Keycloak redirecionará de volta para o frontend
   */
  static logout(): void {
    window.location.href = `${this.baseUrl}/auth/logout`;
  }

  /**
   * Renova o token de acesso
   */
  static async refreshToken(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Enviar cookies
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Obtém o usuário atual fazendo uma request para o backend
   * Como os cookies são HTTP-only, o backend valida o token e retorna os dados
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Enviar cookies
      });

      if (!response.ok) {
        return null;
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Decodifica um token JWT
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Verifica se um token está expirado
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    return decoded.exp < Date.now() / 1000;
  }

  /**
   * Faz uma requisição autenticada
   * Automaticamente tenta renovar o token se receber 401
   */
  static async authenticatedFetch(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const defaultOptions: RequestInit = {
      credentials: 'include', // Enviar cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let response = await fetch(url, defaultOptions);

    // Se receber 401, tentar renovar o token e fazer a requisição novamente
    if (response.status === 401) {
      try {
        await this.refreshToken();
        response = await fetch(url, defaultOptions);
      } catch (error) {
        // Se falhar ao renovar, redirecionar para login
        this.login();
        throw error;
      }
    }

    return response;
  }

  /**
   * Verifica se o usuário está autenticado fazendo uma request para uma rota protegida
   */
  static async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
