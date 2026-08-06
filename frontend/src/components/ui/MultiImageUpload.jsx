import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MultiImageUpload({ value = [], onChange, maxFiles = 5 }) {
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
    onChange(newFiles);
  }, [value, onChange, maxFiles]);

  const removeFile = (index) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: maxFiles - value.length,
    disabled: value.length >= maxFiles,
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30 hover:bg-secondary/50',
          value.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <UploadCloud className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse (up to {maxFiles} images)
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
          {value.map((file, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-border bg-card shadow-sm aspect-square">
              {file instanceof File ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                />
              ) : (
                <img
                  src={file}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="w-8 h-8 rounded-full bg-destructive/90 hover:bg-destructive text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
