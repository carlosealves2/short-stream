import { test as base } from '@playwright/test';
import { mockVideos } from './videos';

/**
 * Extended test fixture that automatically mocks the internal videos API
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock internal videos API route
    await page.route('**/api/videos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ videos: mockVideos }),
      });
    });

    // Mock video files to prevent actual video downloads in tests
    await page.route('**/*.mp4', async (route) => {
      // Return a minimal valid mp4 response
      await route.fulfill({
        status: 200,
        contentType: 'video/mp4',
        body: Buffer.from([
          0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00,
          0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, 0x6d, 0x70, 0x34, 0x31,
        ]),
      });
    });

    // Use the page with mocked APIs
    await use(page);
  },
});

export { expect } from '@playwright/test';
