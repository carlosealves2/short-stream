import { renderHook, waitFor } from '@testing-library/react';
import { useVideos } from '../useVideos';
import * as pexelsModule from '@/lib/pexels';
import { mockVideos } from '@/__tests__/fixtures/mockVideos';

// Mock the pexels module
jest.mock('@/lib/pexels');

const mockGetVideos = pexelsModule.getVideos as jest.MockedFunction<typeof pexelsModule.getVideos>;

describe('useVideos', () => {
  beforeEach(() => {
    mockGetVideos.mockClear();
  });

  it('should start with loading state', () => {
    mockGetVideos.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useVideos(1, 10));

    expect(result.current.loading).toBe(true);
    expect(result.current.videos).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and transform videos successfully', async () => {
    mockGetVideos.mockResolvedValueOnce(mockVideos);

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
    mockGetVideos.mockResolvedValueOnce(mockVideos);

    const { result } = renderHook(() => useVideos(1, 2));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    // Second video is vertical
    const secondVideo = result.current.videos[1];
    expect(secondVideo.orientation).toBe('vertical');
  });

  it('should handle fetch errors', async () => {
    mockGetVideos.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useVideos(1, 10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.videos).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle API errors', async () => {
    mockGetVideos.mockRejectedValueOnce(new Error('Failed to fetch videos: Internal Server Error'));

    const { result } = renderHook(() => useVideos(1, 10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.videos).toEqual([]);
    expect(result.current.error).toContain('Failed to fetch videos');
  });

  it('should call getVideos with correct parameters', async () => {
    mockGetVideos.mockResolvedValueOnce(mockVideos);

    renderHook(() => useVideos(2, 15));

    await waitFor(() => {
      expect(mockGetVideos).toHaveBeenCalledWith(2, 15);
    }, { timeout: 3000 });
  });

  it('should refetch when page or perPage changes', async () => {
    mockGetVideos.mockResolvedValue(mockVideos);

    const { rerender } = renderHook(
      ({ page, perPage }) => useVideos(page, perPage),
      {
        initialProps: { page: 1, perPage: 10 },
      }
    );

    await waitFor(() => {
      expect(mockGetVideos).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Change page
    rerender({ page: 2, perPage: 10 });

    await waitFor(() => {
      expect(mockGetVideos).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });
});
