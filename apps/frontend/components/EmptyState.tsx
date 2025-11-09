export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="max-w-md text-center">
        {/* Icon/Illustration */}
        <div className="mb-6">
          <svg
            className="w-32 h-32 mx-auto text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-semibold mb-2">Não há vídeos</h2>
        <p className="text-gray-400 text-sm">
          Não encontramos nenhum vídeo disponível no momento.
        </p>
      </div>
    </div>
  );
}
