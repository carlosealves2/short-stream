import { render, screen, waitFor, act } from '@/__tests__/utils/testUtils';
import { VideoFeed } from '../VideoFeed';
import { mockVideos } from '@/__tests__/fixtures/mockVideos';
import { ProcessedVideo } from '@/lib/types';

// Mock VideoCard component
jest.mock('../VideoCard', () => ({
  VideoCard: ({ video, isActive }: { video: ProcessedVideo; isActive: boolean }) => (
    <div data-testid={`video-card-${video.id}`} data-active={isActive}>
      Video: {video.username}
    </div>
  ),
}));

type MockIntersectionObserver = jest.Mock<IntersectionObserver, [IntersectionObserverCallback]>;

describe('VideoFeed', () => {
  let mockIntersectionObserver: MockIntersectionObserver;
  let observeCallback: IntersectionObserverCallback;

  beforeEach(() => {
    // Create a more sophisticated IntersectionObserver mock
    mockIntersectionObserver = jest.fn((callback) => {
      observeCallback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
        takeRecords: jest.fn(() => []),
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    }) as MockIntersectionObserver;

    global.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render all video cards', () => {
      render(<VideoFeed videos={mockVideos} />);

      mockVideos.forEach((video) => {
        expect(screen.getByTestId(`video-card-${video.id}`)).toBeInTheDocument();
      });
    });

    it('should apply scroll-snap styles to container', () => {
      const { container } = render(<VideoFeed videos={mockVideos} />);

      const feedContainer = container.querySelector('.snap-y.snap-mandatory');
      expect(feedContainer).toBeInTheDocument();
      expect(feedContainer).toHaveClass('overflow-y-scroll');
    });

    it('should render with correct container id', () => {
      const { container } = render(<VideoFeed videos={mockVideos} />);

      const feedContainer = container.querySelector('#video-feed-container');
      expect(feedContainer).toBeInTheDocument();
    });

    it('should hide scrollbar', () => {
      const { container } = render(<VideoFeed videos={mockVideos} />);

      const feedContainer = container.querySelector('.scrollbar-hide');
      expect(feedContainer).toBeInTheDocument();
    });
  });

  describe('IntersectionObserver setup', () => {
    it('should create IntersectionObserver with correct options', () => {
      render(<VideoFeed videos={mockVideos} />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: null,
          threshold: 0.5,
        })
      );
    });

    it('should observe all video elements', async () => {
      const { container } = render(<VideoFeed videos={mockVideos} />);

      const observer = mockIntersectionObserver.mock.results[0].value;

      await waitFor(() => {
        expect(observer.observe).toHaveBeenCalled();
      });

      // Should observe all videos
      const videoElements = container.querySelectorAll('[data-index]');
      expect(videoElements.length).toBe(mockVideos.length);
    });

    it('should disconnect observer on unmount', () => {
      const { unmount } = render(<VideoFeed videos={mockVideos} />);

      const observer = mockIntersectionObserver.mock.results[0].value;

      unmount();

      expect(observer.disconnect).toHaveBeenCalled();
    });
  });

  describe('Active video detection', () => {
    it('should set first video as active by default', () => {
      render(<VideoFeed videos={mockVideos} />);

      const firstVideoCard = screen.getByTestId(`video-card-${mockVideos[0].id}`);
      expect(firstVideoCard).toHaveAttribute('data-active', 'true');
    });

    it('should update active video when intersection changes', async () => {
      const { rerender } = render(<VideoFeed videos={mockVideos} />);

      // Simulate intersection for second video
      const mockEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
      };
      mockEntry.target.setAttribute('data-index', '1');

      // Call the observer callback wrapped in act
      act(() => {
        observeCallback([mockEntry] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver);
      });

      rerender(<VideoFeed videos={mockVideos} />);

      await waitFor(() => {
        const secondVideoCard = screen.getByTestId(`video-card-${mockVideos[1].id}`);
        expect(secondVideoCard).toHaveAttribute('data-active', 'true');
      });
    });

    it('should only have one active video at a time', async () => {
      const { rerender } = render(<VideoFeed videos={mockVideos} />);

      // Initially first video is active
      let firstVideoCard = screen.getByTestId(`video-card-${mockVideos[0].id}`);
      let secondVideoCard = screen.getByTestId(`video-card-${mockVideos[1].id}`);

      expect(firstVideoCard).toHaveAttribute('data-active', 'true');
      expect(secondVideoCard).toHaveAttribute('data-active', 'false');

      // Simulate intersection for second video
      const mockEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
      };
      mockEntry.target.setAttribute('data-index', '1');

      act(() => {
        observeCallback([mockEntry] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver);
      });

      rerender(<VideoFeed videos={mockVideos} />);

      await waitFor(() => {
        firstVideoCard = screen.getByTestId(`video-card-${mockVideos[0].id}`);
        secondVideoCard = screen.getByTestId(`video-card-${mockVideos[1].id}`);

        expect(firstVideoCard).toHaveAttribute('data-active', 'false');
        expect(secondVideoCard).toHaveAttribute('data-active', 'true');
      });
    });
  });

  describe('Data attributes', () => {
    it('should add data-index attribute to each video wrapper', () => {
      const { container } = render(<VideoFeed videos={mockVideos} />);

      const videoWrappers = container.querySelectorAll('[data-index]');

      expect(videoWrappers.length).toBe(mockVideos.length);

      videoWrappers.forEach((wrapper, index) => {
        expect(wrapper).toHaveAttribute('data-index', index.toString());
      });
    });
  });

  describe('Empty state', () => {
    it('should handle empty video array', () => {
      const { container } = render(<VideoFeed videos={[]} />);

      const feedContainer = container.querySelector('#video-feed-container');
      expect(feedContainer).toBeInTheDocument();
      expect(feedContainer?.children.length).toBe(0);
    });
  });

  describe('Re-observation on video list change', () => {
    it('should disconnect and reconnect observer when videos change', () => {
      const { rerender } = render(<VideoFeed videos={mockVideos.slice(0, 2)} />);

      const firstObserver = mockIntersectionObserver.mock.results[0].value;

      // Change videos
      rerender(<VideoFeed videos={mockVideos} />);

      // Should disconnect old observer
      expect(firstObserver.disconnect).toHaveBeenCalled();

      // Should create new observer
      expect(mockIntersectionObserver).toHaveBeenCalledTimes(2);
    });
  });
});
