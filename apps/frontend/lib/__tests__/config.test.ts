import { config } from '../config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('gatewayUrl', () => {
    it('should use default gateway URL when env var is not set', async () => {
      delete process.env.NEXT_PUBLIC_GATEWAY_URL;

      const { config: freshConfig } = await import('../config');
      expect(freshConfig.gatewayUrl).toBe('http://localhost:3000');
    });

    it('should use environment variable when set', async () => {
      process.env.NEXT_PUBLIC_GATEWAY_URL = 'https://api.example.com';

      jest.resetModules();
      const { config: freshConfig } = await import('../config');
      expect(freshConfig.gatewayUrl).toBe('https://api.example.com');
    });
  });

  describe('pexelsApiKey', () => {
    it('should use empty string when env var is not set', async () => {
      delete process.env.PEXELS_API_KEY;

      const { config: freshConfig } = await import('../config');
      expect(freshConfig.pexelsApiKey).toBe('');
    });

    it('should use environment variable when set', async () => {
      process.env.PEXELS_API_KEY = 'test-api-key-12345';

      jest.resetModules();
      const { config: freshConfig } = await import('../config');
      expect(freshConfig.pexelsApiKey).toBe('test-api-key-12345');
    });
  });

  describe('config object', () => {
    it('should be a readonly object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
      expect(config).toHaveProperty('gatewayUrl');
      expect(config).toHaveProperty('pexelsApiKey');
    });

    it('should have correct structure', () => {
      const keys = Object.keys(config);
      expect(keys).toContain('gatewayUrl');
      expect(keys).toContain('pexelsApiKey');
      expect(keys.length).toBe(2);
    });
  });
});
