import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class AuthProxyService {
  private readonly logger = new Logger(AuthProxyService.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:8080';
    this.logger.log(`Auth Service URL: ${this.authServiceUrl}`);
  }

  async proxyRequest(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: Record<string, string>,
    body?: any,
    queryParams?: Record<string, string>,
  ) {
    const url = `${this.authServiceUrl}${path}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        ...headers,
        // Remove headers que não devem ser encaminhados
        host: undefined,
        connection: undefined,
      },
      data: body,
      params: queryParams,
      maxRedirects: 0, // Não seguir redirects automaticamente
      validateStatus: () => true, // Aceitar qualquer status code
    };

    this.logger.debug(`Proxying ${method} ${url}`);

    try {
      const response = await firstValueFrom(this.httpService.request(config));
      return response;
    } catch (error) {
      this.logger.error(`Error proxying request: ${error.message}`);
      throw error;
    }
  }
}
