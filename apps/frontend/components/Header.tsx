'use client';

export function Header() {
  return (
    <>
      {/* Notifications Button - positioned individually */}
      <button
        className="fixed top-4 right-36 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-900 transition-colors text-gray-300 hover:text-white z-40"
        aria-label="Notificações"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </button>

      {/* User Avatar - positioned individually */}
      <button
        className="fixed top-4 right-6 flex items-center gap-2 hover:opacity-80 transition-opacity z-40"
        aria-label="Perfil do usuário"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold border-2 border-gray-700">
          M
        </div>
        <span className="text-white font-medium">Meu Perfil</span>
      </button>
    </>
  );
}
