export const APP_NAME = 'AgriConnect';
export const APP_TAGLINE = 'AI-Powered Agricultural Resource Exchange';
export const APP_VERSION = '0.1.0';

export const LISTING_CATEGORIES = [
{ value: 'crops', label: 'Crops & Produce' },
{ value: 'byproducts', label: 'Agricultural By-products' },
{ value: 'equipment', label: 'Farm Equipment' },
{ value: 'inputs', label: 'Inputs & Supplies' },
{ value: 'services', label: 'Agricultural Services' }];


export const QUANTITY_UNITS = [
'kg', 'ton', 'liter', 'gallon', 'piece',
'bale', 'bag', 'crate', 'box', 'hectare'];


export const CURRENCIES = [
{ value: 'USD', label: 'USD – US Dollar' },
{ value: 'EUR', label: 'EUR – Euro' },
{ value: 'GBP', label: 'GBP – British Pound' },
{ value: 'NGN', label: 'NGN – Nigerian Naira' },
{ value: 'KES', label: 'KES – Kenyan Shilling' },
{ value: 'GHS', label: 'GHS – Ghanaian Cedi' },
{ value: 'ZAR', label: 'ZAR – South African Rand' }];


export const TRANSACTION_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_delivery: 'In Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed'
};

export const DELIVERY_STATUS_LABELS = {
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed'
};

export const PAGINATION_LIMIT = 20;

export const IMAGE_MAX_SIZE_MB = 5;
export const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const LISTING_MAX_IMAGES = 8;

export const USER_ROLES = [
{
  value: 'farmer',
  label: 'Farmer',
  description: 'Grow and sell crops, manage farm produce',
  icon: '🌾'
},
{
  value: 'labour_provider',
  label: 'Labour Provider',
  description: 'Supply agricultural labour services',
  icon: '👷'
},
{
  value: 'equipment_owner',
  label: 'Equipment Owner',
  description: 'Rent out farming machinery and equipment',
  icon: '🚜'
},
{
  value: 'transport_provider',
  label: 'Transport Provider',
  description: 'Provide transport for agricultural goods',
  icon: '🚛'
},
{
  value: 'storage_owner',
  label: 'Storage Owner',
  description: 'Offer cold storage and warehousing facilities',
  icon: '🏭'
},
{
  value: 'processing_unit',
  label: 'Processing Unit',
  description: 'Process raw agricultural produce',
  icon: '⚙️'
},
{
  value: 'industry',
  label: 'Industry',
  description: 'Buy agricultural outputs in bulk',
  icon: '🏢'
}];