import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GoldUnitProvider } from "./contexts/GoldUnitContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./components/Layout/super_admin/Layout";
import AdminLayout from "./components/Layout/admin/AdminLayout";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

// Home & public pages
import HomePage from "./pages/home/HomePage";
import RegisterPage from "./pages/auth/RegisterPage";
import ShopDetailPage from "./pages/home/ShopDetailPage";
import PlaceOrderPage from "./pages/home/PlaceOrderPage";
import CustomerProfile from './pages/home/ProfilePage';

// Super Admin Pages
import Dashboard from "./pages/Super_Admin_Dashboard/Dashboard";
import PriceManagement from "./pages/Super_Admin_Dashboard/PriceManagement";
import AdminManagement from "./pages/Super_Admin_Dashboard/AdminManagement";
import Analytics from "./pages/Super_Admin_Dashboard/Analytics";

// Orders
import MyOrders from "./pages/Super_Admin_Dashboard/MyOrders";
import AllOrders from "./pages/Super_Admin_Dashboard/AllOrders";

// Customers
import MyCustomers from "./pages/Super_Admin_Dashboard/MyCustomers";
import AllCustomers from "./pages/Super_Admin_Dashboard/AllCustomers";

import Media from "./pages/Super_Admin_Dashboard/Media";
import Notifications from "./pages/Super_Admin_Dashboard/Notifications";
import Profile from "./pages/Super_Admin_Dashboard/Profile";

// Admin Pages
import AdminDashboard from "./pages/Admin_Dashboard/Dashboard";
import AdminOrders from "./pages/Admin_Dashboard/Orders";
import AdminCustomers from "./pages/Admin_Dashboard/Customers";
import AdminPictures from "./pages/Admin_Dashboard/Pictures";
import AdminAnalytics from "./pages/Admin_Dashboard/Analytics";
import AdminNotifications from "./pages/Admin_Dashboard/Notifications";
import AdminProfile from "./pages/Admin_Dashboard/Profile";
import AdminPrices from "./pages/Admin_Dashboard/Prices";
import SuperAdminPricing from "./pages/Admin_Dashboard/SuperAdminPricing"; // ← ADD THIS IMPORT

// Customer Pages
import CustomerOrders from "./pages/home/MyOrders";
import CustomerNotifications from "./pages/home/Notifications";

function App() {
  // console.log(import.meta.env.VITE_API_URL);
  return (
    <ThemeProvider>
      <GoldUnitProvider>
        <Router>
          <AuthProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shop/:id" element={<ShopDetailPage />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes (any logged-in user) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/shop/:id/order" element={<PlaceOrderPage />} />
            </Route>

            {/* Customer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/my-orders" element={<CustomerOrders />} />
              <Route path="/notifications" element={<CustomerNotifications />} />
              <Route path="/profile" element={<CustomerProfile />} />
            </Route>

            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute requiredRole="super_admin" />}>
              <Route element={<Layout />}>
                <Route path="/super-admin" element={<Dashboard />} />
                <Route path="/super-admin/prices" element={<PriceManagement />} />
                <Route path="/super-admin/admins" element={<AdminManagement />} />
                <Route path="/super-admin/analytics" element={<Analytics />} />

                {/* Orders */}
                <Route path="/super-admin/orders/my-orders" element={<MyOrders />} />
                <Route path="/super-admin/orders/all-orders" element={<AllOrders />} />

                {/* Customers */}
                <Route path="/super-admin/customers/my-customers" element={<MyCustomers />} />
                <Route path="/super-admin/customers/all-customers" element={<AllCustomers />} />

                <Route
                  path="/super-admin/customers"
                  element={<Navigate to="/super-admin/customers/my-customers" replace />}
                />

                <Route path="/super-admin/media" element={<Media />} />
                <Route path="/super-admin/notifications" element={<Notifications />} />
                <Route path="/super-admin/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/prices" element={<AdminPrices />} />
                <Route path="/admin/super-pricing" element={<SuperAdminPricing />} /> {/* ← ADD THIS ROUTE */}
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/media" element={<AdminPictures />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </GoldUnitProvider>
  </ThemeProvider>
  );
}

export default App;