import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { PROCUREMENT_CATEGORIES, STANDARD_UNITS, INDIAN_STATES } from '../../constants/procurement';

export function RFQFormModal({ isOpen, onClose, onSubmit, initialData = null, title = 'Create Procurement Request' }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productName: '',
    productCategory: 'CROPS',
    subcategory: '',
    quantity: '',
    unit: 'TONNE',
    preferredLocation: '',
    preferredDistrict: '',
    preferredState: 'Tamil Nadu',
    requiredByDate: '',
    targetPrice: '',
    currency: 'INR',
    qualityRequirements: '',
    additionalRequirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        productName: initialData.productName || '',
        productCategory: initialData.productCategory || 'CROPS',
        subcategory: initialData.subcategory || '',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
        unit: initialData.unit || 'TONNE',
        preferredLocation: initialData.preferredLocation || '',
        preferredDistrict: initialData.preferredDistrict || '',
        preferredState: initialData.preferredState || 'Tamil Nadu',
        requiredByDate: initialData.requiredByDate ? initialData.requiredByDate.split('T')[0] : '',
        targetPrice: initialData.targetPrice !== undefined && initialData.targetPrice !== null ? String(initialData.targetPrice) : '',
        currency: initialData.currency || 'INR',
        qualityRequirements: initialData.qualityRequirements || '',
        additionalRequirements: initialData.additionalRequirements || '',
      });
    } else {
      // Default new form with today + 14 days
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      const isoDate = defaultDate.toISOString().split('T')[0];

      setFormData({
        title: '',
        description: '',
        productName: '',
        productCategory: 'CROPS',
        subcategory: '',
        quantity: '',
        unit: 'TONNE',
        preferredLocation: '',
        preferredDistrict: '',
        preferredState: 'Tamil Nadu',
        requiredByDate: isoDate,
        targetPrice: '',
        currency: 'INR',
        qualityRequirements: '',
        additionalRequirements: '',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }
    if (!formData.productName.trim()) {
      setError('Please specify the product name (e.g. Rice Husk, Wheat Seed, Cotton)');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      setError('Please provide a brief description of what you need (at least 5 characters)');
      return;
    }
    const numQty = parseFloat(formData.quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setError('Please enter a valid positive quantity');
      return;
    }
    if (!formData.preferredDistrict.trim()) {
      setError('Please specify the preferred district');
      return;
    }
    if (!formData.requiredByDate) {
      setError('Please specify the date by when you need the items');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      productName: formData.productName.trim(),
      productCategory: formData.productCategory,
      subcategory: formData.subcategory.trim() || undefined,
      quantity: numQty,
      unit: formData.unit,
      preferredLocation: formData.preferredLocation.trim() || undefined,
      preferredDistrict: formData.preferredDistrict.trim(),
      preferredState: formData.preferredState,
      requiredByDate: formData.requiredByDate,
      currency: formData.currency,
      qualityRequirements: formData.qualityRequirements.trim() || undefined,
      additionalRequirements: formData.additionalRequirements.trim() || undefined,
    };

    if (formData.targetPrice && formData.targetPrice.trim() !== '') {
      const priceNum = parseFloat(formData.targetPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        setError('Target price must be a non-negative number');
        return;
      }
      payload.targetPrice = priceNum;
    }

    try {
      setLoading(true);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save procurement request');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              {title}
            </h2>
            <p className="text-xs text-slate-500">
              Publish your requirements so farmers, producers, and sellers can send you quotations.
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

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Requirement Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              What do you need? (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Looking for 5 tonnes of clean rice husk"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g., Rice Husk, Sona Masoori Seed, Maize"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="productCategory"
                value={formData.productCategory}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                required
              >
                {PROCUREMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Needed <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g., 5 or 100"
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

          {/* Target Price & Required By Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Price per Unit (Optional ₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="targetPrice"
                value={formData.targetPrice}
                onChange={handleChange}
                placeholder="e.g., 8000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required By Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                name="requiredByDate"
                value={formData.requiredByDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                required
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Town / Area
              </label>
              <input
                type="text"
                name="preferredLocation"
                value={formData.preferredLocation}
                onChange={handleChange}
                placeholder="e.g., Pollachi"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="preferredDistrict"
                value={formData.preferredDistrict}
                onChange={handleChange}
                placeholder="e.g., Coimbatore"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                name="preferredState"
                value={formData.preferredState}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                required
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your requirement in detail (purpose, specifications, packaging)..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          {/* Quality & Additional Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quality Requirements
              </label>
              <textarea
                name="qualityRequirements"
                value={formData.qualityRequirements}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., Moisture content < 12%, no dust, clean packing"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Terms / Transport
              </label>
              <textarea
                name="additionalRequirements"
                value={formData.additionalRequirements}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., Supplier must arrange transport to warehouse"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  Saving...
                </>
              ) : (
                'Publish Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RFQFormModal;
