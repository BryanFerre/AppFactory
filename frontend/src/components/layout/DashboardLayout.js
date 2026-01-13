import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
  LayoutDashboard, Package, TrendingUp, Megaphone,
  Activity, HardDrive, Wallet, FileText, HelpCircle, Settings,
  Bell, ChevronDown, LogOut, Menu, X
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// App Factory Logo Icon Component
const AppFactoryIcon = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <path fill="#4865af" d="M39.71,15.49h1.91c-.13-.14-.24-.29-.33-.46-.17-.32-.35-.63-.54-.94-.41-.66-.44-1.47-.1-2.17l1.17-2.35c.46-.93.23-2.04-.56-2.71l-2.86-2.4c-.79-.66-1.93-.7-2.76-.09l-2.11,1.55c-.62.46-1.43.56-2.15.28-.34-.13-.68-.26-1.02-.37-.73-.24-1.28-.85-1.46-1.59l-.61-2.54c-.24-1-1.14-1.71-2.17-1.71h-3.73c-1.03,0-1.93.71-2.17,1.71l-.61,2.54c-.18.75-.73,1.35-1.46,1.59-.35.11-.69.24-1.02.37-.72.28-1.53.18-2.15-.28l-2.11-1.55c-.83-.61-1.97-.58-2.76.09l-2.86,2.4c-.79.66-1.02,1.78-.56,2.71l1.17,2.35c.34.69.31,1.51-.1,2.17-.19.31-.37.62-.54.94-.37.68-1.05,1.11-1.82,1.16l-2.61.16c-1.03.06-1.88.83-2.06,1.84L.03,21.87c-.18,1.02.36,2.02,1.31,2.44l2.39,1.05c.71.31,1.2.96,1.32,1.72.05.36.11.72.19,1.08.15.75-.09,1.53-.65,2.06l-1.89,1.8c-.75.71-.91,1.84-.39,2.74l1.86,3.23c.52.89,1.58,1.32,2.57,1.03l2.84-.83c.41-.08,1.01-.08,1.54.34.06.06.13.12.19.17,0,0,0,0,0,0h0c.29.26.58.51.88.75.6.48.92,1.23.83,2l-.29,2.6c-.11,1.03.49,2,1.46,2.35l3.5,1.28c.97.35,2.06,0,2.63-.86l1.45-2.18c.43-.64,1.15-1.02,1.92-1,.18,0,.36,0,.54,0s.36,0,.54,0c.77-.02,1.5.35,1.92,1l1.45,2.18c.57.86,1.66,1.22,2.63.86l3.5-1.28c.97-.35,1.57-1.32,1.46-2.35l-.29-2.6c-.09-.76.23-1.52.83-2,.3-.24.6-.49.89-.75,0,0,.56-.54,1.38-.54.17,0,.35.02.53.08l2.65.78c.99.29,2.05-.13,2.57-1.03l1.86-3.23c.52-.89.35-2.02-.39-2.74l-1.89-1.8c-.56-.53-.8-1.31-.65-2.06.07-.36.14-.72.19-1.08.11-.76.61-1.42,1.32-1.72l2.39-1.05s.09-.04.13-.06h-7.55v-8.76ZM35.03,7.69h3.61v3.61h-3.61v-3.61ZM38.2,26.77h-1.94c-1.19,5.66-6.27,9.9-12.31,9.76-6.55-.14-11.87-5.47-12.01-12.02-.16-7,5.57-12.72,12.57-12.57,2.99.06,5.73,1.21,7.84,3.07h3.93v4.03h-.9c.7,1.5,1.11,3.16,1.15,4.91,0,.02,0,.04,0,.07h1.68v2.74ZM41.21,29.43v2.74h-2.74v-2.74h2.74Z"/>
    <rect fill="#fff" x="41.65" y="17.28" width="5.23" height="5.23"/>
    <rect fill="#fff" x="32.84" y="16.01" width="2.19" height="2.19"/>
    <rect fill="#fff" x="25.83" y="20.43" width="3.61" height="3.61"/>
  </svg>
);

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app-factory', icon: AppFactoryIcon, label: 'App Factory', isCustom: true },
  { path: '/installed-apps', icon: Package, label: 'Installed Apps' },
  { path: '/earnings', icon: TrendingUp, label: 'Earnings' },
  { path: '/promotion', icon: Megaphone, label: 'Promotion Tools' },
  { path: '/node-health', icon: Activity, label: 'Node Health' },
  { path: '/capacity', icon: HardDrive, label: 'Capacity & Upgrades' },
  { path: '/payouts', icon: Wallet, label: 'Payouts' },
  { path: '/reports', icon: FileText, label: 'Reports / Tax' },
  { path: '/support', icon: HelpCircle, label: 'Support' },
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
        glass-card border-r border-white/5
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center">
              <AppFactoryIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-['Outfit']">App Factory</h1>
              <p className="text-xs text-slate-400">Node Dashboard</p>
            </div>
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
          <div className="pt-4 mt-4 border-t border-white/5">
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
        <header className="sticky top-0 z-30 glass-card border-b border-white/5 px-4 lg:px-6 py-3">
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
