import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, ChevronRight, User } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { RoleBadge } from '../RoleBadge';

export function RFQCard({ rfq, isOwner = false }) {
  if (!rfq) return null;

  const formattedTargetPrice = rfq.targetPrice
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: rfq.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(rfq.targetPrice)
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
      <div>
        {/* Top Header: Status and Role */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <StatusBadge status={rfq.status} />
            {isOwner && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                My Request
              </span>
            )}
          </div>
          <RoleBadge role={rfq.buyerRole || 'BUYER'} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-1.5 hover:text-emerald-700 transition">
          <Link to={`/procurement/${rfq.rfqId}`}>{rfq.title}</Link>
        </h3>

        {/* Product and Category */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mb-3">
          <span className="font-semibold text-slate-800">{rfq.productName}</span>
          {rfq.productCategory && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              <Tag className="w-3 h-3 mr-1 text-slate-400" />
              {rfq.productCategory.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Description Snippet */}
        {rfq.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {rfq.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Quantity Needed
            </span>
            <span className="font-semibold text-slate-800">
              {rfq.quantity} {rfq.unit}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Target Price
            </span>
            <span className="font-semibold text-slate-800">
              {formattedTargetPrice ? `${formattedTargetPrice} / ${rfq.unit}` : 'Negotiable'}
            </span>
          </div>
        </div>

        {/* Location & Date Meta */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {[rfq.preferredLocation, rfq.preferredDistrict, rfq.preferredState]
                .filter(Boolean)
                .join(', ') || 'Not specified'}
            </span>
          </div>
          {rfq.requiredByDate && (
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
              <span>Required by: <strong className="text-slate-700">{rfq.requiredByDate}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : ''}
        </span>
        <Link
          to={`/procurement/${rfq.rfqId}`}
          className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition py-1 px-2.5 rounded-lg hover:bg-emerald-50"
        >
          View Details
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}

export default RFQCard;
