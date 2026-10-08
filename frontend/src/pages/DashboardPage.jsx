import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  FileText,
  Package,
  Wrench,
  ArrowRight,
  ShieldCheck,
  User,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const ROLE_INFO = {
  SEED_PRODUCER: {
    label: 'Seed Producer',
    description: 'Certified seeds, seedlings, and high-yield crop varieties.',
  },
  FARMER: {
    label: 'Farmer / Crop Producer',
    description: 'Fresh crop cultivation, produce supply, and residue exchange.',
  },
  BYPRODUCT_SELLER: {
    label: 'By-product Seller',
    description: 'Farm biomass, husk, straw, bagasse, and agro-residues.',
  },
  BUYER: {
    label: 'Buyer / Procurement',
    description: 'Agricultural produce procurement, RFQs, and wholesale buying.',
  },
  SERVICE_PROVIDER: {
    label: 'Service Provider',
    description: 'Machinery rental, seasonal labour, logistics, and cold storage.',
  },
  PROCESSOR: {
    label: 'Processor / Agro-Industry',
    description: 'Agro-processing units, bio-energy, mills, and raw material intake.',
  },
  ADMIN: {
    label: 'Administrator',
    description: 'Platform oversight, user verification, and ecosystem moderation.',
  },
};

export function DashboardPage() {
  const { user } = useAuth();
  const roleKey = user?.role?.toUpperCase() || 'FARMER';
  const roleData = ROLE_INFO[roleKey] || {
    label: roleKey,
    description: 'Agricultural value chain participant.',
  };

  const QUICK_LINKS = [
    {
      title: 'Marketplace Listings',
      description: 'Discover certified seeds, freshly harvested produce, and agricultural by-products.',
      path: '/listings',
      icon: ShoppingBag,
      color: 'emerald',
      badge: 'Active Catalog',
    },
    {
      title: 'Buyer Procurement (RFQs)',
      description: 'Post and browse high-volume buying requirements and industrial biomass requests.',
      path: '/procurement',
      icon: FileText,
      color: 'blue',
      badge: 'Demand Match',
    },
    {
      title: 'Orders & Transactions',
      description: 'Track agricultural contracts, delivery statuses, and order fulfillment.',
      path: '/orders',
      icon: Package,
      color: 'amber',
      badge: 'Fulfillment',
    },
    {
      title: 'Shared Services',
      description: 'Find or offer farm machinery, seasonal harvesting labour, transport, and storage.',
      path: '/services',
      icon: Wrench,
      color: 'purple',
      badge: 'Machinery & Labour',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cognito Authenticated Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.displayName || 'Partner'}!
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
              You are signed in as a{' '}
              <strong className="text-emerald-700 font-semibold">{roleData.label}</strong>. {roleData.description}
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              to="/profile"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>View Profile (GET /users/me)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Platform Core Modules</span>
          </h2>
          <span className="text-xs text-slate-500">Quick Navigation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUICK_LINKS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.path}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <span>Enter Module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="bg-slate-100/70 rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
        <div className="flex items-center space-x-2 mb-2 font-semibold text-slate-800">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>System Environment Status</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-1">API Base URL</span>
            <span className="font-mono text-slate-700 break-all">
              {import.meta.env.VITE_API_BASE_URL || 'Configured'}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-1">Cognito User Pool</span>
            <span className="font-mono text-slate-700">
              {import.meta.env.VITE_COGNITO_USER_POOL_ID || 'Connected'}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block mb-1">Authentication Flow</span>
            <span className="font-semibold text-emerald-700">
              OIDC Authorization Code (PKCE)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
