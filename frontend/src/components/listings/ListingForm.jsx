import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Livestock', 
  'Seeds', 'Fertilizers', 'Equipment', 'Land', 'Services'
];

const UNITS = ['kg', 'ton', 'quintal', 'piece', 'acre', 'hour', 'day', 'month'];

const STATUSES = ['ACTIVE', 'INACTIVE', 'SOLD', 'RENTED'];

export default function ListingForm({ 
  initialData, 
  onSubmit, 
  isSubmitting 
}) {
  const { 
    register, 
    handleSubmit, 
    control,
    reset,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      title: '',
      category: '',
      description: '',
      price: '',
      unit: 'kg',
      quantity: '',
      location: '',
      contactNumber: '',
      status: 'ACTIVE',
      images: []
    }
  });

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        category: initialData.category || '',
        description: initialData.description || '',
        price: initialData.price || '',
        unit: initialData.unit || 'kg',
        quantity: initialData.quantity || '',
        location: initialData.location || '',
        contactNumber: initialData.contactNumber || '',
        status: initialData.status || 'ACTIVE',
        images: initialData.images || []
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Details */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xl font-bold text-slate-800">Basic Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Listing Title *</label>
            <input 
              {...register('title', { required: 'Title is required' })}
              className={cn("w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none", errors.title ? "border-red-500" : "border-slate-200")}
              placeholder="e.g., Organic Premium Tomatoes"
            />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category *</label>
            <select 
              {...register('category', { required: 'Category is required' })}
              className={cn("w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none", errors.category ? "border-red-500" : "border-slate-200")}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Description *</label>
            <textarea 
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className={cn("w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none", errors.description ? "border-red-500" : "border-slate-200")}
              placeholder="Provide clear details about your product..."
            />
            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xl font-bold text-slate-800">Pricing & Inventory</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Price (₹) *</label>
            <input 
              type="number"
              step="0.01"
              {...register('price', { required: 'Price is required', min: 0 })}
              className={cn("w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none", errors.price ? "border-red-500" : "border-slate-200")}
              placeholder="0.00"
            />
            {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Unit *</label>
            <select 
              {...register('unit', { required: 'Unit is required' })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Available Quantity *</label>
            <input 
              type="number"
              {...register('quantity', { required: 'Quantity is required', min: 1 })}
              className={cn("w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none", errors.quantity ? "border-red-500" : "border-slate-200")}
              placeholder="e.g., 100"
            />
            {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
          </div>
        </div>
      </div>

      {/* Location & Contact */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xl font-bold text-slate-800">Location & Contact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Location (District, State) *</label>
            <input 
              {...register('location', { required: 'Location is required' })}
              className={cn("w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none", errors.location ? "border-red-500" : "border-slate-200")}
              placeholder="e.g., Pune, Maharashtra"
            />
            {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Contact Number</label>
            <input 
              type="tel"
              {...register('contactNumber')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
              placeholder="+91"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <select 
              {...register('status')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xl font-bold text-slate-800">Listing Images</h3>
        <Controller
          name="images"
          control={control}
          rules={{ validate: val => val.length > 0 || 'At least one image is required' }}
          render={({ field: { onChange, value } }) => (
            <ImageUploader 
              value={value} 
              onChange={onChange} 
              error={errors.images?.message}
            />
          )}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-600/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Listing'
          )}
        </button>
      </div>
    </form>
  );
}
