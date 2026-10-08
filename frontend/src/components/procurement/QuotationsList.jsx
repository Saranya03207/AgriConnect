import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Calendar, FileText, Ban, User } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { RoleBadge } from '../RoleBadge';

export function QuotationsList({
  responses = [],
  rfqStatus = 'OPEN',
  isBuyerOwner = false,
  currentUserId = null,
  onAccept = null,
  onWithdraw = null,
  acceptingId = null,
  withdrawingId = null,
}) {
  const [confirmAcceptId, setConfirmAcceptId] = useState(null);

  if (!responses || responses.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">No quotations received yet</p>
        <p className="text-slate-400 mt-0.5">
          Quotations submitted by farmers, seed producers, and sellers will appear here.
        </p>
      </div>
    );
  }

  const isRFQOpen = rfqStatus === 'OPEN';
  const hasAccepted = responses.some((r) => r.status === 'ACCEPTED');

  return (
    <div className="space-y-4">
      {hasAccepted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-emerald-900">Quotation accepted.</p>
            <p className="text-emerald-700 mt-0.5">
              Order creation will be handled in the next stage. The accepted supplier has been notified.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {responses.map((resp) => {
          const isAccepted = resp.status === 'ACCEPTED';
          const isSubmitted = resp.status === 'SUBMITTED';
          const isWithdrawn = resp.status === 'WITHDRAWN';
          const isRejected = resp.status === 'REJECTED';
          const isOwnResponse = currentUserId && resp.sellerId === currentUserId;

          const estTotal = (resp.proposedQuantity || 0) * (resp.unitPrice || 0);
          const formattedUnitPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: resp.currency || 'INR',
            maximumFractionDigits: 0,
          }).format(resp.unitPrice || 0);

          const formattedEstTotal = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: resp.currency || 'INR',
            maximumFractionDigits: 0,
          }).format(estTotal);

          return (
            <div
              key={resp.responseId}
              className={`rounded-xl border p-4 transition ${
                isAccepted
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-300'
                  : isRejected
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : isWithdrawn
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={resp.status} />
                  <RoleBadge role={resp.sellerRole || 'FARMER'} />
                  {isOwnResponse && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                      Your Quotation
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  Submitted: {resp.createdAt ? new Date(resp.createdAt).toLocaleDateString() : ''}
                </span>
              </div>

              {/* Quotation Pricing & Quantity Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100 mb-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Offered Quantity
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {resp.proposedQuantity} {resp.unit}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Unit Price
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {formattedUnitPrice}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Total Estimated
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formattedEstTotal}
                  </span>
                </div>
              </div>

              {/* Available date & Remarks */}
              <div className="space-y-1 text-xs text-slate-600 mb-3">
                {resp.availableDate && (
                  <div className="flex items-center text-slate-500">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                    <span>Available by: <strong className="text-slate-700">{resp.availableDate}</strong></span>
                  </div>
                )}
                {resp.remarks && (
                  <div className="mt-1 p-2 bg-white rounded border border-slate-150 text-slate-600 text-[11px] leading-relaxed">
                    <strong className="text-slate-800">Notes:</strong> {resp.remarks}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-150/60">
                {/* Buyer Owner Action: Accept Quotation */}
                {isBuyerOwner && isRFQOpen && isSubmitted && (
                  <>
                    {confirmAcceptId === resp.responseId ? (
                      <div className="flex items-center gap-2 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                        <span className="text-[11px] font-semibold text-emerald-900">
                          Confirm accept this quotation?
                        </span>
                        <button
                          onClick={() => {
                            setConfirmAcceptId(null);
                            onAccept && onAccept(resp.responseId);
                          }}
                          disabled={acceptingId === resp.responseId}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition disabled:opacity-50"
                        >
                          {acceptingId === resp.responseId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Yes, Accept'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmAcceptId(null)}
                          disabled={acceptingId === resp.responseId}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmAcceptId(resp.responseId)}
                        disabled={acceptingId !== null}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept Quotation
                      </button>
                    )}
                  </>
                )}

                {/* Seller Action: Withdraw Quotation */}
                {isOwnResponse && isSubmitted && onWithdraw && (
                  <button
                    onClick={() => onWithdraw(resp.responseId)}
                    disabled={withdrawingId === resp.responseId}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {withdrawingId === resp.responseId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                    Withdraw Quotation
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuotationsList;
