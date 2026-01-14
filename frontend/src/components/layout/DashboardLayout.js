import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
  LayoutDashboard, Store, Package, TrendingUp, Megaphone,
  Activity, HardDrive, Wallet, FileText, HelpCircle, Settings,
  Bell, ChevronDown, LogOut, Menu, X, Code, Trophy, Medal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ReactComponent as AppCloudLogo } from '@/assets/AppCloud.svg';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app-marketplace', icon: Store, label: 'App Marketplace' },
  { path: '/installed-apps', icon: Package, label: 'Installed Apps' },
  { path: '/proof-of-impact', icon: Trophy, label: 'Proof of Impact' },
  { path: '/leaderboard', icon: Medal, label: 'Leaderboard' },
  { path: '/earnings', icon: TrendingUp, label: 'Earnings' },
  { path: '/promotion', icon: Megaphone, label: 'Promotion Tools' },
  { path: '/node-health', icon: Activity, label: 'Node Health' },
  { path: '/capacity', icon: HardDrive, label: 'Capacity & Upgrades' },
  { path: '/payouts', icon: Wallet, label: 'Payouts' },
  { path: '/reports', icon: FileText, label: 'Reports / Tax' },
  { path: '/support', icon: HelpCircle, label: 'Support' },
];

const bottomNavItems = [
  { path: '/app-developer', icon: Code, label: 'App Developer' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nodeStatus, setNodeStatus] = useState({ status: 'healthy', earnings_today_usd: 0, earnings_today_opt: 0 });
  const [notifications, setNotifications] = useState([]);
  const [optPrice, setOptPrice] = useState(0.85);

  useEffect(() => {
    fetchNodeStatus();
    fetchNotifications();
    fetchOptPrice();
    const interval = setInterval(fetchOptPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchNodeStatus = async () => {
    try {
      const [nodeRes, earningsRes] = await Promise.all([
        axios.get(`${API}/node/stats`),
        axios.get(`${API}/earnings`)
      ]);
      setNodeStatus({
        status: nodeRes.data.status,
        earnings_today_usd: earningsRes.data.today_usd,
        earnings_today_opt: earningsRes.data.today_opt_rewards
      });
    } catch (error) {
      console.error('Failed to fetch node status');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchOptPrice = async () => {
    try {
      const response = await axios.get(`${API}/price/opt`);
      setOptPrice(response.data.price_usd);
    } catch (error) {
      console.error('Failed to fetch OPT price');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64
        bg-[rgba(15,17,26,0.95)] backdrop-blur-xl border-r border-white/5
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-4 mb-6">
            <AppCloudLogo className="h-10 w-auto" />
            <button 
              className="lg:hidden ml-auto text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-[#4865af]/20 text-[#6b8dd6] border border-[#4865af]/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {item.isCustom ? (
                    <IconComponent className={`w-5 h-5 ${isActive ? '' : ''}`} />
                  ) : (
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-[#6b8dd6]' : ''}`} />
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Settings at bottom */}
          <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <IconComponent className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              );
            })}
            <NavLink
              to="/settings"
              data-testid="nav-settings"
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-colors duration-200
                ${location.pathname === '/settings'
                  ? 'bg-[#4865af]/20 text-[#6b8dd6] border border-[#4865af]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[rgba(15,17,26,0.95)] backdrop-blur-xl border-b border-white/5 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Node Status */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${nodeStatus.status === 'healthy' ? 'bg-emerald-400 animate-pulse-glow' : 'bg-amber-400'}`} />
                <span className="text-sm text-slate-300 capitalize">{nodeStatus.status}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-sm">
                <span className="text-slate-400">Today: </span>
                <span className="text-emerald-400 font-semibold">${nodeStatus.earnings_today_usd?.toFixed(2)}</span>
                <span className="text-slate-500 mx-1">+</span>
                <span className="text-cyan-400 font-semibold">{nodeStatus.earnings_today_opt?.toFixed(2)} OPT</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                    <Bell className="w-5 h-5 text-slate-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-[10px] font-bold flex items-center justify-center text-black">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 glass-card border-white/10">
                  <div className="px-3 py-2 border-b border-white/5">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>
                  {notifications.slice(0, 5).map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          notif.type === 'success' ? 'bg-emerald-400' :
                          notif.type === 'warning' ? 'bg-amber-400' :
                          notif.type === 'error' ? 'bg-red-400' : 'bg-cyan-400'
                        }`} />
                        <span className="text-sm text-white">{notif.message}</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-4">{notif.time}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Wallet Link */}
              <NavLink to="/wallet" data-testid="wallet-link">
                <Button variant="ghost" size="icon">
                  <Wallet className="w-5 h-5 text-slate-400" />
                </Button>
              </NavLink>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="hidden md:block text-sm text-slate-300">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <NavLink to="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/wallet" className="cursor-pointer">
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
