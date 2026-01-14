import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import axios from 'axios';
import {
  LayoutDashboard, Users, Server, Package, CreditCard, HeadphonesIcon,
  TrendingUp, FileText, ScrollText, Settings, Search, Bell,
  LogOut, ChevronDown, AlertTriangle, Menu, X, Calculator, Zap, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReactComponent as AppCloudLogo } from '@/assets/AppCloud.svg';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'Users & Accounts' },
  { path: '/admin/nodes', icon: Server, label: 'NAPP Nodes' },
  { path: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { path: '/admin/apps', icon: Package, label: 'App Submissions' },
  { path: '/admin/billing', icon: CreditCard, label: 'Billing & Payments' },
  { path: '/admin/accounting', icon: Calculator, label: 'Accounting' },
  { path: '/admin/points-config', icon: Zap, label: 'Points Config' },
  { path: '/admin/support', icon: HeadphonesIcon, label: 'Customer Support' },
  { path: '/admin/revenue', icon: TrendingUp, label: 'Revenue & Payouts' },
  { path: '/admin/reports', icon: FileText, label: 'Reports & Exports' },
  { path: '/admin/audit', icon: ScrollText, label: 'System Logs & Audit' },
  { path: '/admin/settings', icon: Settings, label: 'Admin Settings' },
];

const roleColors = {
  super_admin: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black',
  support: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  finance: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  compliance: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  app_review: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
};

export default function AdminLayout() {
  const { admin, logout, loading } = useAdminAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (admin) {
      // Fetch alerts
      fetchAlerts();
    }
  }, [admin]);

  const fetchAlerts = async () => {
    // Mock alerts for now
    setAlerts([
      { id: 1, type: 'warning', message: '3 nodes offline', time: '5 min ago' },
      { id: 2, type: 'error', message: '2 failed payments', time: '15 min ago' },
      { id: 3, type: 'info', message: '5 pending app reviews', time: '1 hour ago' }
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64
        bg-[rgba(10,12,20,0.98)] backdrop-blur-xl border-r border-white/5
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center justify-between px-3 py-4 mb-4">
            <AppCloudLogo className="w-32 h-auto" />
            <button 
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Admin Info */}
          <div className="pt-4 mt-4 border-t border-white/5">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white truncate">{admin.name}</p>
              <p className="text-xs text-slate-500 truncate">{admin.email}</p>
              <Badge className={`mt-2 text-xs ${roleColors[admin.role] || 'bg-slate-500/20 text-slate-400'}`}>
                {admin.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[rgba(10,12,20,0.95)] backdrop-blur-xl border-b border-white/5 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
              data-testid="admin-mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Environment Badge */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">PRODUCTION</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users, nodes, apps..."
                  className="pl-10 bg-black/40 border-white/10 text-white text-sm h-9"
                  data-testid="admin-search"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Alerts */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="admin-alerts">
                    <Bell className="w-5 h-5 text-slate-400" />
                    {alerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                        {alerts.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-[#0f111a] border-white/10">
                  <div className="px-3 py-2 border-b border-white/5">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      System Alerts
                    </h3>
                  </div>
                  {alerts.map((alert) => (
                    <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.type === 'error' ? 'bg-red-400' :
                          alert.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                        }`} />
                        <span className="text-sm text-white">{alert.message}</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-4">{alert.time}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="admin-profile-menu">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {admin.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0f111a] border-white/10">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="font-medium text-white">{admin.name}</p>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                  </div>
                  <DropdownMenuItem className="text-slate-300 cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem 
                    className="text-red-400 cursor-pointer"
                    onClick={logout}
                    data-testid="admin-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
