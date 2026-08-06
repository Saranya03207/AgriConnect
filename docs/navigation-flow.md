# AgriConnect – Navigation Flow

## Public Routes (unauthenticated)

```
/                           → Landing Page
/marketplace                → Browse Listings (public)
/marketplace/:listingId     → Listing Detail (public)
/login                      → Login Page
/register                   → Registration Page
  /register/farmer          → Farmer Registration
  /register/buyer           → Buyer Registration
  /register/agribusiness    → Agribusiness Registration
  /register/logistics       → Logistics Provider Registration
/forgot-password            → Forgot Password
/reset-password             → Reset Password
/about                      → About Page
/contact                    → Contact Page
```

---

## Authenticated Routes (all roles)

```
/dashboard                  → Role-specific dashboard (redirect based on role)
/profile                    → My Profile
/profile/edit               → Edit Profile
/notifications              → Notification Center
/messages                   → Conversations List
/messages/:conversationId   → Chat Thread
/ai-advisor                 → AI Advisor Home
/settings                   → Account Settings
```

---

## Farmer Routes

```
/dashboard/farmer           → Farmer Dashboard (overview, stats)
/listings/my                → My Listings
/listings/create            → Create New Listing
/listings/:listingId/edit   → Edit Listing
/transactions/selling       → My Sales / Incoming Offers
/transactions/:id           → Transaction Detail
/deliveries/outgoing        → My Outgoing Deliveries
/ai-advisor/crop-advice     → AI Crop Advice
/ai-advisor/byproduct-ideas → AI By-product Suggestions
/ai-advisor/pricing         → AI Pricing Estimate
```

---

## Buyer Routes

```
/dashboard/buyer            → Buyer Dashboard
/marketplace                → Browse Listings
/marketplace/saved          → Saved Listings
/transactions/buying        → My Purchases / Offers Made
/transactions/:id           → Transaction Detail
/deliveries/incoming        → Incoming Deliveries
/ai-advisor/market-insights → AI Market Insights
```

---

## Agribusiness Routes

```
/dashboard/agribusiness     → Agribusiness Dashboard (analytics)
/marketplace                → Browse Listings
/demands/my                 → My Demand Listings
/demands/create             → Post a Demand
/demands/:demandId/edit     → Edit Demand
/transactions/buying        → Purchases
/transactions/:id           → Transaction Detail
/deliveries/incoming        → Deliveries
/analytics                  → Supply Analytics
/ai-advisor/market-insights → AI Market Insights
/ai-advisor/byproduct-ideas → AI By-product Suggestions
```

---

## Logistics Provider Routes

```
/dashboard/logistics        → Logistics Dashboard
/deliveries/available       → Available Delivery Jobs
/deliveries/active          → My Active Deliveries
/deliveries/:id             → Delivery Detail + Map
/deliveries/history         → Past Deliveries
/earnings                   → Earnings Summary
```

---

## Admin Routes

```
/admin                      → Admin Dashboard
/admin/users                → User Management
/admin/users/:userId        → User Detail
/admin/listings             → Listing Management
/admin/listings/:listingId  → Listing Detail (admin view)
/admin/transactions         → Transaction Overview
/admin/transactions/:id     → Transaction Detail
/admin/reports              → Analytics & Reports
/admin/categories           → Category Management
/admin/notifications        → Broadcast Notifications
```

---

## Navigation Guard Logic

```
Route Access → Check JWT → Decode role claim →
  - No JWT         → Redirect to /login
  - Role mismatch  → Redirect to /dashboard (role-appropriate)
  - Verified only  → If isVerified=false, redirect to /profile (verification pending)
```

---

## React Router Structure Summary

```
App
├── PublicLayout
│   ├── /                     LandingPage
│   ├── /marketplace          MarketplacePage
│   ├── /marketplace/:id      ListingDetailPage
│   ├── /login                LoginPage
│   ├── /register             RegisterPage
│   └── ...
│
├── ProtectedLayout (requires auth)
│   ├── /dashboard            DashboardRouter (redirects by role)
│   ├── /profile              ProfilePage
│   ├── /messages             MessagesPage
│   ├── /notifications        NotificationsPage
│   ├── /ai-advisor           AIAdvisorPage
│   ├── /settings             SettingsPage
│   │
│   ├── FarmerLayout (role=farmer)
│   │   ├── /listings/my
│   │   ├── /listings/create
│   │   └── ...
│   │
│   ├── BuyerLayout (role=buyer)
│   │   └── ...
│   │
│   ├── AgribusinessLayout (role=agribusiness)
│   │   ├── /demands/my
│   │   ├── /analytics
│   │   └── ...
│   │
│   ├── LogisticsLayout (role=logistics)
│   │   └── ...
│   │
│   └── AdminLayout (role=admin)
│       ├── /admin
│       └── ...
```
