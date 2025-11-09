import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { AuthAPI, User } from '../../lib/api/auth';

// Mock AuthAPI
jest.mock('../../lib/api/auth', () => ({
  AuthAPI: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

describe('AuthContext', () => {
  const mockUser: User = {
    sub: '123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should initialize with loading state', () => {
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load authenticated user on mount', async () => {
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(AuthAPI.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle unauthenticated user on mount', async () => {
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle error during user load', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AuthAPI.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should call AuthAPI.login', async () => {
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login();
      });

      expect(AuthAPI.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (AuthAPI.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);

      await act(async () => {
        await result.current.logout();
      });

      expect(AuthAPI.logout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      const logoutError = new Error('Logout failed');
      (AuthAPI.logout as jest.Mock).mockRejectedValue(logoutError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.logout();
        })
      ).rejects.toThrow('Logout failed');

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refreshUser', () => {
    it('should refresh user data', async () => {
      (AuthAPI.getCurrentUser as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle refresh error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AuthAPI.getCurrentUser as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('useAuth', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return context value when used within AuthProvider', async () => {
      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('refreshUser');
    });
  });
});
