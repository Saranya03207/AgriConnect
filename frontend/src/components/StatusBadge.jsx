import React from 'react';

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
    const isAct = String(status).toLowerCase() === 'active';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          isAct
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        } ${className}`}
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
