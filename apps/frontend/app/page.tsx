'use client';

import { useVideos } from '@/hooks/useVideos';
import { VideoFeed } from '@/components/VideoFeed';
import { EmptyState } from '@/components/EmptyState';
import { ScrollButtons } from '@/components/ScrollButtons';

export default function Home() {
  const { videos, loading, error } = useVideos(1, 10);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white text-lg">Carregando vídeos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Erro ao carregar vídeos</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!videos || videos.length === 0) {
    return <EmptyState />;
  }

  // Main content
  return (
    <>
      <ScrollButtons />
      <VideoFeed videos={videos} />
    </>
  );
}
