'use client';

import { useState, useEffect } from 'react';
import { ProcessedVideo } from '@/lib/types';
import { getVideos } from '@/lib/pexels';

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

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedVideos = await getVideos(page, perPage);
      setVideos(fetchedVideos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
      setError(errorMessage);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
}