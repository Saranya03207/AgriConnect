import { LISTING_CATEGORIES, STANDARD_UNITS, INDIAN_STATES } from './listings';

export { STANDARD_UNITS, INDIAN_STATES };

export const PROCUREMENT_CATEGORIES = LISTING_CATEGORIES;

export const RFQ_STATUSES = [
  { value: 'OPEN', label: 'Open for Quotations', color: 'emerald' },
  { value: 'FULFILLED', label: 'Fulfilled (Quotation Accepted)', color: 'blue' },
  { value: 'CLOSED', label: 'Closed', color: 'slate' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'rose' },
];

export const QUOTATION_STATUSES = [
  { value: 'SUBMITTED', label: 'Quotation Submitted', color: 'amber' },
  { value: 'ACCEPTED', label: 'Quotation Accepted', color: 'emerald' },
  { value: 'REJECTED', label: 'Rejected', color: 'rose' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'slate' },
];
