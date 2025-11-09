import { render, screen, fireEvent } from '@/__tests__/utils/testUtils';
import { VideoCard } from '../VideoCard';
import { mockVideo, mockVerticalVideo } from '@/__tests__/fixtures/mockVideos';
import { createMockVideoElement } from '@/__tests__/utils/mockVideoElement';
import * as React from 'react';

// Mock VideoActions component
jest.mock('../VideoActions', () => ({
  VideoActions: () => <div data-testid="video-actions">Video Actions</div>,
}));

describe('VideoCard', () => {
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    mockVideoElement = createMockVideoElement();

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: mockVideoElement,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render video element with correct src and poster', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', mockVideo.url);
      expect(video).toHaveAttribute('poster', mockVideo.thumbnail);
    });

    it('should render user information', () => {
      render(<VideoCard video={mockVideo} isActive={false} />);

      expect(screen.getByText(`@${mockVideo.username.toLowerCase().replace(/\s+/g, '')}`)).toBeInTheDocument();
      expect(screen.getByText(`Video por`, { exact: false })).toBeInTheDocument();
    });

    it('should render VideoActions component', () => {
      render(<VideoCard video={mockVideo} isActive={false} />);

      expect(screen.getByTestId('video-actions')).toBeInTheDocument();
    });

    it('should apply horizontal video styles for horizontal orientation', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const videoContainer = container.querySelector('.flex.items-center.justify-center');
      expect(videoContainer).toBeInTheDocument();
    });

    it('should apply vertical video styles for vertical orientation', () => {
      const { container } = render(<VideoCard video={mockVerticalVideo} isActive={false} />);

      const video = container.querySelector('video');
      expect(video).toHaveClass('object-cover');
    });
  });

  describe('Playback controls', () => {
    it('should render video with playsinline and loop attributes', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const video = container.querySelector('video');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveAttribute('playsInline');
    });

    it('should have click handler on video element', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();

      // Video should be clickable
      if (video) {
        fireEvent.click(video);
        // No error should be thrown
      }
    });

    it('should show play icon when paused', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      // Look for play icon (the path with specific d attribute for play button)
      const playIcon = container.querySelector('path[d*="M8 5v14l11-7z"]');
      expect(playIcon).toBeInTheDocument();
    });
  });

  describe('Volume controls', () => {
    it('should render volume control button', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const volumeControl = container.querySelector('[aria-label*="som"]');
      expect(volumeControl).toBeInTheDocument();
    });

    it('should have volume control container initially hidden', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      // The parent div has the opacity class, not the button itself
      const volumeControlContainer = container.querySelector('[aria-label*="som"]')?.parentElement;
      expect(volumeControlContainer).toHaveClass('opacity-0');
    });
  });

  describe('Progress bar', () => {
    it('should display progress bar', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const progressBar = container.querySelector('.bg-red-600');
      expect(progressBar).toBeInTheDocument();
    });

    it('should have progress bar container at bottom', () => {
      const { container } = render(<VideoCard video={mockVideo} isActive={false} />);

      const progressContainer = container.querySelector('.absolute.bottom-0');
      expect(progressContainer).toBeInTheDocument();
    });
  });
});
