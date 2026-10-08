import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sprout, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { isAuthenticated, isLoading, authError, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        {/* Brand Logo */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 mb-4">
          <Sprout className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to AgriConnect</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Secure, role-aware authentication managed via Amazon Cognito User Pools.
        </p>

        {/* Auth Error Banner if callback failed */}
        {authError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700">
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>OIDC Authorization Code Flow with PKCE</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            You will be redirected to the secure Amazon Cognito login portal to sign in with your email and password.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={login}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>{isLoading ? 'Verifying...' : 'Continue to Cognito Login'}</span>
        </button>

        <div className="mt-6 text-xs text-slate-400">
          <p>Seed Producers • Farmers • By-product Sellers • Buyers • Service Providers • Processors</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
