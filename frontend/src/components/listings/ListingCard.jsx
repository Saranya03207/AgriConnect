import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ListingCard({ 
  listing, 
  isOwner = false,
  onEdit,
  onDelete 
}) {
  const {
    listingId,
    title,
    price,
    unit,
    location,
    images,
    status
  } = listing;

  const mainImage = images && images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=600&auto=format&fit=crop';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-slate-100 flex flex-col group"
    >
      {/* Image Container */}
      <Link to={`/marketplace/${listingId}`} className="relative h-48 overflow-hidden block">
        <img 
          src={mainImage} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
          {status}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <Link to={`/marketplace/${listingId}`} className="block flex-1">
          <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-green-600 transition-colors">
            {title}
          </h3>
          <div className="flex items-center text-slate-500 mt-2 text-sm">
            <MapPin className="w-4 h-4 mr-1 text-green-500 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Price</p>
              <div className="flex items-center text-green-600 font-bold text-lg mt-0.5">
                <IndianRupee className="w-4 h-4 mr-0.5" />
                {price} 
                <span className="text-slate-500 text-sm font-normal ml-1">/ {unit}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Owner Actions */}
        {isOwner && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button 
              onClick={() => onEdit && onEdit(listing)}
              className="flex-1 flex items-center justify-center py-2 px-4 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button 
              onClick={() => onDelete && onDelete(listing)}
              className="flex-1 flex items-center justify-center py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
