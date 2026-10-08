import React from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrdersPlaceholderPage() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
        <Package className="w-8 h-8" />
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
        Phase 7 Module
      </span>
      <h2 className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">Orders & Transactions</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
        Manage transactional lifecycles, contract agreements, dispatch notifications, and verified payment milestones.
      </p>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <span>Return to Dashboard</span>
        </Link>
        <Link
          to="/profile"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition"
        >
          <span>View Verified Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default OrdersPlaceholderPage;
