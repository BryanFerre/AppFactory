import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Search, TrendingUp, Download, Users, Server, Layers, DollarSign,
  Package, Activity, Cpu, Globe, Gamepad2, Shield, Image, HardDrive,
  Sparkles, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// App Factory Logo Component
const AppFactoryLogo = () => (
  <svg viewBox="0 0 240.38 48.54" className="h-10 w-auto">
    <defs>
      <style>{`.cls-1{fill:#fff;}.cls-2{fill:#4865af;}`}</style>
    </defs>
    <path className="cls-2" d="M39.71,15.49h1.91c-.13-.14-.24-.29-.33-.46-.17-.32-.35-.63-.54-.94-.41-.66-.44-1.47-.1-2.17l1.17-2.35c.46-.93.23-2.04-.56-2.71l-2.86-2.4c-.79-.66-1.93-.7-2.76-.09l-2.11,1.55c-.62.46-1.43.56-2.15.28-.34-.13-.68-.26-1.02-.37-.73-.24-1.28-.85-1.46-1.59l-.61-2.54c-.24-1-1.14-1.71-2.17-1.71h-3.73c-1.03,0-1.93.71-2.17,1.71l-.61,2.54c-.18.75-.73,1.35-1.46,1.59-.35.11-.69.24-1.02.37-.72.28-1.53.18-2.15-.28l-2.11-1.55c-.83-.61-1.97-.58-2.76.09l-2.86,2.4c-.79.66-1.02,1.78-.56,2.71l1.17,2.35c.34.69.31,1.51-.1,2.17-.19.31-.37.62-.54.94-.37.68-1.05,1.11-1.82,1.16l-2.61.16c-1.03.06-1.88.83-2.06,1.84L.03,21.87c-.18,1.02.36,2.02,1.31,2.44l2.39,1.05c.71.31,1.2.96,1.32,1.72.05.36.11.72.19,1.08.15.75-.09,1.53-.65,2.06l-1.89,1.8c-.75.71-.91,1.84-.39,2.74l1.86,3.23c.52.89,1.58,1.32,2.57,1.03l2.84-.83c.41-.08,1.01-.08,1.54.34.06.06.13.12.19.17,0,0,0,0,0,0h0c.29.26.58.51.88.75.6.48.92,1.23.83,2l-.29,2.6c-.11,1.03.49,2,1.46,2.35l3.5,1.28c.97.35,2.06,0,2.63-.86l1.45-2.18c.43-.64,1.15-1.02,1.92-1,.18,0,.36,0,.54,0s.36,0,.54,0c.77-.02,1.5.35,1.92,1l1.45,2.18c.57.86,1.66,1.22,2.63.86l3.5-1.28c.97-.35,1.57-1.32,1.46-2.35l-.29-2.6c-.09-.76.23-1.52.83-2,.3-.24.6-.49.89-.75,0,0,.56-.54,1.38-.54.17,0,.35.02.53.08l2.65.78c.99.29,2.05-.13,2.57-1.03l1.86-3.23c.52-.89.35-2.02-.39-2.74l-1.89-1.8c-.56-.53-.8-1.31-.65-2.06.07-.36.14-.72.19-1.08.11-.76.61-1.42,1.32-1.72l2.39-1.05s.09-.04.13-.06h-7.55v-8.76ZM35.03,7.69h3.61v3.61h-3.61v-3.61ZM38.2,26.77h-1.94c-1.19,5.66-6.27,9.9-12.31,9.76-6.55-.14-11.87-5.47-12.01-12.02-.16-7,5.57-12.72,12.57-12.57,2.99.06,5.73,1.21,7.84,3.07h3.93v4.03h-.9c.7,1.5,1.11,3.16,1.15,4.91,0,.02,0,.04,0,.07h1.68v2.74ZM41.21,29.43v2.74h-2.74v-2.74h2.74Z"/>
    <g>
      <path className="cls-1" d="M86.33,28.48h-8.55l-1.37,4.05h-5.84l8.29-22.91h6.46l8.29,22.91h-5.91l-1.37-4.05ZM84.89,24.17l-2.84-8.39-2.81,8.39h5.65Z"/>
      <path className="cls-1" d="M101.76,14.84c.96-.52,2.08-.78,3.36-.78,1.5,0,2.86.38,4.08,1.14,1.22.76,2.18,1.85,2.89,3.26.71,1.41,1.06,3.06,1.06,4.93s-.35,3.52-1.06,4.94c-.71,1.42-1.67,2.52-2.89,3.3-1.22.77-2.58,1.16-4.08,1.16-1.26,0-2.38-.26-3.34-.78s-1.72-1.2-2.27-2.02v11.22h-5.58V14.32h5.58v2.58c.54-.85,1.29-1.53,2.25-2.06ZM106.31,20.11c-.77-.79-1.72-1.19-2.86-1.19s-2.05.4-2.82,1.21c-.77.8-1.16,1.9-1.16,3.3s.39,2.49,1.16,3.3c.77.81,1.71,1.21,2.82,1.21s2.06-.41,2.84-1.22c.78-.82,1.17-1.92,1.17-3.31s-.39-2.48-1.16-3.28Z"/>
      <path className="cls-1" d="M121.72,14.84c.96-.52,2.08-.78,3.36-.78,1.5,0,2.86.38,4.08,1.14,1.22.76,2.18,1.85,2.89,3.26.71,1.41,1.06,3.06,1.06,4.93s-.35,3.52-1.06,4.94c-.71,1.42-1.67,2.52-2.89,3.3-1.22.77-2.58,1.16-4.08,1.16-1.26,0-2.38-.26-3.34-.78s-1.72-1.2-2.27-2.02v11.22h-5.58V14.32h5.58v2.58c.54-.85,1.29-1.53,2.25-2.06ZM126.28,20.11c-.77-.79-1.72-1.19-2.86-1.19s-2.05.4-2.82,1.21c-.77.8-1.16,1.9-1.16,3.3s.39,2.49,1.16,3.3c.77.81,1.71,1.21,2.82,1.21s2.06-.41,2.84-1.22c.78-.82,1.17-1.92,1.17-3.31s-.39-2.48-1.16-3.28Z"/>
      <path className="cls-2" d="M147.36,9.72v1.89h-10.05v8.52h8.48v1.89h-8.48v10.51h-2.28V9.72h12.33Z"/>
      <path className="cls-2" d="M148.54,18.77c.73-1.38,1.74-2.45,3.03-3.2s2.76-1.13,4.39-1.13,3.16.39,4.39,1.17c1.23.78,2.12,1.78,2.66,3v-3.92h2.28v17.82h-2.28v-3.95c-.57,1.22-1.46,2.22-2.69,3.02-1.23.79-2.69,1.19-4.39,1.19s-3.06-.38-4.36-1.14c-1.29-.76-2.31-1.84-3.03-3.23-.73-1.39-1.09-3-1.09-4.83s.36-3.43,1.09-4.81ZM162.13,19.83c-.59-1.09-1.39-1.92-2.4-2.51-1.01-.59-2.13-.88-3.34-.88s-2.39.28-3.39.85c-1,.57-1.79,1.39-2.37,2.46s-.86,2.35-.86,3.83.29,2.74.86,3.83c.58,1.1,1.37,1.94,2.37,2.51,1,.58,2.13.86,3.39.86s2.33-.29,3.34-.88c1.01-.59,1.81-1.42,2.4-2.51.59-1.09.88-2.35.88-3.79s-.29-2.7-.88-3.79Z"/>
      <path className="cls-2" d="M168.1,18.77c.74-1.38,1.76-2.45,3.07-3.2,1.3-.75,2.79-1.13,4.47-1.13,2.2,0,4.01.54,5.43,1.63,1.42,1.09,2.34,2.57,2.76,4.44h-2.45c-.31-1.28-.96-2.29-1.97-3.02-1.01-.73-2.27-1.09-3.77-1.09-1.2,0-2.27.27-3.23.82-.96.54-1.71,1.35-2.27,2.43-.55,1.08-.83,2.4-.83,3.96s.28,2.89.83,3.98c.55,1.09,1.31,1.9,2.27,2.45.96.54,2.03.82,3.23.82,1.5,0,2.76-.36,3.77-1.09,1.01-.73,1.67-1.75,1.97-3.05h2.45c-.41,1.83-1.34,3.3-2.77,4.41-1.44,1.11-3.24,1.66-5.42,1.66-1.67,0-3.17-.38-4.47-1.13-1.31-.75-2.33-1.82-3.07-3.2-.74-1.38-1.11-3-1.11-4.85s.37-3.46,1.11-4.85Z"/>
      <path className="cls-2" d="M188.82,16.64v11.06c0,1.09.21,1.84.62,2.25.41.41,1.14.62,2.19.62h2.09v1.96h-2.45c-1.61,0-2.81-.38-3.59-1.13s-1.17-1.98-1.17-3.7v-11.06h-2.48v-1.92h2.48v-4.47h2.32v4.47h4.89v1.92h-4.89Z"/>
      <path className="cls-2" d="M198.12,31.66c-1.34-.75-2.39-1.82-3.17-3.2-.77-1.38-1.16-3-1.16-4.85s.39-3.46,1.17-4.85c.78-1.38,1.85-2.45,3.2-3.2s2.86-1.13,4.54-1.13,3.19.38,4.55,1.13,2.43,1.82,3.2,3.2c.77,1.38,1.16,3,1.16,4.85s-.39,3.44-1.17,4.83-1.86,2.46-3.23,3.21c-1.37.75-2.89,1.13-4.57,1.13s-3.18-.38-4.52-1.13ZM205.9,30c1-.53,1.81-1.34,2.43-2.41s.93-2.4.93-3.96-.3-2.89-.91-3.96c-.61-1.08-1.42-1.88-2.42-2.41-1-.53-2.09-.8-3.26-.8s-2.26.27-3.26.8c-1,.53-1.8,1.34-2.4,2.41-.6,1.08-.9,2.4-.9,3.96s.3,2.89.9,3.96c.6,1.08,1.39,1.88,2.38,2.41.99.53,2.07.8,3.25.8s2.26-.27,3.26-.8Z"/>
      <path className="cls-2" d="M218.18,15.3c1.03-.61,2.3-.91,3.8-.91v2.38h-.62c-1.65,0-2.98.45-3.98,1.34-1,.89-1.5,2.38-1.5,4.47v9.95h-2.28V14.71h2.28v3.17c.5-1.11,1.27-1.97,2.3-2.58Z"/>
      <path className="cls-2" d="M240.38,14.71l-10.57,26.2h-2.38l3.46-8.48-7.31-17.72h2.51l6.07,15.21,5.87-15.21h2.35Z"/>
    </g>
    <rect className="cls-1" x="41.65" y="17.28" width="5.23" height="5.23"/>
    <rect className="cls-1" x="32.84" y="16.01" width="2.19" height="2.19"/>
    <rect className="cls-1" x="25.83" y="20.43" width="3.61" height="3.61"/>
    <rect className="cls-1" x="47.25" y="10.85" width="2.19" height="2.19"/>
    <rect className="cls-1" x="50.34" y="32.17" width="2.19" height="2.19"/>
    <rect className="cls-1" x="59.84" y="22.23" width="2.19" height="2.19"/>
    <rect className="cls-1" x="55.59" y="34.2" width="3.61" height="3.61"/>
    <rect className="cls-1" x="45.45" y="2.29" width="3.61" height="3.61"/>
    <rect className="cls-1" x="50.34" y="24.24" width="4.44" height="4.44"/>
    <rect className="cls-1" x="56.49" y="5.9" width="4.44" height="4.44"/>
    <rect className="cls-1" x="52.93" y="16.34" width="2.66" height="2.66"/>
  </svg>
);

