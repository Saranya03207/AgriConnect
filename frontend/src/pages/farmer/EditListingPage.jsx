import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getListingById, updateListing, uploadListingImages } from '@/services/listings.service';
import ListingForm from '@/components/listings/ListingForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditListingPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await getListingById(listingId);
        if (data.farmerId !== user?.userId) {
          showToast('You do not have permission to edit this listing', 'error');
          navigate('/listings/my');
          return;
        }
        setInitialData(data);
      } catch (error) {
        console.error('Error fetching listing:', error);
        showToast('Failed to load listing details', 'error');
        navigate('/listings/my');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (listingId && user?.userId) {
      fetchListing();
    }
  }, [listingId, user, navigate, showToast]);

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Separate local files from existing URLs
      const filesToUpload = data.images.filter(file => file instanceof File);
      const existingUrls = data.images.filter(file => typeof file === 'string');
      
      let uploadedUrls = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadListingImages(filesToUpload);
      }

      const listingData = {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        images: [...existingUrls, ...uploadedUrls]
      };

      await updateListing(listingId, listingData);
      
      showToast('Listing updated successfully!', 'success');
      navigate('/listings/my');
      
    } catch (error) {
      console.error('Error updating listing:', error);
      showToast(error.message || 'Failed to update listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center">
        <Link to="/listings/my" className="mr-4 p-2 bg-white rounded-full text-slate-500 hover:text-green-600 hover:bg-green-50 transition-colors shadow-sm border border-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Edit Listing</h1>
          <p className="text-slate-500 mt-1">Update your listing details.</p>
        </div>
      </div>

      <ListingForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}
