'use client';

export function ScrollButtons() {
  const getCurrentIndex = () => {
    const container = document.getElementById('video-feed-container');
    if (!container) return 0;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    return Math.round(scrollTop / containerHeight);
  };

  const scrollUp = () => {
    const container = document.getElementById('video-feed-container');
    if (!container) return;

    const currentIndex = getCurrentIndex();

    if (currentIndex > 0) {
      const targetElement = container.querySelector(`[data-index="${currentIndex - 1}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const scrollDown = () => {
    const container = document.getElementById('video-feed-container');
    if (!container) return;

    const currentIndex = getCurrentIndex();
    const videoCards = container.querySelectorAll('[data-index]');

    if (currentIndex < videoCards.length - 1) {
      const targetElement = container.querySelector(`[data-index="${currentIndex + 1}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
      {/* Scroll Up Button */}
      <button
        onClick={scrollUp}
        className="w-12 h-12 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-white transition-colors backdrop-blur-sm border border-gray-700"
        aria-label="Vídeo anterior"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {/* Scroll Down Button */}
      <button
        onClick={scrollDown}
        className="w-12 h-12 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-white transition-colors backdrop-blur-sm border border-gray-700"
        aria-label="Próximo vídeo"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  );
}
