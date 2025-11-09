import { renderHook, act } from '@testing-library/react';
import { AudioProvider, useAudio } from '../AudioContext';

describe('AudioContext', () => {
  describe('AudioProvider', () => {
    it('should provide initial audio state', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      expect(result.current.volume).toBe(1);
      expect(result.current.isMuted).toBe(false);
    });

    it('should throw error when useAudio is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAudio());
      }).toThrow('useAudio must be used within an AudioProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Volume management', () => {
    it('should update volume when setVolume is called', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
    });

    it('should allow setting volume to 0', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      act(() => {
        result.current.setVolume(0);
      });

      expect(result.current.volume).toBe(0);
    });

    it('should allow setting volume to maximum (1)', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      act(() => {
        result.current.setVolume(1);
      });

      expect(result.current.volume).toBe(1);
    });
  });

  describe('Mute management', () => {
    it('should toggle mute state when toggleMute is called', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
    });

    it('should set mute state directly with setIsMuted', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      act(() => {
        result.current.setIsMuted(true);
      });

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.setIsMuted(false);
      });

      expect(result.current.isMuted).toBe(false);
    });
  });

  describe('Global state persistence', () => {
    it('should maintain same state when volume is updated', () => {
      const { result } = renderHook(() => useAudio(), {
        wrapper: AudioProvider,
      });

      const initialVolume = result.current.volume;
      expect(initialVolume).toBe(1);

      act(() => {
        result.current.setVolume(0.7);
      });

      // Volume should be updated
      expect(result.current.volume).toBe(0.7);

      // Mute state should remain unchanged
      expect(result.current.isMuted).toBe(false);
    });
  });
});
