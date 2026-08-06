import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usersService } from '@/services/users.service';
import { Camera, Save, Loader2, MapPin, Phone, User, Mail, ShieldCheck, FileText, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  address: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
});

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await usersService.getMe();
        const profile = response.data;
        
        // Reset form with fetched data
        reset({
          displayName: profile.displayName || user?.displayName || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          address: profile.location?.address || '',
          lat: profile.location?.lat || '',
          lng: profile.location?.lng || '',
        });

        if (profile.profileImage) {
          setAvatarPreview(profile.profileImage);
        }
      } catch (error) {
        toast('Failed to load profile', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [reset, toast, user]);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      
      const updates = {
        displayName: data.displayName,
        phone: data.phone,
        bio: data.bio,
        location: {
          address: data.address,
          lat: data.lat === '' ? null : Number(data.lat),
          lng: data.lng === '' ? null : Number(data.lng),
        }
      };

      await usersService.updateMe(updates);
      updateUser({ displayName: data.displayName }); // Update auth context

      toast('Profile updated successfully!', { variant: 'success' });
      reset(data); // reset dirty state
    } catch (error) {
      toast('Failed to update profile', { variant: 'error', body: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('File too large', { body: 'Image must be less than 5MB', variant: 'error' });
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Get presigned URL
      const extension = file.name.split('.').pop();
      const res = await usersService.getAvatarUploadUrl(file.type, extension);
      const { uploadUrl, publicUrl } = res.data;

      // 2. Upload to S3
      await usersService.uploadToS3(uploadUrl, file);

      // 3. Update profile with new image URL
      await usersService.updateMe({ profileImage: publicUrl });
      
      setAvatarPreview(publicUrl);
      updateUser({ profileImage: publicUrl }); // Update auth context
      
      toast('Profile picture updated!', { variant: 'success' });
    } catch (error) {
      toast('Upload failed', { variant: 'error', body: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-20">
      <PageHeader 
        title="My Profile" 
        description="Manage your account settings and preferences" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column: Avatar & Account Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg mx-auto">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground bg-primary/5">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleAvatarChange}
              />
            </div>
            
            <h3 className="mt-4 text-xl font-bold text-foreground">{user?.displayName}</h3>
            <p className="text-sm text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>

          {/* Account Info Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h4 className="font-semibold text-foreground border-b border-border pb-2">Account Information</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className={cn("w-4 h-4", user?.isVerified ? "text-green-500" : "text-amber-500")} />
                <span className={cn("font-medium", user?.isVerified ? "text-green-600" : "text-amber-600")}>
                  {user?.isVerified ? 'Verified Account' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
            <h4 className="font-semibold text-foreground border-b border-border pb-2 text-lg">Public Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register('displayName')}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                      errors.displayName && "border-destructive focus:ring-destructive/50"
                    )}
                  />
                </div>
                {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register('phone')}
                    placeholder="+1 (555) 000-0000"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                      errors.phone && "border-destructive focus:ring-destructive/50"
                    )}
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              {/* Farm Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Farm/Business Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register('address')}
                    placeholder="123 Farm Road, County, State, Zip"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                      errors.address && "border-destructive focus:ring-destructive/50"
                    )}
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Latitude (GPS)</label>
                <div className="relative">
                  <Map className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register('lat')}
                    type="number"
                    step="any"
                    placeholder="34.0522"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                      errors.lat && "border-destructive focus:ring-destructive/50"
                    )}
                  />
                </div>
                {errors.lat && <p className="text-xs text-destructive">{errors.lat.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Longitude (GPS)</label>
                <div className="relative">
                  <Map className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register('lng')}
                    type="number"
                    step="any"
                    placeholder="-118.2437"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                      errors.lng && "border-destructive focus:ring-destructive/50"
                    )}
                  />
                </div>
                {errors.lng && <p className="text-xs text-destructive">{errors.lng.message}</p>}
              </div>

              {/* Bio */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Bio / About</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    {...register('bio')}
                    rows={4}
                    placeholder="Tell us about your farm, what you grow, and your experience..."
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none",
                      errors.bio && "border-destructive focus:ring-destructive/50"
                    )}
                  />
                </div>
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-border mt-6">
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}