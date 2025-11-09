import { renderHook, waitFor } from '@testing-library/react';
import { useVideos } from '../useVideos';
import { mockVideos } from '@/__tests__/fixtures/mockVideos';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('useVideos', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should start with loading state', () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useVideos(1, 10));

    expect(result.current.loading).toBe(true);
    expect(result.current.videos).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and transform videos successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videos: mockVideos }),
    } as Response);

    const { result } = renderHook(() => useVideos(1, 2));

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.videos).toHaveLength(3);
    expect(result.current.error).toBeNull();

    // Verify first video
    const firstVideo = result.current.videos[0];
    expect(firstVideo.id).toBe(1);
    expect(firstVideo.orientation).toBe('horizontal');
  });

  it('should correctly identify vertical videos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videos: mockVideos }),
    } as Response);

    const { result } = renderHook(() => useVideos(1, 2));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    // Second video is vertical
    const secondVideo = result.current.videos[1];
    expect(secondVideo.orientation).toBe('vertical');
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useVideos(1, 10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.videos).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch videos' }),
    } as Response);

    const { result } = renderHook(() => useVideos(1, 10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.videos).toEqual([]);
    expect(result.current.error).toContain('Failed to fetch videos');
  });

  it('should call fetch with correct URL parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videos: mockVideos }),
    } as Response);

    renderHook(() => useVideos(2, 15));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/videos?page=2&perPage=15');
    }, { timeout: 3000 });
  });

  it('should refetch when page or perPage changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ videos: mockVideos }),
    } as Response);

    const { rerender } = renderHook(
      ({ page, perPage }) => useVideos(page, perPage),
      {
        initialProps: { page: 1, perPage: 10 },
      }
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Change page
    rerender({ page: 2, perPage: 10 });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith('/api/videos?page=2&perPage=10');
    }, { timeout: 3000 });
  });
});
