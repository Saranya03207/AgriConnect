import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Tag,
  Package,
  Calendar,
  Edit2,
  Trash2,
  Sprout,
  Wheat,
  Layers,
  Flame,
  Boxes,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatPrice, formatQuantity, formatDate, formatCategory } from '../../utils/formatters';
import { RoleBadge } from '../RoleBadge';
import { StatusBadge } from '../StatusBadge';

// Category color and icon map for agricultural styling
const CATEGORY_THEME = {
  SEEDS: {
    icon: Sprout,
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    placeholderBg: 'from-emerald-50 to-emerald-100/70',
    iconColor: 'text-emerald-600',
  },
  CROPS: {
    icon: Wheat,
    badgeBg: 'bg-green-50 text-green-800 border-green-200',
    placeholderBg: 'from-green-50 to-green-100/70',
    iconColor: 'text-green-600',
  },
  BY_PRODUCTS: {
    icon: Layers,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    placeholderBg: 'from-amber-50 to-amber-100/70',
    iconColor: 'text-amber-600',
  },
  BIOMASS: {
    icon: Flame,
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    placeholderBg: 'from-orange-50 to-orange-100/70',
    iconColor: 'text-orange-600',
  },
  RAW_MATERIALS: {
    icon: Boxes,
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    placeholderBg: 'from-indigo-50 to-indigo-100/70',
    iconColor: 'text-indigo-600',
  },
};

export function ListingCard({
  listing,
  currentUserId,
  onEdit,
  onDelete,
}) {
  const [imageError, setImageError] = useState(false);

  const {
    listingId,
    sellerId,
    sellerRole,
    title,
    category,
    subcategory,
    itemType,
    quantity,
    unit,
    price,
    currency = 'INR',
    location,
    district,
    state,
    quality,
    availability,
    images = [],
    status = 'ACTIVE',
    createdAt,
  } = listing;

  const isOwner = Boolean(currentUserId && sellerId && currentUserId === sellerId);
  const normalizedCategory = (category || 'CROPS').toUpperCase();
  const theme = CATEGORY_THEME[normalizedCategory] || CATEGORY_THEME.CROPS;
  const CategoryIcon = theme.icon;

  const getDisplayUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string' && img.trim() !== '') return img.trim();
    if (typeof img === 'object' && img.url && typeof img.url === 'string') return img.url.trim();
    return null;
  };

  const rawFirst = (images && images.length > 0) ? images[0] : (listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null);
  const candidateUrl = getDisplayUrl(rawFirst);
  const displayImage = (!imageError && candidateUrl) ? candidateUrl : null;


  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Top Media / Thumbnail Section */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Clean Agricultural Placeholder */
          <div className={`w-full h-full bg-gradient-to-br ${theme.placeholderBg} flex flex-col items-center justify-center p-4 text-center select-none`}>
            <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center mb-2 border border-white">
              <CategoryIcon className={`w-7 h-7 ${theme.iconColor}`} />
            </div>
            <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              {formatCategory(category)}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">AgriConnect Marketplace</span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <StatusBadge status={status} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-white/95 backdrop-blur-sm ${theme.badgeBg}`}>
            {formatCategory(category)}
          </span>
        </div>

        {isOwner && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="w-3 h-3" />
              <span>Your Listing</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Subcategory & Item Type header */}
          {(subcategory || itemType) && (
            <p className="text-xs font-medium text-emerald-700 tracking-wide mb-1 truncate">
              {[subcategory, itemType].filter(Boolean).join(' • ')}
            </p>
          )}

          {/* Title */}
          <Link
            to={`/listings/${listingId}`}
            className="block text-base font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug"
          >
            {title}
          </Link>

          {/* Pricing & Quantity Banner */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Price</p>
              <p className="text-base font-extrabold text-emerald-700 leading-tight">
                {formatPrice(price, currency)}
                <span className="text-xs font-normal text-slate-500 ml-1">/ {unit || 'KG'}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Available Qty</p>
              <div className="flex items-center justify-end space-x-1 text-slate-700 font-bold text-xs mt-0.5">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatQuantity(quantity, unit)}</span>
              </div>
            </div>
          </div>

          {/* Location & Metadata */}
          <div className="mt-3 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {[location, district, state].filter(Boolean).join(', ') || 'Location not specified'}
              </span>
            </div>

            {(quality || availability) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quality && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                    Quality: {quality}
                  </span>
                )}
                {availability && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700">
                    {availability}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Area: Seller Role + Date */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <RoleBadge role={sellerRole} />
          </div>
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center space-x-2">
          <Link
            to={`/listings/${listingId}`}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Owner-only Edit and Delete Controls */}
          {isOwner && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => onEdit && onEdit(listing)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Edit Listing"
                aria-label="Edit Listing"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete && onDelete(listing)}
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                title="Delete Listing"
                aria-label="Delete Listing"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingCard;