export default function AppFactory() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('all');
  const [installDialog, setInstallDialog] = useState(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchApps();
  }, [category, filter]);

  const fetchApps = async () => {
    try {
      let url = `${API}/apps/available`;
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (filter === 'trending') params.append('trending', 'true');
      if (filter === 'new') params.append('new', 'true');
      
      const response = await axios.get(`${url}${params.toString() ? '?' + params.toString() : ''}`);
      setApps(response.data);
    } catch (error) {
      toast.error('Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (app) => {
    setInstalling(true);
    try {
      await axios.post(`${API}/apps/install/${app.id}`);
      toast.success(`${app.name} installed successfully!`);
      setInstallDialog(null);
      fetchApps();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Installation failed');
    } finally {
      setInstalling(false);
    }
  };

  const getAppIcon = (iconName) => {
    const icons = {
      database: <HardDrive className="w-6 h-6" />,
      video: <Activity className="w-6 h-6" />,
      link: <Globe className="w-6 h-6" />,
      image: <Image className="w-6 h-6" />,
      shield: <Shield className="w-6 h-6" />,
      cpu: <Cpu className="w-6 h-6" />,
      globe: <Globe className="w-6 h-6" />,
      gamepad: <Gamepad2 className="w-6 h-6" />
    };
    return icons[iconName] || <Package className="w-6 h-6" />;
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['all', 'Storage', 'Media', 'DeFi', 'NFT', 'Communication', 'AI', 'Infrastructure', 'Gaming'];

  return (
    <div className="space-y-6">
      {/* Header with Logo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AppFactoryLogo />
        </div>
        <p className="text-slate-400 lg:text-right">Discover and install revenue-generating apps for your node</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 border-white/10 text-white"
            data-testid="app-search"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-40 bg-black/40 border-white/10" data-testid="category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            {categories.map(cat => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-black/40 border-white/10" data-testid="status-filter">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            <SelectItem value="all">All Apps</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredApps.map((app) => (
            <motion.div
              key={app.id}
              variants={item}
              className="glass-card glass-card-hover p-6"
              data-testid={`app-card-${app.id}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center">
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{app.name}</h3>
                      {app.is_trending && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" /> Hot
                        </Badge>
                      )}
                      {app.is_new && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" /> New
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 mt-1">
                      {app.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">${app.subscription_price}</p>
                  <p className="text-xs text-slate-500">/user/month</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{app.description}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Server className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-lg font-bold text-white">{app.active_nodes.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Active Nodes</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-lg font-bold text-white">{(app.subscribers / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-slate-500">Subscribers</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold text-emerald-400">${app.revenue_per_node}</p>
                  <p className="text-xs text-slate-500">Avg/Node</p>
                </div>
              </div>

              {/* Hosting Slots */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Layers className="w-4 h-4" /> Hosting Slots
                  </span>
                  <span className="text-white">
                    <span className="text-emerald-400">{app.available_slots}</span> / {app.total_slots} available
                  </span>
                </div>
                <Progress 
                  value={((app.total_slots - app.available_slots) / app.total_slots) * 100} 
                  className="h-2"
                />
              </div>

              {/* Revenue Share & Capacity */}
              <div className="flex items-center justify-between text-sm mb-4 py-3 px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div>
                  <span className="text-slate-400">Revenue Share:</span>
                  <span className="text-emerald-400 font-bold ml-2">{app.revenue_share}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Capacity:</span>
                  <span className="text-white font-semibold ml-2">{app.capacity_required} GB</span>
                </div>
              </div>

              {/* Install Button */}
              <Button
                className="w-full bg-[#4865af] hover:bg-[#5a7ac4] text-white font-semibold rounded-full"
                onClick={() => setInstallDialog(app)}
                disabled={app.available_slots === 0}
                data-testid={`install-btn-${app.id}`}
              >
                {app.available_slots === 0 ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Waitlist
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {filteredApps.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No apps found matching your criteria</p>
        </div>
      )}

      {/* Install Dialog */}
      <Dialog open={!!installDialog} onOpenChange={() => setInstallDialog(null)}>
        <DialogContent className="glass-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl">Install {installDialog?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the app details before installing on your node
            </DialogDescription>
          </DialogHeader>
          
          {installDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center">
                  {getAppIcon(installDialog.icon)}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{installDialog.name}</h3>
                  <p className="text-sm text-slate-400">{installDialog.category}</p>
                </div>
              </div>

              <p className="text-slate-300">{installDialog.description}</p>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subscription Price</span>
                  <span className="text-white font-semibold">${installDialog.subscription_price}/user/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Your Revenue Share</span>
                  <span className="text-emerald-400 font-semibold">{installDialog.revenue_share}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Monthly Revenue</span>
                  <span className="text-emerald-400 font-bold">${installDialog.revenue_per_node}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity Required</span>
                  <span className="text-white font-semibold">{installDialog.capacity_required} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Subscribers</span>
                  <span className="text-white font-semibold">{installDialog.subscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Slots</span>
                  <span className="text-emerald-400 font-semibold">{installDialog.available_slots} / {installDialog.total_slots}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setInstallDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4865af] hover:bg-[#5a7ac4] text-white font-semibold rounded-full"
              onClick={() => handleInstall(installDialog)}
              disabled={installing}
              data-testid="confirm-install-btn"
            >
              {installing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Confirm Install
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
