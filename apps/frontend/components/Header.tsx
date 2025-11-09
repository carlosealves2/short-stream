'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Link from 'next/link';

export function Header() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (isLoading) {
    return null; // Ou um skeleton loading
  }

  return (
    <>
      {/* Notifications Button - apenas se autenticado */}
      {isAuthenticated && (
        <button
          className="fixed top-4 right-44 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-900 transition-colors text-gray-300 hover:text-white z-40"
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
      )}

      {/* User Section */}
      {isAuthenticated ? (
        <div className="fixed top-4 right-6 z-40">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Perfil do usuário"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold border-2 border-gray-700">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-white font-medium">
              {user?.name || user?.preferred_username || user?.email || 'Usuário'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
              <Link
                href="/profile"
                className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                Meu Perfil
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                Configurações
              </Link>
              <hr className="border-gray-700" />
              <button
                onClick={async () => {
                  setShowMenu(false);
                  await logout();
                }}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="fixed top-4 right-6 z-40">
          <button
            onClick={login}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Entrar
          </button>
        </div>
      )}
    </>
  );
}
