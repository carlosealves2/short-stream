'use client';

import { useState } from 'react';
import { ProcessedVideo } from '@/lib/types';

interface VideoActionsProps {
  video: ProcessedVideo;
}

export function VideoActions({ video }: VideoActionsProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  // Mock counters - in a real app, these would come from the API
  const [likeCount, setLikeCount] = useState(() => Math.floor(Math.random() * 50000) + 1000);
  const [commentCount] = useState(() => Math.floor(Math.random() * 1000) + 50);
  const [saveCount] = useState(() => Math.floor(Math.random() * 5000) + 100);
  const [shareCount] = useState(() => Math.floor(Math.random() * 2000) + 50);

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-10">
      {/* User Avatar */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold border-2 border-white">
          {video.username.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Like Button */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1 group"
        aria-label="Curtir"
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
          <svg
            className={`w-7 h-7 transition-all ${
              liked
                ? 'fill-red-500 text-red-500 scale-110'
                : 'fill-none text-white group-hover:scale-110'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <span className="text-white text-xs font-semibold">{formatCount(likeCount)}</span>
      </button>

      {/* Comment Button */}
      <button className="flex flex-col items-center gap-1 group" aria-label="Comentar">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
          <svg
            className="w-7 h-7 text-white group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <span className="text-white text-xs font-semibold">{formatCount(commentCount)}</span>
      </button>

      {/* Save/Favorite Button */}
      <button
        onClick={handleSave}
        className="flex flex-col items-center gap-1 group"
        aria-label="Salvar"
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
          <svg
            className={`w-7 h-7 transition-all ${
              saved
                ? 'fill-yellow-400 text-yellow-400 scale-110'
                : 'fill-none text-white group-hover:scale-110'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <span className="text-white text-xs font-semibold">{formatCount(saveCount)}</span>
      </button>

      {/* Share Button */}
      <button className="flex flex-col items-center gap-1 group" aria-label="Compartilhar">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
          <svg
            className="w-7 h-7 text-white group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </div>
        <span className="text-white text-xs font-semibold">{formatCount(shareCount)}</span>
      </button>
    </div>
  );
}
