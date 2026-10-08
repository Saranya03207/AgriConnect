import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../auth/AuthContext';

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getMe();
      setProfile(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <User className="w-6 h-6 text-emerald-600" />
            <span>User Profile</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time profile data retrieved from API Gateway Lambda backend via <code className="text-xs bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800">GET /users/me</code>
          </p>
        </div>

        <button
          onClick={fetchProfile}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-slate-800">Querying Lambda API...</h3>
          <p className="text-xs text-slate-500 mt-1">Executing authenticated GET /users/me with Bearer token</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900">Failed to Retrieve Profile</h3>
              <p className="text-xs text-red-700 mt-1">{error.message || 'An unknown network error occurred.'}</p>
              {error.statusCode ? (
                <p className="text-[11px] text-red-600 font-mono mt-2">HTTP Status: {error.statusCode}</p>
              ) : null}
              <button
                onClick={fetchProfile}
                className="mt-4 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 transition"
              >
                Retry Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card View */}
      {!isLoading && !error && profile && (
        <div className="space-y-6">
          {/* Main Profile Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-800 text-2xl font-bold">
                {profile.displayName?.[0]?.toUpperCase() ||
                  profile.email?.[0]?.toUpperCase() ||
                  authUser?.email?.[0]?.toUpperCase() ||
                  'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl font-bold text-slate-900 truncate">
                    {profile.displayName || authUser?.displayName || 'AgriConnect User'}
                  </h2>
                  {profile.isVerified && (
                    <span className="inline-flex items-center text-emerald-600 text-xs" title="Verified Account">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.email || authUser?.email || 'N/A'}</span>
                  </span>
                  {profile.phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.phone}</span>
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Role: {profile.role || authUser?.role || 'FARMER'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                    Status: {profile.isActive !== false ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Flexible Attributes Grid (Safely renders any backend attributes returned) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Account & Profile Attributes
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <dt className="text-slate-400 font-medium">User Identifier (Cognito Sub)</dt>
                <dd className="mt-1 font-mono text-slate-800 break-all">
                  {profile.userId || authUser?.userId || 'N/A'}
                </dd>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <dt className="text-slate-400 font-medium">Email Verified</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {profile.isVerified ? 'Yes (Verified)' : 'Pending Verification'}
                </dd>
              </div>

              {profile.createdAt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <dt className="text-slate-400 font-medium">Profile Created</dt>
                  <dd className="mt-1 text-slate-800">{new Date(profile.createdAt).toLocaleString()}</dd>
                </div>
              )}

              {profile.updatedAt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <dt className="text-slate-400 font-medium">Last Updated</dt>
                  <dd className="mt-1 text-slate-800">{new Date(profile.updatedAt).toLocaleString()}</dd>
                </div>
              )}

              {profile.bio && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <dt className="text-slate-400 font-medium">Bio / Notes</dt>
                  <dd className="mt-1 text-slate-800">{profile.bio}</dd>
                </div>
              )}

              {profile.location && typeof profile.location === 'object' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <dt className="text-slate-400 font-medium">Location Details</dt>
                  <dd className="mt-1 text-slate-800 font-mono">
                    {JSON.stringify(profile.location, null, 2)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Raw JSON Debug Renderer Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-slate-500" />
                <span>Backend Response Payload (Raw JSON Inspector)</span>
              </div>
              <span className="text-[11px] text-emerald-600 underline">
                {showRawJson ? 'Hide JSON' : 'Show JSON'}
              </span>
            </button>

            {showRawJson && (
              <pre className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono max-h-80">
                {JSON.stringify(profile, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
