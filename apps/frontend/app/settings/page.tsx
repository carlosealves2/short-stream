'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Configurações</h1>

        <div className="space-y-6">
          {/* Seção de Conta */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Conta</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <p className="text-white">{user?.name || 'Não definido'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <p className="text-white">{user?.email || 'Não definido'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <p className="text-white">{user?.preferred_username || 'Não definido'}</p>
              </div>
            </div>
          </div>

          {/* Seção de Preferências */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Preferências</h2>
            <p className="text-gray-400">
              Configurações de preferências em desenvolvimento...
            </p>
          </div>

          {/* Seção de Privacidade */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Privacidade</h2>
            <p className="text-gray-400">
              Configurações de privacidade em desenvolvimento...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
