type MockVideoElement = HTMLVideoElement & {
  _muted: boolean;
  _volume: number;
  _currentTime: number;
  _duration: number;
  _paused: boolean;
  _readyState: number;
};

/**
 * Creates a mock video element with controllable properties and methods
 */
export function createMockVideoElement(overrides: Partial<HTMLVideoElement> = {}) {
  const mockVideo = {
    _muted: false,
    _volume: 1,
    _currentTime: 0,
    _duration: 60,
    _paused: true,
    _readyState: 4, // HAVE_ENOUGH_DATA

    get muted(): boolean {
      return this._muted;
    },
    set muted(value: boolean) {
      this._muted = value;
    },

    get volume(): number {
      return this._volume;
    },
    set volume(value: number) {
      this._volume = value;
    },

    get currentTime(): number {
      return this._currentTime;
    },
    set currentTime(value: number) {
      this._currentTime = value;
    },

    get duration(): number {
      return this._duration;
    },

    get paused(): boolean {
      return this._paused;
    },

    get readyState(): number {
      return this._readyState;
    },

    play: jest.fn().mockImplementation(function (this: MockVideoElement) {
      this._paused = false;
      return Promise.resolve();
    }),

    pause: jest.fn().mockImplementation(function (this: MockVideoElement) {
      this._paused = true;
    }),

    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),

    ...overrides,
  };

  return mockVideo as unknown as HTMLVideoElement;
}

/**
 * Simulates video loading by updating readyState and duration
 */
export function simulateVideoLoad(video: MockVideoElement, duration: number = 60) {
  video._duration = duration;
  video._readyState = 4;

  // Trigger loadedmetadata event
  const loadEvent = new Event('loadedmetadata');
  video.dispatchEvent(loadEvent);
}

/**
 * Simulates video time update
 */
export function simulateTimeUpdate(video: MockVideoElement, currentTime: number) {
  video._currentTime = currentTime;

  const timeUpdateEvent = new Event('timeupdate');
  video.dispatchEvent(timeUpdateEvent);
}
