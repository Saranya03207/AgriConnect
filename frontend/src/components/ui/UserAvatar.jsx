import { getInitials, getS3Url, cn } from '@/lib/utils';



const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
};








export default function UserAvatar({ name, imageKey, size = 'md', className }) {
  const initials = getInitials(name);
  const src = imageKey ? getS3Url(imageKey) : undefined;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary shrink-0 overflow-hidden',
        sizeMap[size],
        className
      )}
      aria-label={name}>
      
      {src ?
      <img src={src} alt={name} className="h-full w-full object-cover" /> :

      <span>{initials}</span>
      }
    </div>);

}