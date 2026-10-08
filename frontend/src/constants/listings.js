/**
 * Supported Agricultural Marketplace Constants
 * Kept aligned with backend models in app/models/listing.py
 */

export const LISTING_CATEGORIES = [
  { value: 'SEEDS', label: 'Seeds & Planting Materials', description: 'Certified seeds, seedlings, and rootstock' },
  { value: 'CROPS', label: 'Harvested Crops & Produce', description: 'Grains, pulses, cereals, fruits, and vegetables' },
  { value: 'BY_PRODUCTS', label: 'Agro By-Products & Residues', description: 'Straw, husk, bagasse, and crop stalks' },
  { value: 'BIOMASS', label: 'Biomass & Organic Waste', description: 'Agricultural biomass for fuel, coir, and compost' },
  { value: 'RAW_MATERIALS', label: 'Raw Agricultural Materials', description: 'Cotton, natural fibers, latex, and resins' },
];

export const LISTING_STATUSES = [
  { value: 'ACTIVE', label: 'Active (Available)' },
  { value: 'INACTIVE', label: 'Inactive (Hidden)' },
  { value: 'SOLD', label: 'Sold Out' },
  { value: 'EXPIRED', label: 'Expired' },
];

export const STANDARD_UNITS = [
  'KG',
  'QUINTAL',
  'TONNE',
  'BAG',
  'LITRE',
  'PIECE',
  'BOX',
  'BUNDLE',
  'CRATE',
  'GRAM',
  'ACRE',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

export const SELLER_ROLES = [
  { value: 'FARMER', label: 'Farmer / Grower' },
  { value: 'SEED_PRODUCER', label: 'Seed Producer' },
  { value: 'BYPRODUCT_SELLER', label: 'By-product Seller' },
  { value: 'PROCESSOR', label: 'Processor / Industry' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
];
