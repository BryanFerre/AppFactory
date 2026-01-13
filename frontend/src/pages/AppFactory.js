import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Search, TrendingUp, Download, Users, Server, Layers, DollarSign,
  Package, Activity, Cpu, Globe, Gamepad2, Shield, Image, HardDrive,
  Sparkles, Clock, Star
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

export default function AppFactory() {
  const [apps, setApps] = useState([]);
  const [featuredApps, setFeaturedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('all');
  const [installDialog, setInstallDialog] = useState(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchApps();
    fetchFeaturedApps();
  }, [category, filter]);

  const fetchFeaturedApps = async () => {
    try {
      const response = await axios.get(`${API}/apps/featured`);
      setFeaturedApps(response.data);
    } catch (error) {
      console.error('Failed to fetch featured apps');
    }
  };

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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">App Factory</h1>
          <p className="text-slate-400 mt-1">Discover and install revenue-generating apps for your node</p>
        </div>
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

      {/* Featured Apps Section */}
      {featuredApps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Featured Apps</h2>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {featuredApps.map((app) => (
              <motion.div
                key={app.id}
                variants={item}
                className="glass-card p-4 border-2 border-amber-500/30 relative overflow-hidden"
                data-testid={`featured-app-${app.id}`}
              >
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                  FEATURED
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                    <Package className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{app.name}</h3>
                    <p className="text-xs text-slate-400">{app.category}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-3 line-clamp-2">{app.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-semibold">${app.subscription_price}/mo</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Layers className="w-3 h-3" />
                    <span>{app.revenue_share}% share</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

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
