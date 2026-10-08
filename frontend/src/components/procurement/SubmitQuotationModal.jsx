import React, { useState } from 'react';
import { X, AlertCircle, Loader2, Send } from 'lucide-react';
import { STANDARD_UNITS } from '../../constants/procurement';

export function SubmitQuotationModal({ isOpen, onClose, onSubmit, rfq }) {
  const [formData, setFormData] = useState({
    proposedQuantity: rfq?.quantity !== undefined ? String(rfq.quantity) : '',
    unit: rfq?.unit || 'TONNE',
    unitPrice: rfq?.targetPrice !== undefined && rfq?.targetPrice !== null ? String(rfq.targetPrice) : '',
    currency: 'INR',
    availableDate: rfq?.requiredByDate ? rfq.requiredByDate.split('T')[0] : '',
    remarks: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !rfq) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(formData.proposedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please provide a valid quantity greater than 0');
      return;
    }

    const price = parseFloat(formData.unitPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price per unit (cannot be negative)');
      return;
    }

    if (!formData.availableDate) {
      setError('Please specify the date when items will be available');
      return;
    }

    const payload = {
      proposedQuantity: qty,
      unit: formData.unit,
      unitPrice: price,
      currency: formData.currency || 'INR',
      availableDate: formData.availableDate,
      remarks: formData.remarks.trim() || undefined,
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to submit quotation');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Submit Quotation
            </h2>
            <p className="text-xs text-slate-500">
              Provide your supply terms to the buyer.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RFQ Context Snippet */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100/60 text-xs text-slate-700">
          <p className="font-semibold text-slate-900 mb-1">{rfq.title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
            <span>Product: <strong className="text-slate-800">{rfq.productName}</strong></span>
            <span>Requested: <strong className="text-slate-800">{rfq.quantity} {rfq.unit}</strong></span>
            {rfq.targetPrice && (
              <span>Target: <strong className="text-slate-800">₹{rfq.targetPrice} / {rfq.unit}</strong></span>
            )}
            <span>Required By: <strong className="text-slate-800">{rfq.requiredByDate}</strong></span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Proposed Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity You Can Supply <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                name="proposedQuantity"
                value={formData.proposedQuantity}
                onChange={handleChange}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit <span className="text-rose-500">*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                required
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Price & Available Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Price per {formData.unit || 'Unit'} (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="e.g., 7800"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                name="availableDate"
                value={formData.availableDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                required
              />
            </div>
          </div>

          {/* Estimated Total Calculation Preview */}
          {parseFloat(formData.proposedQuantity) > 0 && parseFloat(formData.unitPrice) >= 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Estimated Total Quotation:</span>
              <span className="font-bold text-slate-900 text-sm">
                ₹{new Intl.NumberFormat('en-IN').format(
                  parseFloat(formData.proposedQuantity) * parseFloat(formData.unitPrice)
                )}
              </span>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Transport Terms / Notes
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., Grade A quality with certified moisture test. Transport included up to 50km."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quotation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitQuotationModal;
