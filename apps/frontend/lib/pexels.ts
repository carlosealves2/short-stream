import { PexelsResponse, Video, ProcessedVideo } from './types';

const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/videos';

/**
 * Fetches popular videos from Pexels API
 * @param page - Page number for pagination
 * @param perPage - Number of videos per page
 * @returns Promise with Pexels API response
 */
export async function fetchPopularVideos(
  page: number = 1,
  perPage: number = 10
): Promise<PexelsResponse> {
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key is not configured');
  }

  const response = await fetch(
    `${PEXELS_API_URL}/popular?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Processes raw Pexels video data into a format suitable for our app
 * @param video - Raw Pexels video object
 * @returns Processed video object
 */
export function processVideo(video: Video): ProcessedVideo {
  // Find the best quality video file (prefer HD)
  const videoFile =
    video.video_files.find(
      (file) => file.quality === 'hd' && file.width <= 1280
    ) ||
    video.video_files.find((file) => file.quality === 'sd') ||
    video.video_files[0];

  // Calculate aspect ratio
  const aspectRatio = video.width / video.height;

  // Determine orientation based on aspect ratio
  // Vertical: < 1 (e.g., 9:16 = 0.5625)
  // Horizontal: > 1 (e.g., 16:9 = 1.777)
  const orientation: 'horizontal' | 'vertical' = aspectRatio > 1 ? 'horizontal' : 'vertical';

  return {
    id: video.id,
    url: videoFile.link,
    thumbnail: video.image,
    username: video.user.name,
    userUrl: video.user.url,
    duration: video.duration,
    orientation,
    aspectRatio,
  };
}

/**
 * Fetches and processes popular videos
 * @param page - Page number for pagination
 * @param perPage - Number of videos per page
 * @returns Promise with array of processed videos
 */
export async function getVideos(
  page: number = 1,
  perPage: number = 10
): Promise<ProcessedVideo[]> {
  const response = await fetchPopularVideos(page, perPage);
  return response.videos.map(processVideo);
}