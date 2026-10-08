import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { listingsService } from '../services/listingsService';
import { ListingCard } from '../components/listings/ListingCard';
import { ListingFormModal } from '../components/listings/ListingFormModal';
import { DeleteConfirmModal } from '../components/listings/DeleteConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  LISTING_CATEGORIES,
  SELLER_ROLES,
  INDIAN_STATES,
} from '../constants/listings';

export function ListingsPage() {
  const { user, isAuthenticated, login } = useAuth();

  // Listings data state
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [deletingListing, setDeletingListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load listings from backend
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = {
        status: 'ACTIVE',
        limit: 50,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (selectedState) params.state = selectedState;
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedRole) params.sellerRole = selectedRole;

      const result = await listingsService.getListings(params);
      const items = Array.isArray(result) ? result : result.listings || [];
      setListings(items);
    } catch (err) {
      console.error('[ListingsPage] Error fetching listings:', err);
      const message =
        err.statusCode === 401
          ? 'Authentication required or session expired. Please sign in.'
          : err.message || 'Unable to connect to marketplace listings. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedState, selectedDistrict, selectedRole]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Client-side text search over fetched listings
  const filteredListings = listings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query);
    const locMatch = item.location?.toLowerCase().includes(query) ||
      item.district?.toLowerCase().includes(query) ||
      item.state?.toLowerCase().includes(query);
    const catMatch = item.category?.toLowerCase().includes(query);
    const subMatch = item.subcategory?.toLowerCase().includes(query);
    const typeMatch = item.itemType?.toLowerCase().includes(query);

    return titleMatch || descMatch || locMatch || catMatch || subMatch || typeMatch;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedRole('');
  };

  // Open Create Form
  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setEditingListing(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (listing) => {
    setEditingListing(listing);
    setIsFormModalOpen(true);
  };

  // Handle Form Submission (Create or Update)
  const handleFormSubmit = async (payload) => {
    setIsSubmittingForm(true);
    try {
      if (editingListing) {
        await listingsService.updateListing(editingListing.listingId, payload);
        setFeedback({
          type: 'success',
          message: `Listing "${payload.title}" updated successfully!`,
        });
      } else {
        await listingsService.createListing(payload);
        setFeedback({
          type: 'success',
          message: `Listing "${payload.title}" created successfully and published to marketplace!`,
        });
      }

      setIsFormModalOpen(false);
      setEditingListing(null);
      await fetchListings();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (listing) => {
    setDeletingListing(listing);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    setIsDeleting(true);
    try {
      await listingsService.deleteListing(deletingListing.listingId);
      setFeedback({
        type: 'success',
        message: `Listing "${deletingListing.title}" was successfully deleted.`,
      });
      setDeletingListing(null);
      await fetchListings();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete listing. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedState || selectedDistrict || selectedRole
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-100">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agricultural Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Marketplace Listings
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Discover verified crop harvests, certified seed lots, and industrial biomass by-products directly from value-chain participants.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchListings()}
            disabled={isLoading}
            className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-sm disabled:opacity-50"
            title="Refresh Listings"
            aria-label="Refresh Listings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-md shadow-emerald-600/20 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Listing</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by crop, variety, seed type, location, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle for Mobile */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className={`flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition ${
                showFiltersMobile ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {hasActiveFilters && '• Active'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFiltersMobile ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns (Desktop & Mobile Expanded) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 ${
            showFiltersMobile ? 'block' : 'hidden md:grid'
          }`}
        >
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">All Categories</option>
              {LISTING_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              District
            </label>
            <input
              type="text"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              placeholder="e.g. Karnal, Ludhiana"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          {/* Seller Role Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Seller Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">All Roles</option>
              {SELLER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-800">{filteredListings.length}</strong> results matching filters
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline transition"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content States */}
      {isLoading ? (
        /* Loading State */
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
          <LoadingSpinner text="Loading marketplace listings from AgriConnect-Main..." />
        </div>
      ) : apiError ? (
        /* API Error State */
        <div className="bg-white rounded-3xl border border-red-200 p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Failed to Load Marketplace</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{apiError}</p>
          </div>
          <button
            onClick={() => fetchListings()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : filteredListings.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center max-w-2xl mx-auto shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">No Active Listings Found</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {hasActiveFilters
                ? 'No marketplace items match your search and filter criteria. Try adjusting or clearing your filters.'
                : 'There are currently no active listings published on the marketplace. Be the first to create one!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Clear Filters
              </button>
            )}

            <button
              onClick={() => fetchListings()}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create First Listing</span>
            </button>
          </div>
        </div>
      ) : (
        /* Listings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.listingId}
              listing={listing}
              currentUserId={user?.userId}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Listing Create/Edit Modal */}
      <ListingFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingListing(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingListing}
        isSubmitting={isSubmittingForm}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingListing)}
        onClose={() => setDeletingListing(null)}
        onConfirm={handleConfirmDelete}
        listingTitle={deletingListing?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ListingsPage;
