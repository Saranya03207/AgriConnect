import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ImageUploader({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  error 
}) {
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    
    // Combine existing and new, keeping up to maxFiles
    const combined = [...value, ...newFiles].slice(0, maxFiles);
    onChange(combined);
  }, [value, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles,
    disabled: value.length >= maxFiles
  });

  const removeFile = (indexToRemove) => {
    const newFiles = value.filter((_, index) => index !== indexToRemove);
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer",
          isDragActive ? "border-green-500 bg-green-50/50" : "border-slate-300 hover:border-green-400 hover:bg-slate-50",
          value.length >= maxFiles && "opacity-50 cursor-not-allowed",
          error && "border-red-500 bg-red-50/50"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn("mx-auto h-12 w-12 mb-4", isDragActive ? "text-green-500" : "text-slate-400")} />
        <p className="text-slate-600 font-medium">
          {isDragActive ? "Drop the images here ..." : "Drag & drop listing images, or click to select"}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Supports JPG, PNG, WEBP (Max {maxFiles} images)
        </p>
      </div>

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <AnimatePresence>
            {value.map((file, index) => {
              // If it's a File object with preview, use that. Otherwise it might be a direct URL string from an existing listing
              const src = file.preview || (typeof file === 'string' ? file : null);
              
              if (!src) return null;

              return (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-slate-200"
                >
                  <img 
                    src={src} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
