import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sprout,
  AlertCircle,
  MapPin,
  Camera,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Navigation,
  Map as MapIcon,
  CheckCircle2,
  Star,
} from 'lucide-react';
import {
  LISTING_CATEGORIES,
  LISTING_STATUSES,
  STANDARD_UNITS,
  INDIAN_STATES,
} from '../../constants/listings';
import { locationService } from '../../services/locationService';
import { listingImageService } from '../../services/listingImageService';
import { MapPickerModal } from './MapPickerModal';

export function ListingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  const isEditMode = Boolean(initialData && initialData.listingId);

  // Hidden file inputs for Camera & Gallery
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CROPS',
    subcategory: '',
    itemType: '',
    quantity: '',
    unit: 'QUINTAL',
    price: '',
    currency: 'INR',
    location: '',
    district: '',
    state: '',
    latitude: null,
    longitude: null,
    quality: '',
    availability: '',
    status: 'ACTIVE',
  });

  // Photo management state
  // Array of { id, previewUrl, imageKey?: string, file?: File, isExisting?: boolean }
  const [photos, setPhotos] = useState([]);

  // Direct S3 Uploading state & Progress tracking
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    fileName: '',
  });


  // Location detection states
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState(null);

  // Validation & Error states
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // Populate data when modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: (initialData.category || 'CROPS').toUpperCase(),
        subcategory: initialData.subcategory || '',
        itemType: initialData.itemType || '',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
        unit: (initialData.unit || 'QUINTAL').toUpperCase(),
        price: initialData.price !== undefined ? String(initialData.price) : '',
        currency: initialData.currency || 'INR',
        location: initialData.location || '',
        district: initialData.district || '',
        state: initialData.state || '',
        latitude: initialData.latitude !== undefined && initialData.latitude !== null ? Number(initialData.latitude) : null,
        longitude: initialData.longitude !== undefined && initialData.longitude !== null ? Number(initialData.longitude) : null,
        quality: initialData.quality || '',
        availability: initialData.availability || '',
        status: initialData.status || 'ACTIVE',
      });

      // Existing images from backend (supporting presigned GET URLs and raw S3 keys)
      if (Array.isArray(initialData.images) && initialData.images.length > 0) {
        setPhotos(
          initialData.images.map((img, idx) => {
            const preview = typeof img === 'string' ? img : (img.url || img.key);
            const key = initialData.imageKeys?.[idx] || (typeof img === 'string' && !img.startsWith('http') ? img : (img.key || preview));
            return {
              id: `existing_${idx}_${Date.now()}`,
              previewUrl: preview,
              imageKey: key,
              isExisting: true,
            };
          })
        );
      } else {
        setPhotos([]);
      }

    } else {
      setFormData({
        title: '',
        description: '',
        category: 'CROPS',
        subcategory: '',
        itemType: '',
        quantity: '',
        unit: 'QUINTAL',
        price: '',
        currency: 'INR',
        location: '',
        district: '',
        state: '',
        latitude: null,
        longitude: null,
        quality: '',
        availability: '',
        status: 'ACTIVE',
      });
      setPhotos([]);
    }

    setErrors({});
    setGeneralError(null);
    setLocationError(null);
    setLocationSuccessMsg(null);
  }, [initialData, isOpen]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        if (!p.isExisting && p.previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    };
  }, [photos]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // --- Photo Handling ---

  const handleFilesAdded = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const availableSlots = 5 - photos.length;
    if (availableSlots <= 0) {
      alert('You can select a maximum of 5 product photos.');
      return;
    }

    const filesToAdd = Array.from(fileList).slice(0, availableSlots);
    const newPhotoItems = filesToAdd.map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isExisting: false,
    }));

    setPhotos((prev) => [...prev, ...newPhotoItems]);
  };

  const handleCameraCapture = (e) => {
    handleFilesAdded(e.target.files);
    e.target.value = '';
  };

  const handleGallerySelect = (e) => {
    handleFilesAdded(e.target.files);
    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos((prev) => {
      const removed = prev[indexToRemove];
      if (removed && !removed.isExisting && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // --- Location Handling ---

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccessMsg(null);

    try {
      const coords = await locationService.getCurrentCoordinates();
      setFormData((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));

      // Reverse geocode to get human-readable location
      const geo = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      if (geo) {
        setFormData((prev) => ({
          ...prev,
          location: geo.location || prev.location,
          district: geo.district || prev.district,
          state: geo.state || prev.state,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));

        const readableName = geo.formattedAddress || [geo.location, geo.district, geo.state].filter(Boolean).join(', ');
        setLocationSuccessMsg(readableName ? `📍 ${readableName}` : 'Location detected successfully');
      } else {
        setLocationSuccessMsg('Coordinates detected. Please confirm your district and state.');
      }

      if (errors.location) {
        setErrors((prev) => ({ ...prev, location: null }));
      }
    } catch (err) {
      setLocationError(err.message || 'Unable to detect your location. Please choose on the map.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapConfirm = (mapData) => {
    setFormData((prev) => ({
      ...prev,
      latitude: mapData.latitude,
      longitude: mapData.longitude,
      location: mapData.location || prev.location,
      district: mapData.district || prev.district,
      state: mapData.state || prev.state,
    }));

    const label = mapData.formattedAddress || [mapData.location, mapData.district, mapData.state].filter(Boolean).join(', ');
    setLocationSuccessMsg(label ? `📍 ${label}` : 'Location set from map');
    setLocationError(null);

    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: null }));
    }
  };

  // --- Validation & Submission ---

  const validate = () => {
    const newErrors = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    if (!formData.description || formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters long';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be a positive number (> 0)';
    }

    if (!formData.unit || !formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    const prc = parseFloat(formData.price);
    if (isNaN(prc) || prc < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }

    // Farmer-friendly location validation
    if (!formData.location || formData.location.trim().length < 2) {
      newErrors.location = 'Please select your farm or mandi location.';
    } else if (!formData.district || !formData.district.trim()) {
      newErrors.district = 'Please provide or confirm your district.';
    } else if (!formData.state || !formData.state.trim()) {
      newErrors.state = 'Please provide or confirm your state.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (isSubmitting || isUploadingPhotos) {
      return;
    }

    if (!validate()) {
      return;
    }

    // 1. Existing photos preserved (S3 keys or existing valid references)
    const existingImageRefs = photos
      .filter((p) => p.isExisting)
      .map((p) => p.imageKey || p.previewUrl)
      .filter(Boolean);

    // 2. Newly selected File objects that need direct S3 upload
    const filesToUpload = photos
      .filter((p) => !p.isExisting && p.file instanceof File)
      .map((p) => p.file);

    let newlyUploadedKeys = [];

    // 3. Perform direct-to-S3 uploads with real-time progress
    if (filesToUpload.length > 0) {
      setIsUploadingPhotos(true);
      setUploadProgress({
        current: 1,
        total: filesToUpload.length,
        percent: 0,
        fileName: filesToUpload[0].name,
      });

      try {
        newlyUploadedKeys = await listingImageService.uploadMultipleImages(
          filesToUpload,
          (status) => {
            setUploadProgress(status);
          }
        );
      } catch (uploadErr) {
        setIsUploadingPhotos(false);
        setGeneralError(
          `Photo upload failed: ${uploadErr.message || 'Error uploading photo to secure storage'}. Please try again.`
        );
        return;
      } finally {
        setIsUploadingPhotos(false);
      }
    }

    // 4. Assemble final S3 keys for DynamoDB storage
    const finalImages = [...existingImageRefs, ...newlyUploadedKeys];

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.toUpperCase(),
      quantity: parseFloat(formData.quantity),
      unit: formData.unit.toUpperCase().trim(),
      price: parseFloat(formData.price),
      currency: formData.currency.toUpperCase().trim() || 'INR',
      location: formData.location.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      images: finalImages, // S3 object keys (e.g. listings/{sellerId}/{uuid}.jpg)
    };

    if (formData.subcategory?.trim()) payload.subcategory = formData.subcategory.trim();
    if (formData.itemType?.trim()) payload.itemType = formData.itemType.trim();
    if (formData.quality?.trim()) payload.quality = formData.quality.trim();
    if (formData.availability?.trim()) payload.availability = formData.availability.trim();

    // Retain internal coordinates if present
    if (formData.latitude !== null && !isNaN(Number(formData.latitude))) {
      payload.latitude = Number(formData.latitude);
    }
    if (formData.longitude !== null && !isNaN(Number(formData.longitude))) {
      payload.longitude = Number(formData.longitude);
    }

    if (isEditMode) {
      payload.status = formData.status.toUpperCase();
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setGeneralError(err.message || 'Failed to submit listing. Please check inputs.');
    }
  };


  const selectedLocationDisplay = [formData.location, formData.district, formData.state].filter(Boolean).join(', ');

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditMode ? 'Update Marketplace Listing' : 'Create Agricultural Listing'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isEditMode
                    ? 'Update availability, pricing, or product details'
                    : 'Offer crops, seeds, biomass, or agro-residues to the value-chain'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {generalError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Submission Error</p>
                  <p className="mt-0.5 leading-relaxed">{generalError}</p>
                </div>
              </div>
            )}

            {/* Section 1: Product Classification & Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Product Classification & Details
              </h3>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Listing Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Certified HD-2967 Wheat Seed / Organic Basmati Paddy"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                    errors.title ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>}
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    {LISTING_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategory <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    placeholder="e.g. Cereals, Pulses, Biomass Residue"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Item Type & Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Type / Variety <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="itemType"
                    value={formData.itemType}
                    onChange={handleChange}
                    placeholder="e.g. Sharbati, 1121 Sella, Coconut Coir"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quality Grade / Certification <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="quality"
                    value={formData.quality}
                    onChange={handleChange}
                    placeholder="e.g. Grade A Certified, Moisture < 12%"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your produce or material, packaging condition, moisture level, batch details, and delivery capabilities..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                    errors.description ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.description && <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>}
              </div>
            </div>

            {/* Section 2: Pricing & Inventory */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Inventory, Pricing & Availability
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                      errors.quantity ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {errors.quantity && <p className="text-[11px] text-red-600 mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    {STANDARD_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price per Unit (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 3200"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                      errors.price ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {errors.price && <p className="text-[11px] text-red-600 mt-1">{errors.price}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Availability Timeline <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    placeholder="e.g. Ready for dispatch / Harvest in 1 week"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {isEditMode && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Listing Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    >
                      {LISTING_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Farm / Mandi Location */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    3. Farm / Mandi Location
                  </h3>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    Where is this product located?
                  </p>
                </div>
              </div>

              {/* Farmer Location Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Geolocation Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center space-x-2.5 p-3.5 rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/60 text-emerald-800 font-semibold text-xs sm:text-sm transition shadow-sm disabled:opacity-60"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Detecting GPS Location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-emerald-700" />
                      <span>📍 Use My Current Location</span>
                    </>
                  )}
                </button>

                {/* Map Picker Button */}
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-2.5 p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition shadow-sm"
                >
                  <MapIcon className="w-4 h-4 text-emerald-600" />
                  <span>🗺️ Select on Map</span>
                </button>
              </div>

              {/* Geolocation Error Alert */}
              {locationError && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div className="leading-relaxed">
                    <p className="font-semibold">Location Notice</p>
                    <p className="mt-0.5">{locationError}</p>
                  </div>
                </div>
              )}

              {/* Geolocation Success Confirmation Badge */}
              {locationSuccessMsg && !locationError && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">{locationSuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-700 underline ml-2 hover:text-emerald-900"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Location Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Farm / Mandi / Village <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Vazhapadi Mandi / Central Farm"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                      errors.location ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {errors.location && <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Salem, Karnal"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                      errors.district ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {errors.district && <p className="text-[11px] text-red-600 mt-1">{errors.district}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-white transition ${
                      errors.state ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="text-[11px] text-red-600 mt-1">{errors.state}</p>}
                </div>
              </div>
            </div>

            {/* Section 4: Product Photos */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    4. Product Photos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add clear photos of your crop, seed, biomass, or agricultural material (up to 5 photos).
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {photos.length} / 5 photos
                </span>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGallerySelect}
                className="hidden"
              />

              {/* Direct S3 Upload Progress Banner */}
              {isUploadingPhotos && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Uploading photos directly to secure S3 storage...</span>
                    </span>
                    <span className="font-mono text-emerald-800">
                      Photo {uploadProgress.current} of {uploadProgress.total} ({uploadProgress.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                  {uploadProgress.fileName && (
                    <p className="text-[11px] text-emerald-700 truncate">
                      File: {uploadProgress.fileName}
                    </p>
                  )}
                </div>
              )}

              {/* Photo Action Buttons */}
              {photos.length < 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploadingPhotos || isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 font-semibold text-xs sm:text-sm transition shadow-sm disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>📷 Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingPhotos || isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition shadow-sm disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>🖼️ Choose from Gallery</span>
                  </button>
                </div>
              )}

              {/* Photo Previews Grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-sm"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Main Photo Indicator on 1st Photo */}
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-emerald-700/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Main</span>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        disabled={isUploadingPhotos || isSubmitting}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-600 text-white opacity-90 hover:opacity-100 hover:bg-red-700 shadow transition disabled:opacity-40"
                        title="Remove photo"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50/50">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">No photos added yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Clear photos help buyers evaluate crop quality and build trust
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingPhotos}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingPhotos}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isUploadingPhotos ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Uploading Photo {uploadProgress.current} of {uploadProgress.total} ({uploadProgress.percent}%)...
                  </span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Listing...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Save Changes' : 'Publish Listing'}</span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Map Location Picker Modal */}
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleMapConfirm}
        initialLat={formData.latitude}
        initialLng={formData.longitude}
      />
    </>
  );
}

export default ListingFormModal;
