import { test, expect } from '@playwright/test';

test.describe('Video Playback and Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Video Loading', () => {
    test('should load videos from API and display them', async ({ page }) => {
      // Wait for loading to complete
      await expect(page.getByText('Carregando vídeos...')).not.toBeVisible({ timeout: 10000 });

      // Check if video elements are present
      const videos = page.locator('video');
      await expect(videos.first()).toBeVisible();

      // Verify video has src attribute
      const firstVideo = videos.first();
      const src = await firstVideo.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).toMatch(/^https?:\/\//);
    });

    test('should verify video readyState indicates loading', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      const readyState = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.readyState;
      });

      // readyState should be at least HAVE_METADATA (1) or higher
      expect(readyState).toBeGreaterThanOrEqual(1);
    });

    test('should load video metadata including duration', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Wait for metadata to load
      await page.waitForFunction(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video && video.duration > 0;
      }, { timeout: 15000 });

      const duration = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.duration;
      });

      expect(duration).toBeGreaterThan(0);
    });

    test('should display video thumbnail/poster before playback', async ({ page }) => {
      const video = page.locator('video').first();
      const poster = await video.getAttribute('poster');

      expect(poster).toBeTruthy();
      expect(poster).toMatch(/^https?:\/\//);
    });

    test('should handle video loading errors gracefully', async ({ page }) => {
      // Intercept and fail video requests
      await page.route('**/*.mp4', (route) => {
        route.abort('failed');
      });

      await page.goto('/');

      // Should either show error state or continue without crashing
      const hasError = await page.getByText(/erro/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/nenhum vídeo/i).isVisible().catch(() => false);

      // At least one error handling mechanism should be visible
      expect(hasError || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Video Autoplay', () => {
    test('should autoplay first video when page loads', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Wait a bit for autoplay to trigger
      await page.waitForTimeout(1000);

      const isPlaying = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video && !video.paused;
      });

      expect(isPlaying).toBe(true);
    });

    test('should pause previous video when scrolling to next', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Get reference to first video
      const firstVideoPaused = await page.evaluate(() => {
        const container = document.querySelector('#video-feed-container');
        if (container) {
          container.scrollBy(0, window.innerHeight);
        }

        // Wait for scroll to complete
        return new Promise((resolve) => {
          setTimeout(() => {
            const firstVideo = document.querySelectorAll('video')[0] as HTMLVideoElement;
            resolve(firstVideo?.paused);
          }, 1000);
        });
      });

      expect(firstVideoPaused).toBe(true);
    });
  });

  test.describe('Video Controls', () => {
    test('should show volume control on hover', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Hover over video
      await page.hover('video');

      // Volume button should be visible
      const volumeButton = page.getByRole('button', { name: /som/i });
      await expect(volumeButton).toBeVisible();
    });

    test('should toggle mute when volume button is clicked', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Hover to show controls
      await page.hover('video');

      const volumeButton = page.getByRole('button', { name: /som/i });
      await volumeButton.click();

      // Check if video is muted
      const isMuted = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.muted;
      });

      expect(isMuted).toBe(true);
    });

    test('should show volume slider on volume button hover', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Hover over video container
      await page.hover('video');

      // Hover over volume control area
      const volumeControl = page.getByRole('button', { name: /som/i });
      await volumeControl.hover();

      // Volume slider should appear
      const slider = page.locator('input[type="range"]').first();
      await expect(slider).toBeVisible();
    });

    test('should change volume when slider is dragged', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Show controls
      await page.hover('video');
      await page.getByRole('button', { name: /som/i }).hover();

      // Get volume slider
      const volumeSlider = page.locator('input[type="range"]').first();

      // Change volume
      await volumeSlider.fill('0.5');

      const volume = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.volume;
      });

      expect(volume).toBeCloseTo(0.5, 1);
    });
  });

  test.describe('Progress Bar', () => {
    test('should display progress bar', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      const progressBar = page.locator('.bg-red-600').first();
      await expect(progressBar).toBeVisible();
    });

    test('should show time display on progress bar hover', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Find and hover over progress bar
      const progressContainer = page.locator('.absolute.bottom-0').first();
      await progressContainer.hover();

      // Time display should appear
      await expect(page.getByText(/\d{2}:\d{2} \/ \d{2}:\d{2}/)).toBeVisible();
    });

    test('should update progress as video plays', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Wait for video to play a bit
      await page.waitForTimeout(2000);

      const currentTime = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.currentTime;
      });

      expect(currentTime).toBeGreaterThan(0);
    });

    test('should seek video when progress bar is clicked', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Hover to show seekable progress bar
      const progressContainer = page.locator('.absolute.bottom-0').first();
      await progressContainer.hover();

      // Click on progress slider
      const progressSlider = page.locator('input[type="range"]').nth(1); // Second range input (progress)
      await progressSlider.fill('30');

      const currentTime = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.currentTime;
      });

      expect(currentTime).toBeCloseTo(30, 0);
    });
  });

  test.describe('Play/Pause Control', () => {
    test('should pause video when clicked', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Wait for autoplay
      await page.waitForTimeout(1000);

      // Click video to pause
      await page.click('video');

      const isPaused = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video?.paused;
      });

      expect(isPaused).toBe(true);
    });

    test('should show play icon when video is paused', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Click to pause
      await page.click('video');

      // Play icon should be visible
      const playIcon = page.locator('svg path[d*="M8 5v14l11-7z"]');
      await expect(playIcon).toBeVisible();
    });

    test('should resume playback when clicked again', async ({ page }) => {
      await page.waitForSelector('video', { timeout: 10000 });

      // Pause
      await page.click('video');
      await page.waitForTimeout(500);

      // Resume
      await page.click('video');

      const isPlaying = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return !video?.paused;
      });

      expect(isPlaying).toBe(true);
    });
  });

  test.describe('Network Monitoring', () => {
    test('should load video with successful network request', async ({ page }) => {
      const videoRequests: string[] = [];

      // Monitor network requests
      page.on('request', (request) => {
        if (request.url().endsWith('.mp4') || request.resourceType() === 'media') {
          videoRequests.push(request.url());
        }
      });

      await page.goto('/');
      await page.waitForSelector('video', { timeout: 10000 });

      // Wait for video to start loading
      await page.waitForTimeout(2000);

      expect(videoRequests.length).toBeGreaterThan(0);
    });

    test('should verify video content type', async ({ page }) => {
      const contentTypes: string[] = [];

      page.on('response', async (response) => {
        if (response.url().endsWith('.mp4') || response.url().includes('video')) {
          const contentType = response.headers()['content-type'];
          if (contentType) {
            contentTypes.push(contentType);
          }
        }
      });

      await page.goto('/');
      await page.waitForSelector('video', { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Should have at least one video content type
      const hasVideoContentType = contentTypes.some((ct) =>
        ct.includes('video') || ct.includes('octet-stream')
      );

      expect(hasVideoContentType).toBe(true);
    });
  });
});
