import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getListingById } from '@/services/listings.service';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, IndianRupee, MessageCircle, Phone, ArrowLeft, Loader2, Calendar, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListingDetailPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await getListingById(listingId);
        setListing(data);
      } catch (error) {
        console.error('Error fetching listing detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (listingId) fetchListing();
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-slate-800">Listing not found</h2>
        <Link to="/marketplace" className="text-green-600 hover:underline mt-4 inline-block">Return to Marketplace</Link>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop'];

  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/marketplace" className="flex items-center text-slate-600 hover:text-green-600 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Images */}
          <div className="space-y-4">
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 group shadow-sm border border-slate-200">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImageIdx}
                  src={images[currentImageIdx]} 
                  alt={listing.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIdx ? 'bg-white w-6' : 'bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIdx ? 'border-green-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div>
            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wide uppercase mb-4">
              {listing.category}
            </div>
            
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              {listing.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-slate-500 mb-8 border-b border-slate-200 pb-8">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-500" />
                <span className="text-lg">{listing.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-500" />
                <span>Listed on {new Date(listing.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Price</p>
                  <div className="flex items-end text-green-600 font-extrabold text-4xl">
                    <IndianRupee className="w-8 h-8 mb-1 mr-1" />
                    {listing.price} 
                    <span className="text-slate-500 text-lg font-medium ml-2 mb-1">/ {listing.unit}</span>
                  </div>
                </div>
                <div className="h-12 w-px bg-slate-200 hidden md:block"></div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Available</p>
                  <div className="flex items-center text-slate-800 font-bold text-2xl">
                    <Package className="w-6 h-6 mr-2 text-slate-400" />
                    {listing.quantity} <span className="text-lg ml-1 font-medium">{listing.unit}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {user?.userId !== listing.farmerId && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-green-600/20">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send Purchase Request
                  </button>
                  {listing.contactNumber && (
                    <a 
                      href={`tel:${listing.contactNumber}`}
                      className="sm:flex-none flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 px-8 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-800">Description</h3>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg">
                {listing.description.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Farmer Info */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Listed by</h3>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                  {listing.farmerName?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="ml-4">
                  <p className="text-xl font-bold text-slate-800">{listing.farmerName || 'Farmer'}</p>
                  <p className="text-slate-500">Verified Seller</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}