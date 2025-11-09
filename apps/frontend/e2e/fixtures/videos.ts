import { ProcessedVideo } from '@/lib/types';

/**
 * Mock video data for E2E tests
 * This data simulates what would be returned from the Pexels API
 */
export const mockVideos: ProcessedVideo[] = [
  {
    id: 1,
    url: 'https://player.vimeo.com/external/373164068.hd.mp4?s=8f49d6c4c2b3b1a4a8f1e1d9c1b1a1a1&profile_id=175',
    thumbnail: 'https://images.pexels.com/videos/373164068/pexels-photo-373164068.jpeg',
    username: 'Test User 1',
    userUrl: 'https://www.pexels.com/@test-user-1',
    duration: 15,
    orientation: 'vertical' as const,
    aspectRatio: 0.5625,
  },
  {
    id: 2,
    url: 'https://player.vimeo.com/external/373164070.hd.mp4?s=9g50e7d5d3c4c2b5b9g2f2e0d2c2b2b2&profile_id=175',
    thumbnail: 'https://images.pexels.com/videos/373164070/pexels-photo-373164070.jpeg',
    username: 'Test User 2',
    userUrl: 'https://www.pexels.com/@test-user-2',
    duration: 20,
    orientation: 'vertical' as const,
    aspectRatio: 0.5625,
  },
  {
    id: 3,
    url: 'https://player.vimeo.com/external/373164072.hd.mp4?s=0h61f8e6e4d5d3c6c0h3g3f1e3d3c3c3&profile_id=175',
    thumbnail: 'https://images.pexels.com/videos/373164072/pexels-photo-373164072.jpeg',
    username: 'Test User 3',
    userUrl: 'https://www.pexels.com/@test-user-3',
    duration: 25,
    orientation: 'vertical' as const,
    aspectRatio: 0.5625,
  },
];

/**
 * Mock Pexels API response
 */
export const mockPexelsResponse = {
  videos: [
    {
      id: 1,
      width: 720,
      height: 1280,
      duration: 15,
      image: 'https://images.pexels.com/videos/373164068/pexels-photo-373164068.jpeg',
      user: {
        name: 'Test User 1',
        url: 'https://www.pexels.com/@test-user-1',
      },
      video_files: [
        {
          id: 1,
          quality: 'hd',
          file_type: 'video/mp4',
          width: 720,
          height: 1280,
          link: 'https://player.vimeo.com/external/373164068.hd.mp4?s=8f49d6c4c2b3b1a4a8f1e1d9c1b1a1a1&profile_id=175',
        },
      ],
    },
    {
      id: 2,
      width: 720,
      height: 1280,
      duration: 20,
      image: 'https://images.pexels.com/videos/373164070/pexels-photo-373164070.jpeg',
      user: {
        name: 'Test User 2',
        url: 'https://www.pexels.com/@test-user-2',
      },
      video_files: [
        {
          id: 2,
          quality: 'hd',
          file_type: 'video/mp4',
          width: 720,
          height: 1280,
          link: 'https://player.vimeo.com/external/373164070.hd.mp4?s=9g50e7d5d3c4c2b5b9g2f2e0d2c2b2b2&profile_id=175',
        },
      ],
    },
    {
      id: 3,
      width: 720,
      height: 1280,
      duration: 25,
      image: 'https://images.pexels.com/videos/373164072/pexels-photo-373164072.jpeg',
      user: {
        name: 'Test User 3',
        url: 'https://www.pexels.com/@test-user-3',
      },
      video_files: [
        {
          id: 3,
          quality: 'hd',
          file_type: 'video/mp4',
          width: 720,
          height: 1280,
          link: 'https://player.vimeo.com/external/373164072.hd.mp4?s=0h61f8e6e4d5d3c6c0h3g3f1e3d3c3c3&profile_id=175',
        },
      ],
    },
  ],
  page: 1,
  per_page: 10,
  total_results: 100,
  url: 'https://api.pexels.com/videos/popular',
};
