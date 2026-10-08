import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { procurementService } from '../../services/procurementService';
import { RFQCard, RFQFormModal } from '../../components/procurement';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export function MyRequestsPage() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchMyRFQs = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await procurementService.getMyRFQs();
      setRfqs(data.items || []);
    } catch (err) {
      setError(err?.message || 'Failed to load your procurement requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyRFQs();
  }, []);

  const handleCreateSubmit = async (payload) => {
    await procurementService.createRFQ(payload);
    fetchMyRFQs(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/procurement" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Procurement Marketplace
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            My Procurement Requests
          </h1>
          <p className="text-xs text-slate-500">
            Manage your published requirements and track supplier responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMyRFQs(true)}
            disabled={loading || refreshing}
            className="p-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Post Requirement
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading your requests...</p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No requests published yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Post what products, crops, or by-products you need and receive quotations.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Post Requirement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rfqs.map((rfq) => (
            <RFQCard key={rfq.rfqId} rfq={rfq} isOwner={true} />
          ))}
        </div>
      )}

      <RFQFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Create Procurement Request"
      />
    </div>
  );
}

export default MyRequestsPage;
