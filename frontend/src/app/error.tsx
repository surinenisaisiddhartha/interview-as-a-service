'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6 max-w-md">{error.message}</p>
            <button onClick={reset} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Try Again</button>
        </div>
    );
}
