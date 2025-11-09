import { ProcessedVideo } from '@/lib/types';

export const mockVideo: ProcessedVideo = {
  id: 1,
  duration: 60,
  url: 'https://example.com/video.mp4',
  thumbnail: 'https://example.com/thumbnail.jpg',
  username: 'Test User',
  userUrl: 'https://example.com/user',
  orientation: 'horizontal',
  aspectRatio: 1920 / 1080,
};

export const mockVerticalVideo: ProcessedVideo = {
  id: 2,
  duration: 45,
  url: 'https://example.com/vertical-video.mp4',
  thumbnail: 'https://example.com/vertical-thumbnail.jpg',
  username: 'Vertical User',
  userUrl: 'https://example.com/vertical-user',
  orientation: 'vertical',
  aspectRatio: 1080 / 1920,
};

export const mockVideos: ProcessedVideo[] = [
  mockVideo,
  mockVerticalVideo,
  {
    id: 3,
    duration: 30,
    url: 'https://example.com/video3.mp4',
    thumbnail: 'https://example.com/thumbnail3.jpg',
    username: 'Another User',
    userUrl: 'https://example.com/another-user',
    orientation: 'horizontal',
    aspectRatio: 1920 / 1080,
  },
];
