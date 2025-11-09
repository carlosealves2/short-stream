/**
 * Configuração centralizada das URLs da aplicação
 */

export const config = {
  /**
   * URL do Gateway (ponto único de entrada para o backend)
   */
  gatewayUrl:
    process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000',

  /**
   * URL do Pexels API
   */
  pexelsApiKey: process.env.PEXELS_API_KEY || '',
} as const;
