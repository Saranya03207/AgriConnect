import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Ban,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { procurementService } from '../../services/procurementService';
import { StatusBadge } from '../../components/StatusBadge';
import { RoleBadge } from '../../components/RoleBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SubmitQuotationModal, QuotationsList, RFQFormModal } from '../../components/procurement';

export function ProcurementDetailPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modals & In-flight actions
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchRFQDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await procurementService.getRFQById(rfqId);
      setRfq(data);
    } catch (err) {
      setError(err?.message || 'Failed to load procurement request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rfqId) {
      fetchRFQDetails();
    }
  }, [rfqId]);

  const userRole = (user?.role || '').toUpperCase();
  const isOwner = user?.userId && rfq?.buyerId && user.userId === rfq.buyerId;
  const isAdmin = userRole === 'ADMIN';
  const isEligibleSeller =
    isAuthenticated &&
    !isOwner &&
    ['FARMER', 'SEED_PRODUCER', 'BYPRODUCT_SELLER', 'PROCESSOR', 'SERVICE_PROVIDER', 'ADMIN'].includes(userRole);

  const isRFQOpen = rfq?.status === 'OPEN';

  // Handle Cancel RFQ
  const handleCancelRFQ = async () => {
    if (!window.confirm('Are you sure you want to cancel this procurement request? This action cannot be undone.')) {
      return;
    }
    try {
      setCancelling(true);
      await procurementService.cancelRFQ(rfqId);
      setActionSuccess('Procurement request has been cancelled.');
      fetchRFQDetails();
    } catch (err) {
      setError(err?.message || 'Failed to cancel procurement request');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Submit Quotation
  const handleQuoteSubmit = async (payload) => {
    await procurementService.submitQuotation(rfqId, payload);
    setActionSuccess('Your quotation was submitted successfully!');
    fetchRFQDetails();
  };

  // Handle Accept Quotation
  const handleAcceptQuotation = async (responseId) => {
    try {
      setAcceptingId(responseId);
      const result = await procurementService.acceptResponse(responseId);
      setActionSuccess('Quotation accepted! Order creation will be handled in the next stage.');
      fetchRFQDetails();
    } catch (err) {
      setError(err?.message || 'Failed to accept quotation');
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle Withdraw Quotation
  const handleWithdrawQuotation = async (responseId) => {
    if (!window.confirm('Are you sure you want to withdraw your quotation?')) return;
    try {
      setWithdrawingId(responseId);
      await procurementService.withdrawResponse(responseId);
      setActionSuccess('Your quotation has been withdrawn.');
      fetchRFQDetails();
    } catch (err) {
      setError(err?.message || 'Failed to withdraw quotation');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Handle Edit RFQ
  const handleEditSubmit = async (payload) => {
    await procurementService.updateRFQ(rfqId, payload);
    setActionSuccess('Procurement request updated successfully!');
    fetchRFQDetails();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading procurement request details...</p>
      </div>
    );
  }

  if (error && !rfq) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h2 className="text-base font-bold text-rose-900">Request Not Found</h2>
          <p className="text-xs text-rose-700 mt-1 mb-4">{error}</p>
          <Link
            to="/procurement"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Procurement Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const formattedTargetPrice = rfq.targetPrice
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: rfq.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(rfq.targetPrice)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/procurement"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 px-2.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Procurement
        </Link>

        {isOwner && isRFQOpen && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
            >
              Edit Request
            </button>
            <button
              onClick={handleCancelRFQ}
              disabled={cancelling}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg shadow-sm transition"
            >
              Cancel Request
            </button>
          </div>
        )}
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Request Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={rfq.status} />
              <RoleBadge role={rfq.buyerRole || 'BUYER'} />
              {isOwner && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Your Requirement
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {rfq.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Posted {rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : ''}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{rfq.productName}</span>
              {rfq.productCategory && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    <Tag className="w-3 h-3 mr-1 text-slate-400" />
                    {rfq.productCategory.replace(/_/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Seller Action Button in Header */}
          {isEligibleSeller && isRFQOpen && (
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow transition shrink-0"
            >
              <Send className="w-4 h-4" />
              Submit Quotation
            </button>
          )}
        </div>

        {/* Specifications Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
              Quantity Required
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {rfq.quantity} {rfq.unit}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
              Target Price
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              {formattedTargetPrice ? `${formattedTargetPrice} / ${rfq.unit}` : 'Negotiable'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
              Required By
            </span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {rfq.requiredByDate}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
              Delivery Location
            </span>
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {[rfq.preferredLocation, rfq.preferredDistrict, rfq.preferredState]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </span>
          </div>
        </div>

        {/* Requirements Details */}
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description & Specifications
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-white rounded-lg p-3 border border-slate-100">
              {rfq.description}
            </p>
          </div>

          {rfq.qualityRequirements && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quality Requirements
              </h3>
              <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-100">
                {rfq.qualityRequirements}
              </p>
            </div>
          )}

          {rfq.additionalRequirements && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Additional Terms & Transport
              </h3>
              <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-100">
                {rfq.additionalRequirements}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quotations Review Section (Owner or Admin) */}
      {(isOwner || isAdmin) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Submitted Quotations ({rfq.responses?.length || 0})
              </h2>
              <p className="text-xs text-slate-500">
                Review and compare quotations from verified producers and suppliers.
              </p>
            </div>
          </div>

          <QuotationsList
            responses={rfq.responses || []}
            rfqStatus={rfq.status}
            isBuyerOwner={isOwner || isAdmin}
            currentUserId={user?.userId}
            onAccept={handleAcceptQuotation}
            onWithdraw={handleWithdrawQuotation}
            acceptingId={acceptingId}
            withdrawingId={withdrawingId}
          />
        </div>
      )}

      {/* Modals */}
      <SubmitQuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        onSubmit={handleQuoteSubmit}
        rfq={rfq}
      />

      <RFQFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={rfq}
        title="Edit Procurement Request"
      />
    </div>
  );
}

export default ProcurementDetailPage;
