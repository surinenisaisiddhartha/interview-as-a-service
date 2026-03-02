import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
            <div className="text-8xl font-black text-gray-200 mb-4">404</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
            <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Go Home</Link>
        </div>
    );
}
