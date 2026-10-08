import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Factory,
  Truck,
  Repeat,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const VALUE_CHAIN_ROLES = [
  {
    title: 'Seed Producers',
    desc: 'List certified seeds, seedlings, high-yield varieties, and verified plant material directly to growers.',
    icon: Sprout,
    tag: 'Production Start',
  },
  {
    title: 'Farmers & Crop Growers',
    desc: 'Showcase freshly harvested produce, grains, pulses, fruits, and vegetables to bulk purchasers.',
    icon: Users,
    tag: 'Primary Producer',
  },
  {
    title: 'By-product Sellers',
    desc: 'Monetize agricultural residues—coconut husk, paddy straw, bagasse, and stalks—connecting to industry.',
    icon: Repeat,
    tag: 'Circular Economy',
  },
  {
    title: 'Buyers & Procurement',
    desc: 'Post procurement RFQs, source verified quality agricultural commodities, and fulfill supply chains.',
    icon: ShoppingBag,
    tag: 'Market Demand',
  },
  {
    title: 'Service Providers',
    desc: 'Offer farm machinery rental, seasonal harvesting labour, transport fleet, and cold storage.',
    icon: Truck,
    tag: 'Resource Sharing',
  },
  {
    title: 'Processors & Industries',
    desc: 'Source agricultural biomass and raw materials for agro-mills, coir units, bio-energy, and manufacturing.',
    icon: Factory,
    tag: 'Industrial Value-Add',
  },
];

export function LandingPage() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI-Powered Agricultural Value-Chain</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Connecting Agriculture from{' '}
              <span className="text-emerald-600">Seed to Industry</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              AgriConnect unifies seed suppliers, farmers, by-product sellers, industrial processors, and logistics providers into a single transparent, intelligent marketplace.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 transition"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <button
                  onClick={login}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 transition"
                >
                  <span>Sign In with Cognito</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              <a
                href="#roles"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-7 py-3.5 rounded-xl border border-slate-200 shadow-sm transition"
              >
                <span>Explore Ecosystem</span>
              </a>
            </div>

            {/* Platform Highlights */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left pt-8 border-t border-slate-200">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">Cognito Secured Auth</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Repeat className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">Residue Monetization</span>
              </div>
              <div className="flex items-center space-x-2.5 col-span-2 sm:col-span-1">
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">AI-Assisted Matching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Roles Section */}
      <section id="roles" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              One Unified Agricultural Platform
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Designed for every stage of the agro-economy, from cultivation and farm logistics to industrial utilization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUE_CHAIN_ROLES.map((role, idx) => {
              const Icon = role.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {role.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{role.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{role.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to participate in the agricultural value chain?
          </h2>
          <p className="mt-3 text-emerald-100 text-sm sm:text-base">
            Access listings, procurement RFQs, and agricultural machinery services.
          </p>
          <div className="mt-8">
            <button
              onClick={login}
              className="inline-flex items-center space-x-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl shadow transition"
            >
              <span>Get Started via Cognito</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
