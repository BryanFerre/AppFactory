import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import AppFactory from "@/pages/AppFactory";
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

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Auth Context
import { AuthProvider, useAuth } from "@/context/AuthContext";

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

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="app-factory" element={<AppFactory />} />
        <Route path="installed-apps" element={<InstalledApps />} />
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
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
