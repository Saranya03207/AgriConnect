import { MapPin, Package, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function ListingCard({ listing, className }) {
  return (
    <Link 
      to={`/marketplace/${listing.listingId}`}
      className={cn(
        "section-card overflow-hidden group flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        className
      )}
    >
      <div className="h-52 bg-secondary/30 relative overflow-hidden">
        {listing.images?.length > 0 ? (
          <img 
            src={listing.images[0]} 
            alt={listing.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted">
            <Package className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-full text-primary shadow-sm uppercase tracking-widest border border-primary/10">
          {listing.category}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-foreground leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          <span className="truncate">{listing.location || 'Unknown Location'}</span>
        </div>
        
        <div className="flex flex-col gap-1.5 mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quantity Available</span>
            <span className="font-semibold text-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
              {listing.quantity} {listing.unit}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium text-muted-foreground">Price</span>
            <span className="text-xl font-black text-emerald-600 flex items-center">
              <IndianRupee className="w-4 h-4 mr-0.5" />
              {listing.price}
              <span className="text-xs text-emerald-600/70 ml-1 font-semibold">/{listing.unit}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
