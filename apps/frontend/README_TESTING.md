# Frontend Testing Guide

This document provides information about the testing setup for the ShortStream frontend application.

## Testing Stack

- **Unit & Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest Coverage Reports

## Test Structure

```
apps/frontend/
├── __tests__/                    # Test utilities and fixtures
│   ├── fixtures/                 # Mock data for tests
│   │   └── mockVideos.ts         # Sample video data
│   └── utils/                    # Test helper functions
│       ├── testUtils.tsx         # Custom render with providers
│       └── mockVideoElement.ts   # HTMLVideoElement mocks
├── components/__tests__/         # Component tests
│   ├── VideoCard.test.tsx
│   └── VideoFeed.test.tsx
├── contexts/__tests__/           # Context tests
│   └── AudioContext.test.tsx
├── hooks/__tests__/              # Hook tests
│   └── useVideos.test.ts
└── e2e/                          # E2E tests
    └── video-playback.spec.ts
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Using NX
nx test frontend
nx test:coverage frontend
```

### E2E Tests

```bash
# Run E2E tests (headless)
pnpm test:e2e

# Run E2E tests with UI mode
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Using NX
nx test:e2e frontend
```

## Test Coverage

Current test coverage includes:

### Unit Tests

1. **AudioContext** (`contexts/__tests__/AudioContext.test.tsx`)
   - Volume state management
   - Mute/unmute functionality
   - Global state persistence

2. **useVideos Hook** (`hooks/__tests__/useVideos.test.ts`)
   - API data fetching
   - Loading states
   - Error handling
   - Video data transformation

3. **VideoCard Component** (`components/__tests__/VideoCard.test.tsx`)
   - Video rendering
   - Play/pause controls
   - Volume controls
   - Progress bar functionality
   - Time formatting

4. **VideoFeed Component** (`components/__tests__/VideoFeed.test.tsx`)
   - Video list rendering
   - IntersectionObserver integration
   - Active video detection
   - Scroll behavior

### E2E Tests

1. **Video Loading** (`e2e/video-playback.spec.ts`)
   - Video element loading verification
   - Metadata loading (duration, readyState)
   - Thumbnail/poster display
   - Error handling

2. **Video Playback**
   - Autoplay functionality
   - Video switching on scroll
   - Play/pause controls

3. **Volume Controls**
   - Volume button visibility on hover
   - Mute/unmute toggle
   - Volume slider interaction

4. **Progress Bar**
   - Progress display
   - Time display on hover
   - Seek functionality

5. **Network Monitoring**
   - Video request verification
   - Content-type validation

## Testing Video Loading

The project uses a hybrid approach to test video loading:

### Unit Tests
- Mock `HTMLVideoElement` with controllable properties
- Simulate video events (`loadedmetadata`, `timeupdate`)
- Fast execution, isolated from network

### E2E Tests
- Use real video sources from Pexels API
- Verify actual loading behavior
- Check `readyState`, `duration`, and network requests
- Monitor video loading through network tab

### Video Loading Verification Strategies

In E2E tests, we verify video loading through multiple methods:

1. **ReadyState**: Check if `video.readyState >= 1` (HAVE_METADATA)
2. **Duration**: Verify `video.duration > 0`
3. **Network Requests**: Monitor `.mp4` requests
4. **Playback State**: Check `!video.paused` for autoplay
5. **Content-Type**: Validate response headers

Example:
```typescript
// Wait for metadata to load
await page.waitForFunction(() => {
  const video = document.querySelector('video') as HTMLVideoElement;
  return video && video.duration > 0;
}, { timeout: 15000 });
```

## Writing New Tests

### Unit Test Example

```typescript
import { render, screen } from '@/__tests__/utils/testUtils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button')).toBeVisible();
});
```

## Mocking

### Video Element Mock

The `mockVideoElement.ts` utility provides helpers for mocking video behavior:

```typescript
import { createMockVideoElement, simulateTimeUpdate } from '@/__tests__/utils/mockVideoElement';

const mockVideo = createMockVideoElement({ duration: 120 });
simulateTimeUpdate(mockVideo, 60); // Simulate video at 60 seconds
```

### Custom Render

Use the custom `render` function to wrap components with providers:

```typescript
import { render } from '@/__tests__/utils/testUtils';

// Automatically wraps with AudioProvider
render(<MyComponent />);
```

## Coverage Thresholds

The project enforces minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## CI/CD Integration

Tests are configured to run in CI environments:

- Unit tests run on every push
- E2E tests run with optimized settings (retries, parallel execution)
- Coverage reports are generated and can be uploaded to coverage services

## Troubleshooting

### Common Issues

1. **"Cannot find module '@/...'"**
   - Ensure path aliases are configured in `jest.config.ts`

2. **"IntersectionObserver is not defined"**
   - Check `jest.setup.ts` has the IntersectionObserver mock

3. **"Video element mocks not working"**
   - Verify `jest.setup.ts` includes HTMLMediaElement mocks

4. **E2E tests timing out**
   - Increase timeout in `playwright.config.ts`
   - Check if dev server is running

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Use data-testid**: For elements without semantic roles
3. **Mock external APIs**: Use fixtures for consistent test data
4. **Test user interactions**: Focus on user behavior, not implementation
5. **Accessibility**: Use semantic queries (`getByRole`, `getByLabelText`)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
