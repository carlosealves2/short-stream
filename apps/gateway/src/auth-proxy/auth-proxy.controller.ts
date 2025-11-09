import {
  Controller,
  All,
  Req,
  Res,
  HttpException,
  Logger,
  Get,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthProxyService } from './auth-proxy.service';
import { Public, CurrentUser } from '../common/decorators';

@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger(AuthProxyController.name);

  constructor(private readonly authProxyService: AuthProxyService) {}

  /**
   * Rota para obter os dados do usuário autenticado
   * Esta rota NÃO é pública, requer autenticação
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  @All('*')
  @Public() // Rotas de autenticação (login, callback, logout, refresh) são públicas
  async proxyAuthRequest(@Req() req: Request, @Res() res: Response) {
    try {
      // req.path já vem com o prefixo /auth, então usamos diretamente
      const path = req.path;
      const method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE';

      // Extrair headers da requisição
      const headers: Record<string, string> = {};
      Object.keys(req.headers).forEach((key) => {
        const value = req.headers[key];
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value[0];
        }
      });

      this.logger.debug(
        `Proxying ${method} ${path} with query: ${JSON.stringify(req.query)}`,
      );

      // Fazer proxy da requisição
      const response = await this.authProxyService.proxyRequest(
        path,
        method,
        headers,
        req.body,
        req.query as Record<string, string>,
      );

      // Copiar status code
      res.status(response.status);

      // Copiar headers da resposta, incluindo Set-Cookie
      Object.keys(response.headers).forEach((key) => {
        const value = response.headers[key];
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });

      // Para redirects, usar o método redirect do Express
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers['location'];
        if (location) {
          this.logger.debug(`Redirecting to: ${location}`);
          return res.redirect(response.status, location);
        }
      }

      // Retornar o body da resposta
      return res.send(response.data);
    } catch (error) {
      this.logger.error(`Error in proxy: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || 500,
      );
    }
  }
}
