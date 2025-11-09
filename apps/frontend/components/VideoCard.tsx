'use client';

import { ProcessedVideo } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { VideoActions } from './VideoActions';
import { useAudio } from '@/contexts/AudioContext';

interface VideoCardProps {
  video: ProcessedVideo;
  isActive: boolean;
}

export function VideoCard({ video, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVolumeHovering, setIsVolumeHovering] = useState(false);
  const [isProgressHovering, setIsProgressHovering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { volume, isMuted, setVolume, toggleMute } = useAudio();

  // Sync video volume and muted state with global context
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.volume = volume;
    videoElement.muted = isMuted;
  }, [volume, isMuted]);

  // Update progress and duration
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Set initial duration if already loaded
    if (videoElement.duration) {
      setDuration(videoElement.duration);
    }

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Handle autoplay based on visibility
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch((err) => {
        console.error('Failed to play video:', err);
      });
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Toggle play/pause on click
  const handleVideoClick = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play();
      setIsPlaying(true);
    }
  };

  // Toggle mute/unmute
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // Handle seek (progress change)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = parseFloat(e.target.value);
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine video container styles based on orientation
  const getVideoContainerStyles = () => {
    if (video.orientation === 'horizontal') {
      // Horizontal videos: centered with letterbox (black bars top/bottom)
      return 'flex items-center justify-center bg-black';
    } else {
      // Vertical videos: fill the entire area
      return 'bg-black';
    }
  };

  const getVideoStyles = () => {
    if (video.orientation === 'horizontal') {
      // Horizontal: constrain width, maintain aspect ratio
      return 'w-full h-auto max-h-screen object-contain';
    } else {
      // Vertical: fill height completely
      return 'w-full h-full object-cover';
    }
  };

  return (
    <div className="relative w-full h-screen snap-start snap-always flex items-center justify-center bg-black py-4">
      {/* Fixed vertical frame container (9:16 aspect ratio like a phone) */}
      <div
        className="relative w-full max-w-[500px] h-full bg-black rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Video Container */}
        <div className={`w-full h-full ${getVideoContainerStyles()}`}>
          <video
            ref={videoRef}
            src={video.url}
            poster={video.thumbnail}
            loop
            playsInline
            muted={isMuted}
            className={getVideoStyles()}
            onClick={handleVideoClick}
          />
        </div>

        {/* Overlay with video information */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            {/* User Avatar Placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {video.username.charAt(0).toUpperCase()}
            </div>

            {/* Username */}
            <a
              href={video.userUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold hover:underline"
            >
              @{video.username.toLowerCase().replace(/\s+/g, '')}
            </a>
          </div>

          {/* Video metadata */}
          <div className="text-white/80 text-sm">
            <p className="mb-1">
              Video por <span className="font-medium">{video.username}</span>
            </p>
            <p className="text-xs text-white/60">
              Duração: {Math.floor(video.duration)}s • {video.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </p>
          </div>
        </div>

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div
          className={`absolute top-4 right-4 flex items-center gap-2 transition-all duration-300 z-50 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseEnter={() => setIsVolumeHovering(true)}
          onMouseLeave={() => setIsVolumeHovering(false)}
        >
          {/* Volume Slider */}
          <div
            className={`flex items-center bg-black/50 rounded-full px-3 py-2 transition-all duration-300 ${
              isVolumeHovering ? 'opacity-100 w-32' : 'opacity-0 w-0 px-0'
            }`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Mute/Unmute Button */}
          <button
            onClick={handleMuteToggle}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors flex-shrink-0"
            aria-label={isMuted || volume === 0 ? 'Ativar som' : 'Desativar som'}
          >
            {isMuted || volume === 0 ? (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
            isProgressHovering ? 'pb-2' : 'pb-0'
          }`}
          onMouseEnter={() => setIsProgressHovering(true)}
          onMouseLeave={() => setIsProgressHovering(false)}
        >
          {/* Time Display - Only visible on hover */}
          {isProgressHovering && (
            <div className="flex items-center justify-center mb-2 px-4">
              <span className="text-white text-sm font-medium bg-black/60 px-3 py-1 rounded-full">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Progress Bar Container */}
          <div className="relative w-full px-4">
            <div className="relative h-1 bg-gray-600 rounded-full overflow-hidden">
              {/* Progress Fill */}
              <div
                className="absolute top-0 left-0 h-full bg-red-600 transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />

              {/* Interactive Slider - Only visible on hover */}
              {isProgressHovering && (
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-3 appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-moz-range-thumb]:w-5
                    [&::-moz-range-thumb]:h-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        </div>

        {/* Video Actions Sidebar */}
        <VideoActions video={video} />
      </div>
    </div>
  );
}
