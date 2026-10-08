import React from 'react';

const ROLE_CONFIG = {
  SEED_PRODUCER: {
    label: 'Seed Producer',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  FARMER: {
    label: 'Farmer / Grower',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  BYPRODUCT_SELLER: {
    label: 'By-product Seller',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  BUYER: {
    label: 'Buyer / Procurement',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  SERVICE_PROVIDER: {
    label: 'Service Provider',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  PROCESSOR: {
    label: 'Processor / Industry',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  ADMIN: {
    label: 'Administrator',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export function RoleBadge({ role, className = '' }) {
  const normalized = (role || 'FARMER').toUpperCase();
  const config = ROLE_CONFIG[normalized] || {
    label: role || 'Participant',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
}

export default RoleBadge;
