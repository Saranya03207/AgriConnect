import React from 'react';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FULFILLED: 'bg-blue-50 text-blue-700 border-blue-200',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
  WITHDRAWN: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  SOLD: 'bg-purple-50 text-purple-700 border-purple-200',
  EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function StatusBadge({ status, active = true, verified = false, className = '' }) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 ${className}`}
      >
        Verified
      </span>
    );
  }

  if (status) {
    const norm = String(status).toUpperCase();
    const style = STATUS_STYLES[norm] || 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200'
      } ${className}`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default StatusBadge;
