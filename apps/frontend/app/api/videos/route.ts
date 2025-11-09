import { NextRequest, NextResponse } from 'next/server';
import { getVideos } from '@/lib/pexels';

/**
 * GET /api/videos
 * Fetches videos from Pexels API
 * Query params:
 * - page: Page number (default: 1)
 * - perPage: Number of videos per page (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);

    // Validate params
    if (page < 1 || perPage < 1 || perPage > 80) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const videos = await getVideos(page, perPage);

    return NextResponse.json({ videos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching videos:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
