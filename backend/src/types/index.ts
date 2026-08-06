export type UserRole =
  | 'farmer'
  | 'labour_provider'
  | 'equipment_owner'
  | 'transport_provider'
  | 'storage_owner'
  | 'processing_unit'
  | 'industry'
  | 'admin';

export type ListingStatus = 'active' | 'sold' | 'expired' | 'draft' | 'removed'
export type ListingCategory = 'crops' | 'byproducts' | 'equipment' | 'inputs' | 'services'

export type TransactionStatus =
  | 'pending' | 'accepted' | 'in_delivery' | 'completed' | 'cancelled' | 'disputed'

export type DeliveryStatus =
  | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'

export interface DynamoUser {
  PK:          string
  SK:          string
  entityType:  'USER'
  userId:      string
  email:       string
  fullName:    string
  phone?:      string
  role:        UserRole
  isVerified:  boolean
  rating:      number
  ratingCount: number
  status:      'active' | 'suspended' | 'pending'
  GSI1PK:      string
  GSI1SK:      string
  GSI2PK?:     string
  GSI2SK?:     string
  createdAt:   string
  updatedAt:   string
}

export interface DynamoListing {
  PK:             string
  SK:             string
  entityType:     'LISTING'
  listingId:      string
  sellerId:       string
  title:          string
  description:    string
  category:       ListingCategory
  subCategory:    string
  quantity:       number
  unit:           string
  pricePerUnit:   number
  currency:       string
  images:         string[]
  location:       { lat: number; lng: number; address: string; region: string }
  availableFrom:  string
  availableUntil: string
  tags:           string[]
  status:         ListingStatus
  viewCount:      number
  offerCount:     number
  GSI1PK:         string
  GSI1SK:         string
  GSI2PK:         string
  GSI2SK:         string
  GSI3PK:         string
  GSI3SK:         string
  createdAt:      string
  updatedAt:      string
}
