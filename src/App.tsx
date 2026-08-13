import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { FullPageLoader } from '@/components/ui/Loader';
import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';

import HomePage from '@/pages/customer/HomePage';
import MenuPage from '@/pages/customer/MenuPage';
const CartPage = lazy(() => import('@/pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'));
const TrackOrderPage = lazy(() => import('@/pages/customer/TrackOrderPage'));
const OrdersPage = lazy(() => import('@/pages/customer/OrdersPage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminMenuPage = lazy(() => import('@/pages/admin/AdminMenuPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  return <>{children}</>;
}

const SuspenseWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<SuspenseWrap><LoginPage /></SuspenseWrap>} />
      <Route path="/register" element={<SuspenseWrap><RegisterPage /></SuspenseWrap>} />
      <Route path="/forgot-password" element={<SuspenseWrap><ForgotPasswordPage /></SuspenseWrap>} />
      <Route path="/reset-password" element={<SuspenseWrap><ResetPasswordPage /></SuspenseWrap>} />

      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:category" element={<MenuPage />} />
        <Route path="/cart" element={<SuspenseWrap><CartPage /></SuspenseWrap>} />
        <Route path="/checkout" element={<SuspenseWrap><ProtectedRoute><CheckoutPage /></ProtectedRoute></SuspenseWrap>} />
        <Route path="/track/:id" element={<SuspenseWrap><TrackOrderPage /></SuspenseWrap>} />
        <Route path="/orders" element={<SuspenseWrap><ProtectedRoute><OrdersPage /></ProtectedRoute></SuspenseWrap>} />
        <Route path="/profile" element={<SuspenseWrap><ProtectedRoute><ProfilePage /></ProtectedRoute></SuspenseWrap>} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<SuspenseWrap><AdminDashboard /></SuspenseWrap>} />
        <Route path="orders" element={<SuspenseWrap><AdminOrdersPage /></SuspenseWrap>} />
        <Route path="orders/:id" element={<SuspenseWrap><AdminOrderDetailPage /></SuspenseWrap>} />
        <Route path="menu" element={<SuspenseWrap><AdminMenuPage /></SuspenseWrap>} />
        <Route path="categories" element={<SuspenseWrap><AdminCategoriesPage /></SuspenseWrap>} />
        <Route path="coupons" element={<SuspenseWrap><AdminCouponsPage /></SuspenseWrap>} />
        <Route path="reviews" element={<SuspenseWrap><AdminReviewsPage /></SuspenseWrap>} />
        <Route path="payments" element={<SuspenseWrap><AdminPaymentsPage /></SuspenseWrap>} />
        <Route path="users" element={<SuspenseWrap><AdminUsersPage /></SuspenseWrap>} />
        <Route path="settings" element={<SuspenseWrap><AdminSettingsPage /></SuspenseWrap>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
