import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Extrair token do cookie access_token ou id_token
    const accessToken = this.extractTokenFromCookie(request, 'access_token');
    const idToken = this.extractTokenFromCookie(request, 'id_token');

    const token = accessToken || idToken;

    if (!token) {
      this.logger.warn('No token found in cookies');
      throw new UnauthorizedException('Authentication token not found');
    }

    try {
      // Decodificar o token sem verificar a assinatura
      // A verificação da assinatura seria feita pelo auth_service
      // Aqui apenas validamos se o token é válido e não expirou
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }

      interface JwtPayload {
        exp?: number;
        sub?: string;
        email?: string;
        name?: string;
        preferred_username?: string;
        [key: string]: unknown;
      }

      const payload = decoded.payload as JwtPayload;

      // Verificar expiração
      if (payload.exp !== undefined && payload.exp < Date.now() / 1000) {
        throw new UnauthorizedException('Token expired');
      }

      // Adicionar dados do usuário no request
      const user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        preferred_username: payload.preferred_username,
        ...payload,
      };
      (request as Request & { user: typeof user }).user = user;

      return true;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(
        `Token validation error: ${err.message ?? 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromCookie(
    request: Request,
    cookieName: string,
  ): string | undefined {
    const cookies = request.headers.cookie;

    if (!cookies) {
      return undefined;
    }

    const cookieArray = cookies.split(';').map((c) => c.trim());
    const targetCookie = cookieArray.find((c) =>
      c.startsWith(`${cookieName}=`),
    );

    if (!targetCookie) {
      return undefined;
    }

    return targetCookie.split('=')[1];
  }
}
