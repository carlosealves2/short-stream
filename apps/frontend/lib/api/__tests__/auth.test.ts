import { AuthAPI, User, JWTPayload } from '../auth';
import { config } from '../../config';

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await expect(AuthAPI.refreshToken()).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.gatewayUrl}/auth/refresh`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    });

    it('should throw error when refresh fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(AuthAPI.refreshToken()).rejects.toThrow('Token refresh failed');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(AuthAPI.refreshToken()).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data on success', async () => {
      const mockUser: User = {
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const user = await AuthAPI.getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.gatewayUrl}/auth/me`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
    });

    it('should return null when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const user = await AuthAPI.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const user = await AuthAPI.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode valid JWT token', () => {
      // JWT token with payload: { sub: "123", email: "test@example.com", exp: 9999999999 }
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTl9.qYbZ8katG3NhtHWLfUrduLGHGN2S_6xhRmG_S4jjVhY';

      const decoded = AuthAPI.decodeToken(validToken);
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('123');
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const decoded = AuthAPI.decodeToken(invalidToken);
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Token with exp far in the future
      const futureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.P3CnSwTcz4pTs4K_ukTJJeRU3vBCDPBm9JzYR0E3ZA8';

      expect(AuthAPI.isTokenExpired(futureToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      // Token with exp in the past
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjF9.vMN_H-6bKDjJQfT9Zq_6P9u7ULMkP5u4yxJXk6HTtLY';

      expect(AuthAPI.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for token without exp', () => {
      // Token without exp claim
      const noExpToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.XzMvBK_gVz5kPm7gGJxE-rlSxB5oCsKJFMgIEXemBM4';

      expect(AuthAPI.isTokenExpired(noExpToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(AuthAPI.isTokenExpired(invalidToken)).toBe(true);
    });
  });

  describe('authenticatedFetch', () => {
    it('should make successful authenticated request', async () => {
      const mockResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await AuthAPI.authenticatedFetch('/api/test');

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });


    it('should retry on 401 after refreshing token', async () => {
      const unauthorizedResponse = { ok: false, status: 401 };
      const successResponse = { ok: true, status: 200 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockResolvedValueOnce({ ok: true }) // refresh token success
        .mockResolvedValueOnce(successResponse); // retry success

      const response = await AuthAPI.authenticatedFetch('/api/test');

      expect(response).toEqual(successResponse);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error on refresh failure', async () => {
      const unauthorizedResponse = { ok: false, status: 401 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(AuthAPI.authenticatedFetch('/api/test')).rejects.toThrow('Refresh failed');
    });
  });

  describe('checkAuth', () => {
    it('should return true when authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const isAuth = await AuthAPI.checkAuth();
      expect(isAuth).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.gatewayUrl}/`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
    });

    it('should return false when not authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const isAuth = await AuthAPI.checkAuth();
      expect(isAuth).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const isAuth = await AuthAPI.checkAuth();
      expect(isAuth).toBe(false);
    });
  });
});
