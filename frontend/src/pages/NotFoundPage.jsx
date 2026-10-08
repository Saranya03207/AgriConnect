import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        <Sprout className="w-8 h-8 text-emerald-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested page does not exist or has been relocated within the AgriConnect portal.
      </p>

      <div className="mt-6 flex items-center space-x-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
        {isAuthenticated && (
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default NotFoundPage;
