import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createListing, uploadListingImages } from '@/services/listings.service';
import ListingForm from '@/components/listings/ListingForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Separate local files from existing URLs (if any, though this is creation)
      const filesToUpload = data.images.filter(file => file instanceof File);
      let uploadedUrls = [];
      
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadListingImages(filesToUpload);
      }

      const listingData = {
        ...data,
        farmerId: user?.userId,
        farmerName: user?.displayName,
        price: Number(data.price),
        quantity: Number(data.quantity),
        images: uploadedUrls
      };

      await createListing(listingData);
      
      showToast('Listing created successfully!', 'success');
      navigate('/listings/my');
      
    } catch (error) {
      console.error('Error creating listing:', error);
      showToast(error.message || 'Failed to create listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center">
        <Link to="/listings/my" className="mr-4 p-2 bg-white rounded-full text-slate-500 hover:text-green-600 hover:bg-green-50 transition-colors shadow-sm border border-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Create New Listing</h1>
          <p className="text-slate-500 mt-1">Add your produce or service to the AgriConnect marketplace.</p>
        </div>
      </div>

      <ListingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}