import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ProcurementPlaceholderPage from './pages/ProcurementPlaceholderPage';
import OrdersPlaceholderPage from './pages/OrdersPlaceholderPage';
import ServicesPlaceholderPage from './pages/ServicesPlaceholderPage';
import MessagesPlaceholderPage from './pages/MessagesPlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Adaptive layout for marketplace routes:
 * If user is authenticated, preserves the DashboardLayout (sidebar, user card, role banner).
 * If user is unauthenticated, renders with PublicLayout (top navigation, sign in CTA, footer).
 */
function MarketplaceLayout() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardLayout /> : <PublicLayout />;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes with Top Navigation */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/404" element={<NotFoundPage />} />
        </Route>

        {/* Marketplace Routes (Public browsing + Authenticated actions) */}
        <Route element={<MarketplaceLayout />}>
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />
        </Route>

        {/* Protected Dashboard & Operations Routes with Sidebar Navigation */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/procurement" element={<ProcurementPlaceholderPage />} />
          <Route path="/orders" element={<OrdersPlaceholderPage />} />
          <Route path="/services" element={<ServicesPlaceholderPage />} />
          <Route path="/messages" element={<MessagesPlaceholderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;