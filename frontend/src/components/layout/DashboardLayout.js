import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
  LayoutDashboard, Factory, Package, TrendingUp, Megaphone,
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

// AppFactory Logo Component for sidebar
const AppFactoryLogo = () => (
  <svg viewBox="0 0 169.82 38.92" className="h-7 w-auto">
    <defs>
      <style>{`.cls-1{fill:#fff;}.cls-2{fill:#4865af;}`}</style>
    </defs>
    <g>
      <path className="cls-1" d="M15.76,18.86H7.21l-.73,2.15c-.38,1.14-1.45,1.9-2.65,1.9H0L8.07.61c.13-.36.48-.61.87-.61h5.17c.39,0,.73.24.87.61l8.07,22.3h-3.9c-1.2,0-2.27-.76-2.65-1.9l-.73-2.15ZM14.32,14.55l-2.84-8.39-2.81,8.39h5.65Z"/>
      <path className="cls-1" d="M31.19,5.22c.96-.52,2.08-.78,3.36-.78,1.5,0,2.86.38,4.08,1.14,1.22.76,2.18,1.85,2.89,3.26.71,1.41,1.06,3.06,1.06,4.93s-.35,3.52-1.06,4.94c-.71,1.42-1.67,2.52-2.89,3.3-1.22.77-2.58,1.16-4.08,1.16-1.26,0-2.38-.26-3.34-.78s-1.72-1.2-2.27-2.02v8.43c0,1.55-1.25,2.8-2.8,2.8h-2.78V5.62c0-.51.41-.92.92-.92h3.74c.51,0,.92.41.92.92v1.66c.54-.85,1.29-1.53,2.25-2.06ZM35.74,10.49c-.77-.79-1.72-1.19-2.86-1.19s-2.05.4-2.82,1.21c-.77.8-1.16,1.9-1.16,3.3s.39,2.49,1.16,3.3c.77.81,1.71,1.21,2.82,1.21s2.06-.41,2.84-1.22c.78-.82,1.17-1.92,1.17-3.31s-.39-2.48-1.16-3.28Z"/>
      <path className="cls-1" d="M51.16,5.22c.96-.52,2.08-.78,3.36-.78,1.5,0,2.86.38,4.08,1.14,1.22.76,2.18,1.85,2.89,3.26.71,1.41,1.06,3.06,1.06,4.93s-.35,3.52-1.06,4.94c-.71,1.42-1.67,2.52-2.89,3.3-1.22.77-2.58,1.16-4.08,1.16-1.26,0-2.38-.26-3.34-.78s-1.72-1.2-2.27-2.02v11.22h-2.78c-1.55,0-2.8-1.25-2.8-2.8V5.62c0-.51.41-.92.92-.92h3.74c.51,0,.92.41.92.92v1.66c.54-.85,1.29-1.53,2.25-2.06ZM55.71,10.49c-.77-.79-1.72-1.19-2.86-1.19s-2.05.4-2.82,1.21c-.77.8-1.16,1.9-1.16,3.3s.39,2.49,1.16,3.3c.77.81,1.71,1.21,2.82,1.21s2.06-.41,2.84-1.22c.78-.82,1.17-1.92,1.17-3.31s-.39-2.48-1.16-3.28Z"/>
      <path className="cls-1" d="M76.8.1v1.89h-10.05v8.52h8.48v1.89h-8.48v10.51h-2.28V.1h12.33Z"/>
      <path className="cls-1" d="M77.97,9.15c.73-1.38,1.74-2.45,3.03-3.2s2.76-1.13,4.39-1.13,3.16.39,4.39,1.17c1.23.78,2.12,1.78,2.66,3v-3.92h2.28v17.82h-2.28v-3.95c-.57,1.22-1.46,2.22-2.69,3.02-1.23.79-2.69,1.19-4.39,1.19s-3.06-.38-4.36-1.14c-1.29-.76-2.31-1.84-3.03-3.23-.73-1.39-1.09-3-1.09-4.83s.36-3.43,1.09-4.81ZM91.56,10.21c-.59-1.09-1.39-1.92-2.4-2.51-1.01-.59-2.13-.88-3.34-.88s-2.39.28-3.39.85c-1,.57-1.79,1.39-2.37,2.46s-.86,2.35-.86,3.83.29,2.74.86,3.83c.58,1.1,1.37,1.94,2.37,2.51,1,.58,2.13.86,3.39.86s2.33-.29,3.34-.88c1.01-.59,1.81-1.42,2.4-2.51.59-1.09.88-2.35.88-3.79s-.29-2.7-.88-3.79Z"/>
      <path className="cls-1" d="M97.53,9.15c.74-1.38,1.76-2.45,3.07-3.2,1.3-.75,2.79-1.13,4.47-1.13,2.2,0,4.01.54,5.43,1.63,1.42,1.09,2.34,2.57,2.76,4.44h-2.45c-.31-1.28-.96-2.29-1.97-3.02-1.01-.73-2.27-1.09-3.77-1.09-1.2,0-2.27.27-3.23.82-.96.54-1.71,1.35-2.27,2.43-.55,1.08-.83,2.4-.83,3.96s.28,2.89.83,3.98c.55,1.09,1.31,1.9,2.27,2.45.96.54,2.03.82,3.23.82,1.5,0,2.76-.36,3.77-1.09,1.01-.73,1.67-1.75,1.97-3.05h2.45c-.41,1.83-1.34,3.3-2.77,4.41-1.44,1.11-3.24,1.66-5.42,1.66-1.67,0-3.17-.38-4.47-1.13-1.31-.75-2.33-1.82-3.07-3.2-.74-1.38-1.11-3-1.11-4.85s.37-3.46,1.11-4.85Z"/>
      <path className="cls-1" d="M118.25,7.02v11.06c0,1.09.21,1.84.62,2.25.41.41,1.14.62,2.19.62h2.09v1.96h-2.45c-1.61,0-2.81-.38-3.59-1.13s-1.17-1.98-1.17-3.7V7.02h-2.48v-1.92h2.48V.62h2.32v4.47h4.89v1.92h-4.89Z"/>
      <path className="cls-1" d="M127.55,22.04c-1.34-.75-2.39-1.82-3.17-3.2-.77-1.38-1.16-3-1.16-4.85s.39-3.46,1.17-4.85c.78-1.38,1.85-2.45,3.2-3.2s2.86-1.13,4.54-1.13,3.19.38,4.55,1.13,2.43,1.82,3.2,3.2c.77,1.38,1.16,3,1.16,4.85s-.39,3.44-1.17,4.83-1.86,2.46-3.23,3.21c-1.37.75-2.89,1.13-4.57,1.13s-3.18-.38-4.52-1.13ZM135.33,20.38c1-.53,1.81-1.34,2.43-2.41s.93-2.4.93-3.96-.3-2.89-.91-3.96c-.61-1.08-1.42-1.88-2.42-2.41-1-.53-2.09-.8-3.26-.8s-2.26.27-3.26.8c-1,.53-1.8,1.34-2.4,2.41-.6,1.08-.9,2.4-.9,3.96s.3,2.89.9,3.96c.6,1.08,1.39,1.88,2.38,2.41.99.53,2.07.8,3.25.8s2.26-.27,3.26-.8Z"/>
      <path className="cls-1" d="M147.61,5.68c1.03-.61,2.3-.91,3.8-.91v2.38h-.62c-1.65,0-2.98.45-3.98,1.34-1,.89-1.5,2.38-1.5,4.47v9.95h-2.28V5.09h2.28v3.17c.5-1.11,1.27-1.97,2.3-2.58Z"/>
      <path className="cls-1" d="M169.82,5.09l-10.57,26.2h-2.38l3.46-8.48-7.31-17.72h2.51l6.07,15.21,5.87-15.21h2.35Z"/>
    </g>
    <g>
      <path className="cls-2" d="M70.98,32.2c.31.39.47.84.47,1.33,0,.42-.11.81-.33,1.15-.22.34-.54.61-.95.8-.42.2-.9.29-1.45.29h-3.34v-8.34h3.18c.57,0,1.06.1,1.46.29.41.19.72.45.92.77.21.32.31.69.31,1.09,0,.48-.13.88-.38,1.2-.26.32-.6.56-1.03.71.45.08.83.32,1.14.71ZM66.74,30.94h1.69c.45,0,.8-.1,1.05-.31s.38-.5.38-.88-.13-.67-.38-.88-.6-.32-1.05-.32h-1.69v2.39ZM69.68,34.32c.26-.22.4-.54.4-.94s-.14-.73-.42-.97c-.28-.24-.65-.36-1.12-.36h-1.8v2.6h1.85c.46,0,.83-.11,1.09-.34Z"/>
      <path className="cls-2" d="M78.58,29.16l-4.06,9.72h-1.42l1.34-3.22-2.6-6.5h1.52l1.86,5.04,1.93-5.04h1.42Z"/>
      <path className="cls-2" d="M83.8,35.31c-.65-.36-1.17-.87-1.55-1.52s-.57-1.39-.57-2.2.19-1.55.57-2.2c.38-.65.9-1.15,1.55-1.52.65-.36,1.37-.55,2.14-.55s1.5.18,2.15.55c.65.36,1.17.87,1.54,1.52.38.65.56,1.38.56,2.2s-.19,1.55-.56,2.2c-.38.65-.89,1.16-1.54,1.52-.65.36-1.37.55-2.15.55s-1.49-.18-2.14-.55ZM87.42,34.29c.43-.25.77-.61,1.01-1.08.24-.47.37-1.01.37-1.63s-.12-1.16-.37-1.62c-.24-.46-.58-.82-1.01-1.07-.43-.25-.92-.37-1.48-.37s-1.04.12-1.48.37c-.43.25-.77.6-1.01,1.07-.24.46-.37,1-.37,1.62s.12,1.16.37,1.63.58.83,1.01,1.08c.43.25.92.38,1.48.38s1.04-.13,1.48-.38Z"/>
      <path className="cls-2" d="M93.56,29.37c.4-.21.85-.31,1.36-.31.58,0,1.1.14,1.58.43.48.28.85.68,1.12,1.19.27.51.41,1.1.41,1.76s-.14,1.26-.41,1.78c-.27.52-.65.93-1.12,1.22-.48.29-1,.44-1.58.44-.5,0-.95-.1-1.34-.31-.39-.2-.71-.46-.96-.76v4.1h-1.37v-9.76h1.37v.97c.23-.3.55-.56.95-.77ZM96.35,31.26c-.19-.33-.44-.58-.74-.76-.31-.17-.64-.26-.99-.26s-.67.09-.98.26c-.31.18-.56.43-.74.77-.19.34-.28.73-.28,1.19s.09.85.28,1.19c.19.34.44.6.74.77.31.18.63.26.98.26s.68-.09.99-.27c.31-.18.56-.44.74-.79.19-.34.28-.74.28-1.2s-.09-.85-.28-1.18Z"/>
      <path className="cls-2" d="M100.68,30.28v3.66c0,.25.06.43.17.53.12.11.31.16.59.16h.84v1.14h-1.08c-.62,0-1.09-.14-1.42-.43-.33-.29-.49-.76-.49-1.4v-3.66h-.78v-1.12h.78v-1.64h1.38v1.64h1.61v1.12h-1.61Z"/>
      <path className="cls-2" d="M103.32,28.04c-.17-.17-.25-.38-.25-.62s.08-.46.25-.62.38-.25.62-.25.44.08.61.25.25.38.25.62-.08.46-.25.62c-.17.17-.37.25-.61.25s-.46-.08-.62-.25ZM104.61,29.16v6.61h-1.37v-6.61h1.37Z"/>
      <path className="cls-2" d="M107.29,35.46c-.5-.28-.9-.68-1.19-1.2s-.43-1.11-.43-1.79.15-1.27.44-1.79c.3-.52.7-.92,1.21-1.2.51-.28,1.08-.42,1.72-.42s1.2.14,1.72.42c.51.28.92.68,1.21,1.2s.44,1.12.44,1.79-.15,1.27-.46,1.79c-.3.52-.72.92-1.24,1.21-.52.28-1.1.43-1.73.43s-1.19-.14-1.69-.43ZM109.97,34.44c.31-.17.56-.42.75-.76.19-.34.29-.74.29-1.22s-.09-.89-.28-1.22c-.18-.33-.43-.58-.73-.75-.3-.17-.63-.25-.98-.25s-.68.08-.98.25c-.3.17-.54.42-.71.75-.18.33-.26.74-.26,1.22,0,.71.18,1.26.55,1.65.36.39.82.58,1.37.58.35,0,.68-.08.99-.25Z"/>
      <path className="cls-2" d="M116.4,29.39c.38-.65.9-1.15,1.55-1.52.65-.36,1.37-.55,2.14-.55.89,0,1.68.22,2.37.65.69.44,1.19,1.05,1.51,1.85h-1.64c-.22-.44-.52-.77-.9-.98-.38-.22-.83-.32-1.33-.32-.55,0-1.04.12-1.48.37-.43.25-.77.6-1.01,1.07-.24.46-.37,1-.37,1.62s.12,1.16.37,1.62.58.82,1.01,1.07c.43.25.92.38,1.48.38.5,0,.95-.11,1.33-.32s.68-.54.9-.98h1.64c-.31.8-.81,1.42-1.51,1.85-.69.43-1.48.65-2.37.65-.78,0-1.5-.18-2.15-.55-.65-.36-1.16-.87-1.54-1.52s-.57-1.38-.57-2.2.19-1.55.57-2.2Z"/>
      <path className="cls-2" d="M126.63,26.9v8.88h-1.37v-8.88h1.37Z"/>
      <path className="cls-2" d="M129.31,35.46c-.5-.28-.9-.68-1.19-1.2s-.43-1.11-.43-1.79.15-1.27.44-1.79c.3-.52.7-.92,1.21-1.2.51-.28,1.08-.42,1.72-.42s1.2.14,1.72.42c.51.28.92.68,1.21,1.2s.44,1.12.44,1.79-.15,1.27-.46,1.79c-.3.52-.72.92-1.24,1.21-.52.28-1.1.43-1.73.43s-1.19-.14-1.69-.43ZM131.99,34.44c.31-.17.56-.42.75-.76.19-.34.29-.74.29-1.22s-.09-.89-.28-1.22c-.18-.33-.43-.58-.73-.75-.3-.17-.63-.25-.98-.25s-.68.08-.98.25c-.3.17-.54.42-.71.75-.18.33-.26.74-.26,1.22,0,.71.18,1.26.55,1.65.36.39.82.58,1.37.58.35,0,.68-.08.99-.25Z"/>
      <path className="cls-2" d="M141.48,29.16v6.61h-1.37v-.78c-.22.27-.5.49-.85.64-.35.16-.72.23-1.11.23-.52,0-.99-.11-1.4-.32s-.74-.54-.97-.96c-.24-.42-.35-.94-.35-1.54v-3.89h1.36v3.68c0,.59.15,1.05.44,1.36s.7.47,1.21.47.92-.16,1.22-.47c.3-.32.45-.77.45-1.36v-3.68h1.37Z"/>
      <path className="cls-2" d="M142.93,30.68c.28-.51.65-.91,1.13-1.19.48-.28,1.01-.43,1.59-.43.43,0,.86.09,1.28.28.42.19.75.44,1,.75v-3.19h1.38v8.88h-1.38v-1c-.22.32-.53.58-.93.79-.4.21-.85.31-1.36.31-.58,0-1.1-.15-1.58-.44-.48-.29-.85-.7-1.13-1.22-.28-.52-.41-1.12-.41-1.78s.14-1.25.41-1.76ZM147.65,31.28c-.19-.34-.43-.59-.74-.77-.3-.18-.63-.26-.98-.26s-.68.09-.98.26c-.3.17-.55.42-.74.76-.19.33-.28.73-.28,1.18s.09.86.28,1.2c.19.34.44.61.74.79.31.18.63.27.98.27s.68-.09.98-.26c.3-.18.55-.43.74-.77.19-.34.28-.74.28-1.19s-.09-.85-.28-1.19Z"/>
    </g>
  </svg>
);

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app-factory', icon: Factory, label: 'App Factory' },
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
            <AppFactoryLogo />
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
