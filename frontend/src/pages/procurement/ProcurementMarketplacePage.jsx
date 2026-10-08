import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { procurementService } from '../../services/procurementService';
import { RFQCard, RFQFormModal } from '../../components/procurement';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  PROCUREMENT_CATEGORIES,
  INDIAN_STATES,
} from '../../constants/procurement';

export function ProcurementMarketplacePage() {
  const { user, isAuthenticated } = useAuth();

  // State
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Tabs: 'marketplace' | 'my-requests'
  const [activeTab, setActiveTab] = useState('marketplace');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('OPEN');

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const userRole = (user?.role || '').toUpperCase();
  const canCreateRFQ = isAuthenticated && (userRole === 'BUYER' || userRole === 'PROCESSOR' || userRole === 'ADMIN');
  const isSellerRole = isAuthenticated && (userRole === 'FARMER' || userRole === 'SEED_PRODUCER' || userRole === 'BYPRODUCT_SELLER' || userRole === 'PROCESSOR' || userRole === 'SERVICE_PROVIDER');

  const fetchRFQs = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      if (activeTab === 'my-requests') {
        const result = await procurementService.getMyRFQs();
        setRfqs(result.items || []);
      } else {
        const params = {
          status: selectedStatus || 'OPEN',
          productCategory: selectedCategory || undefined,
          preferredState: selectedState || undefined,
          preferredDistrict: selectedDistrict || undefined,
          limit: 50,
        };
        const result = await procurementService.getRFQs(params);
        setRfqs(result.items || []);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load procurement requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [activeTab, selectedCategory, selectedState, selectedDistrict, selectedStatus]);

  const handleCreateSubmit = async (payload) => {
    await procurementService.createRFQ(payload);
    setSuccessMessage('Procurement request published successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
    fetchRFQs(true);
  };

  // Client-side text search filtering
  const filteredRFQs = useMemo(() => {
    if (!searchQuery.trim()) return rfqs;
    const query = searchQuery.toLowerCase().trim();
    return rfqs.filter((item) => {
      return (
        item.title?.toLowerCase().includes(query) ||
        item.productName?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.preferredDistrict?.toLowerCase().includes(query) ||
        item.preferredState?.toLowerCase().includes(query) ||
        item.productCategory?.toLowerCase().includes(query)
      );
    });
  }, [rfqs, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            B2B Procurement & Quotations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Procurement Requests & RFQ
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Post bulk agricultural procurement requests or submit competitive quotations. Connect directly across crops, seeds, residues, and industrial biomass.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {canCreateRFQ && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-emerald-900 hover:bg-emerald-50 shadow transition transform active:scale-95"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                Post New Requirement
              </button>
            )}
            {isAuthenticated && (
              <Link
                to="/procurement/my-responses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-600/40 transition"
              >
                <FileText className="w-4 h-4" />
                My Submitted Quotations
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      {isAuthenticated && (
        <div className="flex items-center border-b border-slate-200">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'marketplace'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Marketplace Requests
          </button>

          <button
            onClick={() => setActiveTab('my-requests')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'my-requests'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            My Requests
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, product, location, or requirements..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchRFQs(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Refresh requests"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {PROCUREMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              District
            </label>
            <input
              type="text"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              placeholder="e.g. Coimbatore"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700"
            >
              <option value="OPEN">Open Only</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading procurement requests...</p>
        </div>
      ) : filteredRFQs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No procurement requests found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {searchQuery || selectedCategory || selectedState || selectedDistrict
              ? 'Try adjusting your search criteria or clearing active filters.'
              : 'Be the first to post a procurement requirement or check back soon.'}
          </p>
          {canCreateRFQ && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Post Procurement Requirement
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRFQs.map((rfq) => (
            <RFQCard
              key={rfq.rfqId}
              rfq={rfq}
              isOwner={user?.userId === rfq.buyerId}
            />
          ))}
        </div>
      )}

      {/* Create RFQ Modal */}
      <RFQFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Create Procurement Request"
      />
    </div>
  );
}

export default ProcurementMarketplacePage;
