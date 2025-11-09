import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock HTMLMediaElement (video/audio)
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  get() {
    return this._muted || false;
  },
  set(value) {
    this._muted = value;
  },
});

Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
  get() {
    return this._volume !== undefined ? this._volume : 1;
  },
  set(value) {
    this._volume = value;
  },
});

Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
  get() {
    return this._currentTime || 0;
  },
  set(value) {
    this._currentTime = value;
  },
});

Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
  get() {
    return this._duration || 0;
  },
  set(value) {
    this._duration = value;
  },
});

Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
  get() {
    return this._paused !== undefined ? this._paused : true;
  },
});

HTMLMediaElement.prototype.play = jest.fn().mockImplementation(function () {
  this._paused = false;
  return Promise.resolve();
});

HTMLMediaElement.prototype.pause = jest.fn().mockImplementation(function () {
  this._paused = true;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
