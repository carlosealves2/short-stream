'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
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
        <h1 className="text-4xl font-bold mb-8">Meu Perfil</h1>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user?.name || 'Usuário'}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-xl font-semibold mb-4">Informações do Usuário</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <dt className="text-sm text-gray-400 uppercase">Nome Completo</dt>
                <dd className="mt-1 text-white">{user?.name || 'Não definido'}</dd>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <dt className="text-sm text-gray-400 uppercase">Email</dt>
                <dd className="mt-1 text-white">{user?.email || 'Não definido'}</dd>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <dt className="text-sm text-gray-400 uppercase">Username</dt>
                <dd className="mt-1 text-white">{user?.preferred_username || 'Não definido'}</dd>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <dt className="text-sm text-gray-400 uppercase">Email Verificado</dt>
                <dd className="mt-1 text-white">{user?.email_verified ? 'Sim' : 'Não'}</dd>
              </div>
              {user?.given_name && (
                <div className="bg-gray-700 p-3 rounded">
                  <dt className="text-sm text-gray-400 uppercase">Primeiro Nome</dt>
                  <dd className="mt-1 text-white">{user.given_name}</dd>
                </div>
              )}
              {user?.family_name && (
                <div className="bg-gray-700 p-3 rounded">
                  <dt className="text-sm text-gray-400 uppercase">Sobrenome</dt>
                  <dd className="mt-1 text-white">{user.family_name}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
