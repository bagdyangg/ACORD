import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <Link href="/">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );
}