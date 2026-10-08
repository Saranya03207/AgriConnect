import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sprout, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function PublicLayout() {
  const { isAuthenticated, user, login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Agri<span className="text-emerald-600">Connect</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 font-medium rounded-full bg-emerald-100 text-emerald-800">
                AI Value-Chain
              </span>
            </div>
          </Link>

          <nav className="flex items-center space-x-3 sm:space-x-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition">
              Home
            </Link>
            <Link to="/listings" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition">
              Marketplace
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard ({user?.displayName || 'My Account'})</span>
              </Link>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center space-x-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">AgriConnect Platform</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-slate-400">
            AI-powered agricultural value-chain connecting producers, processors & buyers.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;