import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Ban,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { procurementService } from '../../services/procurementService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export function MyResponsesPage() {
  const { user } = useAuth();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchMyResponses = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await procurementService.getMyResponses();
      setResponses(data.items || []);
    } catch (err) {
      setError(err?.message || 'Failed to load your submitted quotations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyResponses();
  }, []);

  const handleWithdraw = async (responseId) => {
    if (!window.confirm('Are you sure you want to withdraw this quotation?')) return;
    try {
      setWithdrawingId(responseId);
      await procurementService.withdrawResponse(responseId);
      setSuccessMessage('Quotation withdrawn successfully');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchMyResponses(true);
    } catch (err) {
      setError(err?.message || 'Failed to withdraw quotation');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/procurement" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Procurement Marketplace
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            My Submitted Quotations
          </h1>
          <p className="text-xs text-slate-500">
            Track and manage your submitted supply quotations.
          </p>
        </div>

        <button
          onClick={() => fetchMyResponses(true)}
          disabled={loading || refreshing}
          className="p-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading your quotations...</p>
        </div>
      ) : responses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No quotations submitted yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Browse open procurement requirements and submit quotations to bulk buyers.
          </p>
          <Link
            to="/procurement"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
          >
            Browse Requirements
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((resp) => {
            const isSubmitted = resp.status === 'SUBMITTED';
            const estTotal = (resp.proposedQuantity || 0) * (resp.unitPrice || 0);
            const formattedTotal = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: resp.currency || 'INR',
              maximumFractionDigits: 0,
            }).format(estTotal);

            const formattedPrice = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: resp.currency || 'INR',
              maximumFractionDigits: 0,
            }).format(resp.unitPrice || 0);

            return (
              <div
                key={resp.responseId}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={resp.status} />
                    <span className="text-xs font-bold text-slate-800">
                      Quotation #{resp.responseId.slice(-8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {resp.createdAt ? new Date(resp.createdAt).toLocaleDateString() : ''}
                    </span>
                    <Link
                      to={`/procurement/${resp.rfqId}`}
                      className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
                    >
                      View Request
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Supplying
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {resp.proposedQuantity} {resp.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Price per {resp.unit}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {formattedPrice}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Total Quotation Value
                    </span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formattedTotal}
                    </span>
                  </div>
                </div>

                {resp.availableDate && (
                  <div className="flex items-center text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    <span>Available by: <strong className="text-slate-700">{resp.availableDate}</strong></span>
                  </div>
                )}

                {resp.remarks && (
                  <p className="text-xs text-slate-600 bg-slate-50/60 p-2 rounded border border-slate-100">
                    {resp.remarks}
                  </p>
                )}

                {isSubmitted && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleWithdraw(resp.responseId)}
                      disabled={withdrawingId === resp.responseId}
                      className="px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {withdrawingId === resp.responseId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      Withdraw Quotation
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyResponsesPage;
