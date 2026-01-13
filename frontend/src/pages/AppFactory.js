import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Factory, Search, Filter, TrendingUp, Zap, Download,
  Star, Users, HardDrive, Package, Activity, Cpu, Globe, Gamepad2, Shield, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Factory className="w-8 h-8 text-cyan-400" />
            App Factory
          </h1>
          <p className="text-slate-400 mt-1">Discover and install revenue-generating apps</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredApps.map((app) => (
            <motion.div
              key={app.id}
              variants={item}
              className="glass-card glass-card-hover p-6"
              data-testid={`app-card-${app.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl icon-bg-purple flex items-center justify-center">
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{app.name}</h3>
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 mt-1">
                      {app.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {app.is_trending && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {app.is_new && (
                    <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                      New
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{app.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Revenue Share</p>
                  <p className="text-lg font-bold text-cyan-400">{app.revenue_share}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Est. Monthly</p>
                  <p className="text-lg font-bold text-white">{app.estimated_monthly_opt} <span className="text-sm text-slate-400">OPT</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{app.installs.toLocaleString()} installs</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  <span>{app.capacity_required} GB</span>
                </div>
              </div>

              <Button
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full"
                onClick={() => setInstallDialog(app)}
                data-testid={`install-btn-${app.id}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
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
        <DialogContent className="glass-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit']">Install {installDialog?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the app details before installing
            </DialogDescription>
          </DialogHeader>
          
          {installDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl icon-bg-purple flex items-center justify-center">
                  {getAppIcon(installDialog.icon)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{installDialog.name}</h3>
                  <p className="text-sm text-slate-400">{installDialog.category}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Revenue Share</span>
                  <span className="text-white font-semibold">{installDialog.revenue_share}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Monthly</span>
                  <span className="text-cyan-400 font-semibold">{installDialog.estimated_monthly_opt} OPT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity Required</span>
                  <span className="text-white font-semibold">{installDialog.capacity_required} GB</span>
                </div>
              </div>

              <p className="text-sm text-slate-400">{installDialog.description}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setInstallDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full"
              onClick={() => handleInstall(installDialog)}
              disabled={installing}
              data-testid="confirm-install-btn"
            >
              {installing ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
