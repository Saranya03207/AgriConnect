/**
 * Utility Formatters for AgriConnect Frontend
 */

export const ROLE_LABELS = {
  SEED_PRODUCER: 'Seed Producer',
  FARMER: 'Farmer / Crop Producer',
  BYPRODUCT_SELLER: 'By-product Seller',
  BUYER: 'Buyer / Procurement',
  SERVICE_PROVIDER: 'Service Provider',
  PROCESSOR: 'Processor / Industry',
  ADMIN: 'Platform Administrator',
};

export const CATEGORY_LABELS = {
  SEEDS: 'Seeds & Planting Materials',
  CROPS: 'Harvested Crops & Grains',
  BY_PRODUCTS: 'Agro By-Products & Residues',
  BIOMASS: 'Biomass & Organic Waste',
  RAW_MATERIALS: 'Raw Agro Materials',
};

export const STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SOLD: 'Sold Out',
  EXPIRED: 'Expired',
};

export function formatRole(role) {
  if (!role) return 'Participant';
  const normalized = role.toUpperCase();
  return ROLE_LABELS[normalized] || role;
}

export function formatCategory(cat) {
  if (!cat) return 'General';
  const normalized = cat.toUpperCase();
  return CATEGORY_LABELS[normalized] || cat;
}

export function formatStatus(status) {
  if (!status) return 'Active';
  const normalized = status.toUpperCase();
  return STATUS_LABELS[normalized] || status;
}

export function formatPrice(price, currency = 'INR') {
  if (price === undefined || price === null || isNaN(Number(price))) return '₹0';
  const num = Number(price);
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  }
  return `${currency} ${num.toLocaleString()}`;
}

export function formatQuantity(quantity, unit = 'KG') {
  if (quantity === undefined || quantity === null) return `0 ${unit}`;
  return `${Number(quantity).toLocaleString()} ${unit}`;
}

export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}
