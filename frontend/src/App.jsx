import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Layouts
import PublicLayout from '@/layouts/PublicLayout';
import ProtectedLayout from '@/layouts/ProtectedLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Public pages
import LandingPage from '@/pages/public/LandingPage';
import MarketplacePage from '@/pages/public/MarketplacePage';
import ListingDetailPage from '@/pages/public/ListingDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
// import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Shared protected pages
import DashboardRouter from '@/pages/dashboard/DashboardRouter';
import ProfilePage from '@/pages/shared/ProfilePage';
import MessagesPage from '@/pages/shared/MessagesPage';
import NotificationsPage from '@/pages/shared/NotificationsPage';
import SettingsPage from '@/pages/shared/SettingsPage';
import AIAdvisorPage from '@/pages/shared/AIAdvisorPage';

// Role dashboards
import FarmerDashboard from '@/pages/farmer/FarmerDashboard';
import CreateListingPage from '@/pages/farmer/CreateListingPage';
import EditListingPage from '@/pages/farmer/EditListingPage';
import MyListingsPage from '@/pages/farmer/MyListingsPage';
import LabourDashboard from '@/pages/labour/LabourDashboard';
import EquipmentDashboard from '@/pages/equipment/EquipmentDashboard';
import TransportDashboard from '@/pages/transport/TransportDashboard';
import StorageDashboard from '@/pages/storage/StorageDashboard';
import ProcessingDashboard from '@/pages/processing/ProcessingDashboard';
import IndustryDashboard from '@/pages/industry/IndustryDashboard';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminListingsPage from '@/pages/admin/AdminListingsPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';

// Guards
import RoleGuard from '@/components/guards/RoleGuard';
import { UserRole } from '@/types/auth.types';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <Routes>
            {/* ── Public Routes ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/marketplace/:listingId" element={<ListingDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
            </Route>

            {/* ── Protected Routes ── */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/ai-advisor" element={<AIAdvisorPage />} />

              <Route element={<RoleGuard roles={[UserRole.FARMER]} />}>
                <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
                <Route path="/listings/create" element={<CreateListingPage />} />
                <Route path="/listings/edit/:listingId" element={<EditListingPage />} />
                <Route path="/listings/my" element={<MyListingsPage />} />
              </Route>

              <Route element={<RoleGuard roles={[UserRole.LABOUR_PROVIDER]} />}>
                <Route path="/dashboard/labour" element={<LabourDashboard />} />
              </Route>

              <Route element={<RoleGuard roles={[UserRole.EQUIPMENT_OWNER]} />}>
                <Route path="/dashboard/equipment" element={<EquipmentDashboard />} />
              </Route>

              <Route element={<RoleGuard roles={[UserRole.TRANSPORT_PROVIDER]} />}>
                <Route path="/dashboard/transport" element={<TransportDashboard />} />
              </Route>

              <Route element={<RoleGuard roles={[UserRole.STORAGE_OWNER]} />}>
                <Route path="/dashboard/storage" element={<StorageDashboard />} />
              </Route>

              <Route element={<RoleGuard roles={[UserRole.PROCESSING_UNIT]} />}>
                <Route path="/dashboard/processing" element={<ProcessingDashboard />} />
              </Route>

              <Route element={<RoleGuard roles={[UserRole.INDUSTRY]} />}>
                <Route path="/dashboard/industry" element={<IndustryDashboard />} />
              </Route>

              {/* Admin */}
              <Route element={<RoleGuard roles={[UserRole.ADMIN]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/listings" element={<AdminListingsPage />} />
                  <Route path="/admin/reports" element={<AdminReportsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>);

}

export default App;