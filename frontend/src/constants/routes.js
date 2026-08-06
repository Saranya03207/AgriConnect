export const ROUTES = {
  // Public
  HOME: '/',
  MARKETPLACE: '/marketplace',
  LISTING_DETAIL: '/marketplace/:listingId',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  RESET_PASSWORD: '/reset-password',

  // Shared protected
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  AI_ADVISOR: '/ai-advisor',

  // Role dashboards
  FARMER_DASHBOARD: '/dashboard/farmer',
  LABOUR_DASHBOARD: '/dashboard/labour',
  EQUIPMENT_DASHBOARD: '/dashboard/equipment',
  TRANSPORT_DASHBOARD: '/dashboard/transport',
  STORAGE_DASHBOARD: '/dashboard/storage',
  PROCESSING_DASHBOARD: '/dashboard/processing',
  INDUSTRY_DASHBOARD: '/dashboard/industry',
  ADMIN_DASHBOARD: '/admin',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_LISTINGS: '/admin/listings',
  ADMIN_REPORTS: '/admin/reports',

  // Listings (Farmer)
  LISTING_CREATE: '/listings/create',
  LISTING_EDIT: '/listings/edit/:listingId',
  LISTING_MY: '/listings/my'
};