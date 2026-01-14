import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Public Pages
import LandingPage from "@/pages/public/LandingPage";
import PurchaseSuccess from "@/pages/public/PurchaseSuccess";

// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Dashboard Pages
import Dashboard from "@/pages/Dashboard";
import AppMarketplace from "@/pages/AppMarketplace";
import InstalledApps from "@/pages/InstalledApps";
import Earnings from "@/pages/Earnings";
import Promotion from "@/pages/Promotion";
import NodeHealth from "@/pages/NodeHealth";
import Capacity from "@/pages/Capacity";
import Payouts from "@/pages/Payouts";
import Reports from "@/pages/Reports";
import Support from "@/pages/Support";
import Settings from "@/pages/Settings";
import Wallet from "@/pages/Wallet";
import AppDeveloper from "@/pages/AppDeveloper";
import AppDetails from "@/pages/AppDetails";
import ProofOfImpact from "@/pages/ProofOfImpact";
import Leaderboard from "@/pages/Leaderboard";
import HowToEarn from "@/pages/HowToEarn";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminNodes from "@/pages/admin/AdminNodes";
import AdminAppSubmissions from "@/pages/admin/AdminAppSubmissions";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminSupport from "@/pages/admin/AdminSupport";
import AdminRevenue from "@/pages/admin/AdminRevenue";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAccounting from "@/pages/admin/AdminAccounting";
import AdminPointsConfig from "@/pages/admin/AdminPointsConfig";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCoupons from "@/pages/admin/AdminCoupons";

// Layouts
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";

// Auth Context
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with Public Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      
      {/* Purchase Success (no layout) */}
      <Route path="/purchase-success" element={<PurchaseSuccess />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="app-marketplace" element={<AppMarketplace />} />
        <Route path="installed-apps" element={<InstalledApps />} />
        <Route path="app/:appId" element={<AppDetails />} />
        <Route path="proof-of-impact" element={<ProofOfImpact />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="how-to-earn" element={<HowToEarn />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="promotion" element={<Promotion />} />
        <Route path="node-health" element={<NodeHealth />} />
        <Route path="capacity" element={<Capacity />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="support" element={<Support />} />
        <Route path="settings" element={<Settings />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="app-developer" element={<AppDeveloper />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="nodes" element={<AdminNodes />} />
        <Route path="apps" element={<AdminAppSubmissions />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit" element={<AdminAuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="accounting" element={<AdminAccounting />} />
        <Route path="points-config" element={<AdminPointsConfig />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="coupons" element={<AdminCoupons />} />
      </Route>

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
