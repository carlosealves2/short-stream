'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProcessedVideo } from '@/lib/types';

interface UseVideosReturn {
  videos: ProcessedVideo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage videos
 * @param page - Page number for pagination
 * @param perPage - Number of videos per page
 * @returns Videos state, loading state, error state, and refetch function
 */
export function useVideos(page: number = 1, perPage: number = 10): UseVideosReturn {
  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/videos?page=${page}&perPage=${perPage}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.videos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
      setError(errorMessage);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
}