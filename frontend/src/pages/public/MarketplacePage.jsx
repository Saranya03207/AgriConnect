import { useState, useEffect } from 'react';
import { getAllListings } from '@/services/listings.service';
import ListingCard from '@/components/listings/ListingCard';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  'All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Livestock', 
  'Seeds', 'Fertilizers', 'Equipment', 'Land', 'Services'
];

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const data = await getAllListings();
        setListings(data.items || []);
      } catch (error) {
        console.error('Error fetching marketplace listings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  // Filter logic (in production this should preferably be server-side)
  const filteredListings = listings.filter(l => {
    if (category !== 'All' && l.category !== category) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (l.status !== 'ACTIVE') return false;
    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="mb-8 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Marketplace</h1>
            <p className="text-slate-500 mt-2 text-lg">Discover fresh produce, equipment, and agricultural services.</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search listings..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-green-500 shadow-sm text-slate-700 bg-white placeholder-slate-400 transition-all outline-none"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 rounded-2xl shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors font-medium">
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-colors ${
                  category === cat 
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No listings found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredListings.map((listing) => (
              <ListingCard key={listing.listingId} listing={listing} />
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}