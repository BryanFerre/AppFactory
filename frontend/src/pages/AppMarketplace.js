import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, Download, Users, Server, Layers, DollarSign,
  Package, Activity, Cpu, Globe, Gamepad2, Shield, Image, HardDrive,
  Sparkles, Clock, Star, SlidersHorizontal, ArrowUpDown, X, Check,
  GitCompare, ChevronDown, Filter, BarChart3, CreditCard, Zap, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Calculate resource upgrade cost based on capacity
const calculateResourceCost = (capacityRequired) => {
  // Base pricing tiers - larger apps cost more
  const basePricePerGB = 4.99;
  const tierMultiplier = capacityRequired <= 2 ? 1 : 
                         capacityRequired <= 4 ? 1.25 : 
                         capacityRequired <= 6 ? 1.5 : 
                         capacityRequired <= 8 ? 1.75 : 2;
  
  const monthlyCost = Math.round(capacityRequired * basePricePerGB * tierMultiplier * 100) / 100;
  
  return {
    monthlyCost,
    tier: capacityRequired <= 2 ? 'Basic' : 
          capacityRequired <= 4 ? 'Standard' : 
          capacityRequired <= 6 ? 'Professional' : 
          capacityRequired <= 8 ? 'Enterprise' : 'Premium',
    tierColor: capacityRequired <= 2 ? 'text-slate-400' : 
               capacityRequired <= 4 ? 'text-blue-400' : 
               capacityRequired <= 6 ? 'text-purple-400' : 
               capacityRequired <= 8 ? 'text-amber-400' : 'text-rose-400'
  };
};

