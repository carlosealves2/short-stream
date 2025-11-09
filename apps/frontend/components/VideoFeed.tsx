'use client';

import { ProcessedVideo } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { VideoCard } from './VideoCard';

interface VideoFeedProps {
  videos: ProcessedVideo[];
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create Intersection Observer to detect which video is currently visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveVideoIndex(index);
          }
        });
      },
      {
        root: null,
        threshold: 0.5, // Video is considered active when 50% visible
      }
    );

    // Observe all video elements
    const videoElements = container.querySelectorAll('[data-index]');
    videoElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  return (
    <div
      ref={containerRef}
      id="video-feed-container"
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
      }}
    >
      {videos.map((video, index) => (
        <div key={video.id} data-index={index} className="h-screen snap-start">
          <VideoCard video={video} isActive={index === activeVideoIndex} />
        </div>
      ))}
    </div>
  );
}
