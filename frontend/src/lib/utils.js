import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format a price with currency symbol */
export function formatPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}

/** Format a number with locale separators */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

/** Convert ISO timestamp to relative time ("3 hours ago") */
export function timeAgo(isoDate) {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
}

/** Format ISO date to readable format */
export function formatDate(isoDate, pattern = 'MMM d, yyyy') {
  return format(new Date(isoDate), pattern);
}

/** Get initials from a full name */
export function getInitials(name) {
  return name.
  split(' ').
  map((n) => n[0]).
  join('').
  toUpperCase().
  slice(0, 2);
}

/** Truncate a string with ellipsis */
export function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/** Build an S3 public URL from a key */
export function getS3Url(key) {
  const bucket = import.meta.env.VITE_S3_BUCKET;
  const region = import.meta.env.VITE_S3_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/** Debounce a function */
export function debounce(
fn,
delay)
{
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Convert file to base64 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}