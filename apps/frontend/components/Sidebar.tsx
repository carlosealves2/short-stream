'use client';

import { useState } from 'react';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('para-voce');

  return (
    <>
      {/* Para Você */}
      <button
        onClick={() => setActiveTab('para-voce')}
        className={`fixed left-2 top-4 flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors z-40 ${
          activeTab === 'para-voce'
            ? 'bg-gray-800 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-900'
        }`}
        aria-label="Para você"
      >
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span className="text-xs mt-1">Início</span>
      </button>

      {/* Carregar */}
      <button
        onClick={() => setActiveTab('carregar')}
        className={`fixed left-2 top-24 flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors z-40 ${
          activeTab === 'carregar'
            ? 'bg-gray-800 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-900'
        }`}
        aria-label="Carregar vídeo"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="text-xs mt-1">Upload</span>
      </button>

      {/* Perfil */}
      <button
        onClick={() => setActiveTab('perfil')}
        className={`fixed left-2 top-44 flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors z-40 ${
          activeTab === 'perfil'
            ? 'bg-gray-800 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-900'
        }`}
        aria-label="Perfil"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
          U
        </div>
        <span className="text-xs mt-1">Perfil</span>
      </button>
    </>
  );
}
