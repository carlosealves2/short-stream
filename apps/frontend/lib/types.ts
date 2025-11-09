// Video types
export interface Video {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: VideoFile[];
  video_pictures: VideoPicture[];
}

export interface VideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

export interface VideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  total_results: number;
  url: string;
  videos: Video[];
}

// Processed video type for our app
export interface ProcessedVideo {
  id: number;
  url: string;
  thumbnail: string;
  username: string;
  userUrl: string;
  duration: number;
  orientation: 'horizontal' | 'vertical';
  aspectRatio: number;
}