export default function AppMarketplace() {
  const [apps, setApps] = useState([]);
  const [featuredApps, setFeaturedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minRevenue, setMinRevenue] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [installDialog, setInstallDialog] = useState(null);
  const [installing, setInstalling] = useState(false);
  
  // Comparison feature
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareData, setCompareData] = useState([]);

  const fetchApps = useCallback(async () => {
    try {
      let url = `${API}/apps/available`;
      const params = new URLSearchParams();
      
      if (category !== 'all') params.append('category', category);
      if (filter === 'trending') params.append('trending', 'true');
      if (filter === 'new') params.append('new', 'true');
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);
      if (minRevenue > 0) params.append('min_revenue', minRevenue.toString());
      if (maxCapacity < 10) params.append('max_capacity', maxCapacity.toString());
      
      const response = await axios.get(`${url}${params.toString() ? '?' + params.toString() : ''}`);
      setApps(response.data);
    } catch (error) {
      toast.error('Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  }, [category, filter, sortBy, sortOrder, minRevenue, maxCapacity]);

  useEffect(() => {
    fetchApps();
    fetchFeaturedApps();
  }, [fetchApps]);

  const fetchFeaturedApps = async () => {
    try {
      const response = await axios.get(`${API}/apps/featured`);
      setFeaturedApps(response.data);
    } catch (error) {
      console.error('Failed to fetch featured apps');
    }
  };

  const handleFeaturedAppClick = (featuredApp) => {
    const appForDialog = {
      id: featuredApp.id,
      name: featuredApp.name,
      description: featuredApp.description,
      category: featuredApp.category,
      icon: 'cpu',
      subscription_price: featuredApp.subscription_price,
      revenue_share: featuredApp.revenue_share,
      capacity_required: featuredApp.capacity_required,
      revenue_per_node: (featuredApp.subscription_price * featuredApp.revenue_share / 100 * 30).toFixed(2),
      active_nodes: Math.floor(Math.random() * 2000) + 500,
      subscribers: Math.floor(Math.random() * 30000) + 10000,
      total_slots: 3000,
      available_slots: Math.floor(Math.random() * 1500) + 500,
      is_featured: true
    };
    setInstallDialog(appForDialog);
  };

  const handleInstall = async (app) => {
    setInstalling(true);
    try {
      await axios.post(`${API}/apps/install/${app.id}`);
      const resourceCost = calculateResourceCost(app.capacity_required);
      toast.success(
        <div>
          <p className="font-semibold">{app.name} installed successfully!</p>
          <p className="text-sm text-slate-400">Resource fee of ${resourceCost.monthlyCost}/mo will be billed to your card.</p>
        </div>
      );
      setInstallDialog(null);
      fetchApps();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Installation failed'));
    } finally {
      setInstalling(false);
    }
  };

  // Comparison handlers
  const toggleCompareSelection = (app) => {
    if (selectedForCompare.find(a => a.id === app.id)) {
      setSelectedForCompare(prev => prev.filter(a => a.id !== app.id));
    } else {
      if (selectedForCompare.length >= 3) {
        toast.error('Maximum 3 apps can be compared');
        return;
      }
      setSelectedForCompare(prev => [...prev, app]);
    }
  };

  const handleCompare = async () => {
    if (selectedForCompare.length < 2) {
      toast.error('Select at least 2 apps to compare');
      return;
    }
    
    try {
      const ids = selectedForCompare.map(a => a.id).join(',');
      const response = await axios.get(`${API}/apps/compare?app_ids=${ids}`);
      setCompareData(response.data);
      setShowCompareDialog(true);
    } catch (error) {
      toast.error('Failed to load comparison data');
    }
  };

  const clearComparison = () => {
    setSelectedForCompare([]);
    setCompareMode(false);
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

  const categories = ['all', 'Productivity', 'Communication', 'Wellness'];
  
  const sortOptions = [
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'subscribers', label: 'Subscribers', icon: Users },
    { value: 'price', label: 'Price', icon: BarChart3 },
    { value: 'popularity', label: 'Popularity', icon: TrendingUp },
    { value: 'capacity', label: 'Capacity', icon: Server }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">App Marketplace</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">Discover and install revenue-generating apps</p>
        </div>
        
        {/* Compare Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {compareMode && selectedForCompare.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Badge className="bg-cyan-500/20 text-cyan-400 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                {selectedForCompare.length} selected
              </Badge>
              <Button
                size="sm"
                onClick={handleCompare}
                className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs sm:text-sm"
                disabled={selectedForCompare.length < 2}
                data-testid="compare-apps-btn"
              >
                <GitCompare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Compare
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearComparison}
                className="text-slate-400 hover:text-white p-1 sm:p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
          <Button
            size="sm"
            variant={compareMode ? "default" : "outline"}
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) clearComparison();
            }}
            className={`text-xs sm:text-sm ${compareMode 
              ? "bg-cyan-500 hover:bg-cyan-600 text-white" 
              : "border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
            data-testid="toggle-compare-mode"
          >
            <GitCompare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {compareMode ? 'Exit' : 'Compare'}
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 bg-black/40 border-white/10 text-white text-sm"
            data-testid="app-search"
          />
        </div>
        
        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {/* Category Filter */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-black/40 border-white/10 text-xs sm:text-sm" data-testid="category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize text-xs sm:text-sm">
                  {cat === 'all' ? 'All' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-black/40 border-white/10 text-xs sm:text-sm" data-testid="status-filter">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="all" className="text-xs sm:text-sm">All Apps</SelectItem>
              <SelectItem value="trending" className="text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" /> Trending
                </span>
              </SelectItem>
              <SelectItem value="new" className="text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" /> New
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs sm:text-sm" data-testid="sort-dropdown">
                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sort: </span>{sortOptions.find(s => s.value === sortBy)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-card border-white/10 w-48">
              <DropdownMenuLabel className="text-slate-400 text-xs">Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {sortOptions.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`flex items-center gap-2 text-xs sm:text-sm ${sortBy === option.value ? 'text-cyan-400' : 'text-slate-300'}`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                  {sortBy === option.value && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel className="text-slate-400 text-xs">Order</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setSortOrder('desc')}
                className={`text-xs sm:text-sm ${sortOrder === 'desc' ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                High to Low {sortOrder === 'desc' && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOrder('asc')}
                className={`text-xs sm:text-sm ${sortOrder === 'asc' ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                Low to High {sortOrder === 'asc' && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Advanced Filters Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs sm:text-sm" data-testid="advanced-filters-btn">
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Filters</span>
                {(minRevenue > 0 || maxCapacity < 10) && (
                  <Badge className="ml-1 sm:ml-2 bg-cyan-500/20 text-cyan-400 text-[10px] sm:text-xs">Active</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="glass-card border-l-white/10 w-[85vw] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-white font-['Outfit']">Advanced Filters</SheetTitle>
                <SheetDescription className="text-slate-400 text-sm">
                  Fine-tune your app search
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Min Revenue Filter */}
                <div className="space-y-3">
                  <label className="text-sm text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Minimum Revenue
                    </span>
                    <span className="text-emerald-400 font-semibold">${minRevenue}/mo</span>
                  </label>
                  <Slider
                    value={[minRevenue]}
                    onValueChange={(v) => setMinRevenue(v[0])}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>$0</span>
                    <span>$200+</span>
                  </div>
                </div>
                
                {/* Max Capacity Filter */}
                <div className="space-y-3">
                  <label className="text-sm text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      Maximum Capacity
                    </span>
                    <span className="text-blue-400 font-semibold">{maxCapacity} GB</span>
                  </label>
                  <Slider
                    value={[maxCapacity]}
                    onValueChange={(v) => setMaxCapacity(v[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1 GB</span>
                  <span>10 GB</span>
                </div>
              </div>
              
              {/* Reset Filters */}
              <Button
                variant="outline"
                className="w-full border-white/10 text-slate-300"
                onClick={() => {
                  setMinRevenue(0);
                  setMaxCapacity(10);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {(minRevenue > 0 || maxCapacity < 10 || filter !== 'all' || category !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">Active filters:</span>
          {category !== 'all' && (
            <Badge 
              className="bg-white/10 text-slate-300 cursor-pointer hover:bg-white/20"
              onClick={() => setCategory('all')}
            >
              {category} <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filter !== 'all' && (
            <Badge 
              className="bg-white/10 text-slate-300 cursor-pointer hover:bg-white/20"
              onClick={() => setFilter('all')}
            >
              {filter} <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {minRevenue > 0 && (
            <Badge 
              className="bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30"
              onClick={() => setMinRevenue(0)}
            >
              Min ${minRevenue}/mo <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {maxCapacity < 10 && (
            <Badge 
              className="bg-blue-500/20 text-blue-400 cursor-pointer hover:bg-blue-500/30"
              onClick={() => setMaxCapacity(10)}
            >
              Max {maxCapacity} GB <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Featured Apps Section */}
      {featuredApps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Featured Apps</h2>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {featuredApps.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleFeaturedAppClick(app)}
                  className="flex-shrink-0 w-64 glass-card p-4 border border-amber-500/40 relative overflow-hidden hover:border-amber-500/60 hover:bg-amber-500/5 transition-all cursor-pointer group"
                  data-testid={`featured-app-${app.id}`}
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    FEATURED
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Package className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{app.name}</h3>
                      <p className="text-xs text-amber-400/80">{app.category}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 h-8">{app.description}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-500/20">
                    <span className="text-emerald-400 font-semibold text-sm">${app.subscription_price}/mo</span>
                    <span className="text-slate-500 text-xs">{app.revenue_share}% share</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      View Details
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#0a0f1c] to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing <span className="text-white font-semibold">{filteredApps.length}</span> apps
        </p>
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
              className={`glass-card glass-card-hover p-6 relative ${
                compareMode && selectedForCompare.find(a => a.id === app.id)
                  ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0a0f1c]'
                  : ''
              }`}
              data-testid={`app-card-${app.id}`}
            >
              {/* Compare Checkbox */}
              {compareMode && (
                <div 
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompareSelection(app);
                  }}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                    selectedForCompare.find(a => a.id === app.id)
                      ? 'bg-cyan-500 border-cyan-500'
                      : 'border-white/30 hover:border-cyan-400'
                  }`}>
                    {selectedForCompare.find(a => a.id === app.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center">
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
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
          <Button
            variant="link"
            className="text-cyan-400 mt-2"
            onClick={() => {
              setCategory('all');
              setFilter('all');
              setMinRevenue(0);
              setMaxCapacity(10);
              setSearchQuery('');
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Install Dialog with Resource Billing */}
      <Dialog open={!!installDialog} onOpenChange={() => setInstallDialog(null)}>
        <DialogContent className="glass-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              Install {installDialog?.name}
              {installDialog?.is_featured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs">
                  <Star className="w-3 h-3 mr-1 fill-current" /> FEATURED
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the app details and resource costs before installing
            </DialogDescription>
          </DialogHeader>
          
          {installDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  installDialog.is_featured 
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/50' 
                    : 'bg-gradient-to-br from-[#4865af] to-[#6b8dd6]'
                }`}>
                  {getAppIcon(installDialog.icon)}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{installDialog.name}</h3>
                  <p className="text-sm text-slate-400">{installDialog.category}</p>
                </div>
              </div>

              <p className="text-slate-300">{installDialog.description}</p>

              {/* App Details */}
              <div className={`rounded-xl p-4 space-y-3 ${
                installDialog.is_featured 
                  ? 'bg-amber-500/10 border border-amber-500/20' 
                  : 'bg-white/5'
              }`}>
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
                  <span className="text-slate-400">Current Subscribers</span>
                  <span className="text-white font-semibold">{installDialog.subscribers?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Slots</span>
                  <span className="text-emerald-400 font-semibold">{installDialog.available_slots || 'N/A'} / {installDialog.total_slots || 'N/A'}</span>
                </div>
              </div>

              {/* Resource Upgrade Billing Section */}
              {(() => {
                const resourceCost = calculateResourceCost(installDialog.capacity_required);
                return (
                  <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold text-white">Resource Upgrade Required</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Capacity Required</span>
                        <span className="text-white font-semibold">{installDialog.capacity_required} GB</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Resource Tier</span>
                        <Badge className={`${resourceCost.tierColor} bg-white/10`}>
                          {resourceCost.tier}
                        </Badge>
                      </div>
                      
                      <div className="h-px bg-white/10" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          Monthly Resource Fee
                        </span>
                        <span className="text-xl font-bold text-blue-400">${resourceCost.monthlyCost}/mo</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-400">
                        This fee will be automatically billed to your card on file monthly. 
                        You can cancel anytime by uninstalling the app.
                      </p>
                    </div>
                    
                    {/* Net Revenue Calculation */}
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Estimated Net Revenue</span>
                        <span className="text-emerald-400 font-bold">
                          ${(parseFloat(installDialog.revenue_per_node) - resourceCost.monthlyCost).toFixed(2)}/mo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Revenue (${installDialog.revenue_per_node}) - Resource Fee (${resourceCost.monthlyCost})
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setInstallDialog(null)} className="sm:flex-1">
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#4865af] to-[#6b8dd6] hover:from-[#5a7ac4] hover:to-[#7c9ee0] text-white font-semibold rounded-full sm:flex-1"
              onClick={() => handleInstall(installDialog)}
              disabled={installing}
              data-testid="confirm-install-btn"
            >
              {installing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Install & Subscribe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="glass-card border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-400" />
              App Comparison
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Compare selected apps side by side
            </DialogDescription>
          </DialogHeader>
          
          {compareData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left text-slate-400 font-medium p-3 border-b border-white/10">Feature</th>
                    {compareData.map(app => (
                      <th key={app.id} className="text-center p-3 border-b border-white/10">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center">
                            {getAppIcon(app.icon)}
                          </div>
                          <span className="text-white font-semibold">{app.name}</span>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {app.category}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Price</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-emerald-400 font-bold text-lg">${app.subscription_price}</span>
                        <span className="text-slate-500 text-xs block">/user/month</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Revenue Share</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-emerald-400 font-bold">{app.revenue_share}%</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Est. Revenue/Node</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-emerald-400 font-bold">${app.revenue_per_node || '-'}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Resource Fee</td>
                    {compareData.map(app => {
                      const cost = calculateResourceCost(app.capacity_required);
                      return (
                        <td key={app.id} className="text-center p-3 border-b border-white/10">
                          <span className="text-blue-400 font-bold">${cost.monthlyCost}/mo</span>
                          <span className={`text-xs block ${cost.tierColor}`}>{cost.tier}</span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Net Revenue</td>
                    {compareData.map(app => {
                      const cost = calculateResourceCost(app.capacity_required);
                      const net = (parseFloat(app.revenue_per_node) - cost.monthlyCost).toFixed(2);
                      return (
                        <td key={app.id} className="text-center p-3 border-b border-white/10">
                          <span className={`font-bold ${parseFloat(net) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${net}/mo
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Capacity Required</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-white font-semibold">{app.capacity_required} GB</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Active Nodes</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-white font-semibold">{(app.active_nodes || 0).toLocaleString()}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Subscribers</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-white font-semibold">{((app.subscribers || 0) / 1000).toFixed(1)}K</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Available Slots</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <span className="text-emerald-400 font-semibold">{app.available_slots || '-'}</span>
                        <span className="text-slate-500 text-xs"> / {app.total_slots || '-'}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3 border-b border-white/10">Status</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3 border-b border-white/10">
                        <div className="flex flex-wrap justify-center gap-1">
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
                          {!app.is_trending && !app.is_new && (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-slate-400 p-3">Action</td>
                    {compareData.map(app => (
                      <td key={app.id} className="text-center p-3">
                        <Button
                          size="sm"
                          className="bg-[#4865af] hover:bg-[#5a7ac4] text-white rounded-full"
                          onClick={() => {
                            setShowCompareDialog(false);
                            setInstallDialog(app);
                          }}
                          disabled={app.is_installed}
                          data-testid={`compare-install-${app.id}`}
                        >
                          {app.is_installed ? 'Installed' : (
                            <>
                              <Download className="w-3 h-3 mr-1" /> Install
                            </>
                          )}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCompareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
