import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getMyListings, deleteListing, updateListing } from '@/services/listings.service';
import ListingCard from '@/components/listings/ListingCard';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

export default function MyListingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await getMyListings(user?.userId);
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching my listings:', error);
        showToast('Failed to load listings', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.userId) {
      fetchListings();
    }
  }, [user, showToast]);

  const handleEdit = (listing) => {
    navigate(`/listings/edit/${listing.listingId}`);
  };

  const handleDelete = async (listingId) => {
    try {
      await deleteListing(listingId);
      setListings(prev => prev.filter(l => l.listingId !== listingId));
      showToast('Listing deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast('Failed to delete listing', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Listings</h1>
          <p className="text-slate-500 mt-1">Manage all your products and services</p>
        </div>
        <Link 
          to="/listings/create"
          className="flex items-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Listing
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No listings yet</h3>
          <p className="text-slate-500 mb-6">Create your first listing to start selling.</p>
          <Link 
            to="/listings/create"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-sm transition-colors"
          >
            Create New Listing
          </Link>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {listings.map((listing) => (
            <ListingCard 
              key={listing.listingId} 
              listing={listing} 
              isOwner={true}
              onEdit={handleEdit}
              onDelete={() => setDeletingId(listing.listingId)}
            />
          ))}
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[90vw] max-w-md shadow-xl z-50 animate-in fade-in zoom-in-95">
            <AlertDialog.Title className="text-xl font-bold text-slate-800">
              Delete Listing
            </AlertDialog.Title>
            <AlertDialog.Description className="text-slate-600 mt-2">
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button 
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}