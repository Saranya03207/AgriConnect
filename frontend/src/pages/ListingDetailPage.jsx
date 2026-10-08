import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  IndianRupee,
  ShieldCheck,
  Phone,
  MessageSquare,
  AlertCircle,
  Tag,
  Edit2,
  Trash2,
  Sprout,
  Wheat,
  Layers,
  Flame,
  Boxes,
  Compass,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { listingsService } from '../services/listingsService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RoleBadge } from '../components/RoleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ListingFormModal } from '../components/listings/ListingFormModal';
import { DeleteConfirmModal } from '../components/listings/DeleteConfirmModal';
import {
  formatPrice,
  formatQuantity,
  formatDate,
  formatDateTime,
  formatCategory,
  formatRole,
} from '../utils/formatters';

const CATEGORY_THEME = {
  SEEDS: { icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  CROPS: { icon: Wheat, color: 'text-green-600', bg: 'bg-green-50' },
  BY_PRODUCTS: { icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
  BIOMASS: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  RAW_MATERIALS: { icon: Boxes, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

export function ListingDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Owner action modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await listingsService.getListingById(listingId);
        setListing(data);
      } catch (err) {
        console.error('[ListingDetailPage] Error fetching listing:', err);
        setError(err.message || 'Failed to load listing information.');
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
  }, [listingId]);

  const isOwner = Boolean(user?.userId && listing?.sellerId && user.userId === listing.sellerId);

  const handleEditSubmit = async (payload) => {
    setIsSubmittingEdit(true);
    try {
      const updated = await listingsService.updateListing(listing.listingId, payload);
      setListing(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await listingsService.deleteListing(listing.listingId);
      navigate('/listings', { replace: true });
    } catch (err) {
      alert(err.message || 'Failed to delete listing.');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm max-w-4xl mx-auto my-8">
        <LoadingSpinner text="Retrieving listing details from marketplace..." />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-white rounded-3xl border border-red-200 p-12 text-center max-w-lg mx-auto my-8 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Listing Not Found</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {error || `The listing "${listingId}" does not exist or has been removed from the marketplace.`}
        </p>
        <div className="pt-2">
          <Link
            to="/listings"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </Link>
        </div>
      </div>
    );
  }

  const category = (listing.category || 'CROPS').toUpperCase();
  const theme = CATEGORY_THEME[category] || CATEGORY_THEME.CROPS;
  const CategoryIcon = theme.icon;

  const getDisplayUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string' && img.trim() !== '') return img.trim();
    if (typeof img === 'object' && img.url && typeof img.url === 'string') return img.url.trim();
    return null;
  };

  const rawImages = (Array.isArray(listing.images) && listing.images.length > 0)
    ? listing.images
    : (Array.isArray(listing.imageUrls) ? listing.imageUrls : []);
  const images = rawImages.map(getDisplayUrl).filter(Boolean);
  const currentImage = images[selectedImageIndex] || images[0] || null;


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/listings"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>

        {/* Owner Controls */}
        {isOwner && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Listing</span>
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Gallery + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery & Highlights */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Hero Main Image */}
            <div className="relative h-80 sm:h-96 w-full bg-slate-100 flex items-center justify-center">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center p-6 text-center`}>
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-3 border border-slate-100">
                    <CategoryIcon className={`w-10 h-10 ${theme.color}`} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    {formatCategory(listing.category)}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Direct from Certified Value-Chain Producer</span>
                </div>
              )}

              {/* Status Floating Pill */}
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <StatusBadge status={listing.status} />
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-sm text-slate-700 border border-slate-200 shadow-sm">
                  {formatCategory(listing.category)}
                </span>
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center space-x-3 overflow-x-auto">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                      selectedImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Product Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description || 'No detailed description provided.'}
            </p>

            {/* Technical Specifications */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{formatCategory(listing.category)}</strong>
              </div>
              {listing.subcategory && (
                <div>
                  <span className="text-slate-400 block font-medium">Subcategory</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.subcategory}</strong>
                </div>
              )}
              {listing.itemType && (
                <div>
                  <span className="text-slate-400 block font-medium">Variety / Type</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.itemType}</strong>
                </div>
              )}
              {listing.quality && (
                <div>
                  <span className="text-slate-400 block font-medium">Quality Grade</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.quality}</strong>
                </div>
              )}
              {listing.availability && (
                <div>
                  <span className="text-slate-400 block font-medium">Availability</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.availability}</strong>
                </div>
              )}
              <div>
                <span className="text-slate-400 block font-medium">Date Listed</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{formatDate(listing.createdAt)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Location, & Seller Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Purchase & Price Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 mb-2">
                <span>{listing.category}</span>
                {listing.itemType && <span>• {listing.itemType}</span>}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-snug">{listing.title}</h1>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Unit Price</p>
                <div className="text-3xl font-black text-emerald-700 mt-0.5">
                  {formatPrice(listing.price, listing.currency)}
                  <span className="text-sm font-normal text-slate-600 ml-1">/ {listing.unit || 'KG'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Lot</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">
                  {formatQuantity(listing.quantity, listing.unit)}
                </p>
              </div>
            </div>

            {/* Location Box */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Origin Location</h4>
              <div className="flex items-start space-x-2.5 text-slate-700">
                <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{listing.location}</p>
                  <p className="text-xs text-slate-500">
                    {[listing.district, listing.state].filter(Boolean).join(', ')}
                  </p>
                  {(listing.latitude || listing.longitude) && (
                    <div className="mt-1 flex items-center space-x-1 text-[11px] text-slate-400">
                      <Compass className="w-3 h-3" />
                      <span>Coordinates: {listing.latitude}, {listing.longitude}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Info Box */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Credentials</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {listing.sellerRole?.[0] || 'S'}
                  </div>
                  <div>
                    <RoleBadge role={listing.sellerRole} />
                    <p className="text-[11px] text-slate-400 mt-1">Verified Cognito Identity</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 inline-block" />
                </div>
              </div>
            </div>

            {/* Contact Seller Action Placeholder */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Direct In-App Messaging</p>
                  <p className="mt-0.5 text-slate-500">
                    Direct secure negotiation & trade messaging module will be enabled in Phase 3.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-emerald-600/60 text-white font-semibold text-sm cursor-not-allowed shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Contact Seller (Messaging Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ListingFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={listing}
        isSubmitting={isSubmittingEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        listingTitle={listing?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ListingDetailPage;
