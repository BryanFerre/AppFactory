import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, Download, Users, Server, Layers, DollarSign,
  Package, Activity, Cpu, Globe, Gamepad2, Shield, Image, HardDrive,
  Sparkles, Clock, Star, SlidersHorizontal, ArrowUpDown, X, Check,
  GitCompare, ChevronDown, Filter, BarChart3, CreditCard, Zap, AlertCircle,
  ChevronRight, ArrowLeft, Briefcase, Brain, Code, MessageCircle, Palette,
  GraduationCap, Heart, Play, Hexagon, Home, Wrench, MapPin, ShoppingCart,
  Users as UsersIcon, FlaskConical, Grid3X3
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

// Category icon mapping
const categoryIcons = {
  'productivity-work': Briefcase,
  'business-finance': DollarSign,
  'artificial-intelligence': Brain,
  'developer-tools': Code,
  'marketing-growth': TrendingUp,
  'communication': MessageCircle,
  'design-creativity': Palette,
  'education-learning': GraduationCap,
  'health-wellness': Heart,
  'lifestyle-personal': Sparkles,
  'entertainment-media': Play,
  'web3-blockchain': Hexagon,
  'security-privacy': Shield,
  'smart-home-iot': Home,
  'utilities': Wrench,
  'travel-local': MapPin,
  'sales-commerce': ShoppingCart,
  'community-social': UsersIcon,
  'experimental': FlaskConical
};

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Calculate resource upgrade cost based on capacity
const calculateResourceCost = (capacityRequired) => {
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

// Tag color mapping
const tagColors = {
  ai: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  web3: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'no-code': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'privacy-first': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'rewards-enabled': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'open-source': 'bg-green-500/20 text-green-400 border-green-500/30',
  enterprise: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'free-tier': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'mobile-first': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'api-available': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
};

export default function AppMarketplace() {
  // View state: 'home' | 'category' | 'search'
  const [view, setView] = useState('home');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [featuredCollections, setFeaturedCollections] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const [apps, setApps] = useState([]);
  const [featuredApps, setFeaturedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [minRevenue, setMinRevenue] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [installDialog, setInstallDialog] = useState(null);
  const [installing, setInstalling] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchFeaturedApps();
    fetchFeaturedCollections();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API}/categories/tags`);
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags');
    }
  };

  const fetchFeaturedCollections = async () => {
    try {
      const response = await axios.get(`${API}/categories/collections`);
      setFeaturedCollections(response.data);
    } catch (error) {
      console.error('Failed to fetch collections');
    }
  };

  const fetchFeaturedApps = async () => {
    try {
      const response = await axios.get(`${API}/apps/featured`);
      setFeaturedApps(response.data);
    } catch (error) {
      console.error('Failed to fetch featured apps');
    }
  };

  const fetchCategoryApps = async (categoryId, subcategoryId = null) => {
    setLoading(true);
    try {
      let url = `${API}/categories/${categoryId}/apps?sort_by=${sortBy}`;
      if (subcategoryId) url += `&subcategory_id=${subcategoryId}`;
      if (selectedTags.length > 0) url += `&tags=${selectedTags.join(',')}`;
      
      const response = await axios.get(url);
      setApps(response.data.apps || []);
    } catch (error) {
      toast.error('Failed to fetch apps');
    } finally {
      setLoading(false);
    }
  };

  const searchApps = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setView('search');
    try {
      let url = `${API}/categories/search/apps?q=${encodeURIComponent(query)}&sort_by=${sortBy}`;
      if (selectedTags.length > 0) url += `&tags=${selectedTags.join(',')}`;
      
      const response = await axios.get(url);
      setApps(response.data.apps || []);
    } catch (error) {
      toast.error('Failed to search apps');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setView('category');
    fetchCategoryApps(category.id);
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
    fetchCategoryApps(selectedCategory.id, subcategory.id);
  };

  const handleBackToHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setApps([]);
    setSearchQuery('');
  };

  const handleInstall = async (app) => {
    setInstalling(true);
    try {
      await axios.post(`${API}/apps/install/${app.id}`);
      const resourceCost = calculateResourceCost(app.capacity_required || app.resources_required || 3);
      toast.success(
        <div>
          <p className="font-semibold">{app.name || app.app_name} installed successfully!</p>
          <p className="text-sm text-slate-400">Resource fee of ${resourceCost.monthlyCost}/mo will be billed to your card.</p>
        </div>
      );
      setInstallDialog(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Installation failed'));
    } finally {
      setInstalling(false);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId) 
        : [...prev, tagId]
    );
  };

  const getAppIcon = (iconName) => {
    const icons = {
      database: HardDrive,
      video: Activity,
      link: Globe,
      image: Image,
      shield: Shield,
      cpu: Cpu,
      globe: Globe,
      gamepad: Gamepad2
    };
    const IconComponent = icons[iconName] || Package;
    return <IconComponent className="w-6 h-6" />;
  };

  // Home View - Category Tiles
  const renderHomeView = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          placeholder="Search apps, categories, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchApps(searchQuery)}
          className="pl-12 pr-4 py-6 bg-black/40 border-white/10 text-white text-base rounded-xl"
          data-testid="marketplace-search"
        />
        <Button
          onClick={() => searchApps(searchQuery)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4865af] hover:bg-[#5a7ac4] text-white rounded-lg"
          size="sm"
        >
          Search
        </Button>
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tags.map(tag => (
          <Badge
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`cursor-pointer transition-all border ${
              selectedTags.includes(tag.id)
                ? tagColors[tag.id] || 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
            data-testid={`tag-${tag.id}`}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* Featured Apps Carousel */}
      {featuredApps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-lg font-semibold text-white">Featured Apps</h2>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {featuredApps.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setInstallDialog({
                    ...app,
                    name: app.name || app.app_name,
                    capacity_required: app.capacity_required || app.resources_required || 3,
                    revenue_per_node: app.revenue_per_node || (app.subscription_price * app.revenue_share / 100 * 30).toFixed(2)
                  })}
                  className="flex-shrink-0 w-72 glass-card p-4 border border-amber-500/40 relative overflow-hidden hover:border-amber-500/60 hover:bg-amber-500/5 transition-all cursor-pointer group"
                  data-testid={`featured-app-${app.id}`}
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    FEATURED
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{app.name || app.app_name}</h3>
                      <p className="text-xs text-amber-400/80">{app.category}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 h-8">{app.description}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-500/20">
                    <span className="text-emerald-400 font-semibold text-sm">${app.subscription_price || app.monthly_subscription_fee}/mo</span>
                    <span className="text-slate-500 text-xs">{app.revenue_share || app.revenue_sharing}% share</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#0a0f1c] to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Browse by Category</h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
        >
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.id] || Package;
            const gradientColors = category.color || 'from-cyan-500 to-blue-500';
            
            return (
              <motion.div
                key={category.id}
                variants={item}
                onClick={() => handleCategoryClick(category)}
                className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-all group border border-white/5 hover:border-white/20"
                data-testid={`category-${category.id}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColors} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{category.name}</h3>
                <p className="text-xs text-slate-500">{category.app_count || 0} apps</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Featured Collections</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {featuredCollections.slice(0, 8).map((collection) => (
              <div
                key={collection.id}
                className="glass-card p-3 cursor-pointer hover:bg-white/5 transition-all border border-white/5 hover:border-white/20 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-lg bg-${collection.color}-500/20 flex items-center justify-center`}>
                  {collection.icon === 'trending-up' && <TrendingUp className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'sparkles' && <Sparkles className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'star' && <Star className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'palette' && <Palette className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'briefcase' && <Briefcase className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'brain' && <Brain className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'shield' && <Shield className={`w-5 h-5 text-${collection.color}-400`} />}
                  {collection.icon === 'hexagon' && <Hexagon className={`w-5 h-5 text-${collection.color}-400`} />}
                </div>
                <span className="text-white text-sm font-medium">{collection.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Category View - Subcategories + Apps
  const renderCategoryView = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="text-slate-400 hover:text-white p-2"
          data-testid="back-to-home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">{selectedCategory?.name}</h1>
          <p className="text-sm text-slate-400">{selectedCategory?.app_count || apps.length} apps available</p>
        </div>
      </div>

      {/* Subcategory Pills */}
      {selectedCategory?.subcategories?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            onClick={() => {
              setSelectedSubcategory(null);
              fetchCategoryApps(selectedCategory.id);
            }}
            className={`cursor-pointer transition-all ${
              !selectedSubcategory 
                ? 'bg-[#4865af] text-white' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            All
          </Badge>
          {selectedCategory.subcategories.map(sub => (
            <Badge
              key={sub.id}
              onClick={() => handleSubcategoryClick(sub)}
              className={`cursor-pointer transition-all ${
                selectedSubcategory?.id === sub.id 
                  ? 'bg-[#4865af] text-white' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              data-testid={`subcategory-${sub.id}`}
            >
              {sub.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Sort & Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 5).map(tag => (
            <Badge
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`cursor-pointer transition-all border text-xs ${
                selectedTags.includes(tag.id)
                  ? tagColors[tag.id] || 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No apps found in this category</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
        >
          {apps.map((app) => (
            <AppCard 
              key={app.id} 
              app={app} 
              onInstall={() => setInstallDialog(app)}
              getAppIcon={getAppIcon}
            />
          ))}
        </motion.div>
      )}
    </div>
  );

  // Search Results View
  const renderSearchView = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="text-slate-400 hover:text-white p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">Search Results</h1>
          <p className="text-sm text-slate-400">"{searchQuery}" - {apps.length} results</p>
        </div>
      </div>

      {/* Search Again */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchApps(searchQuery)}
          className="pl-12 bg-black/40 border-white/10 text-white"
        />
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No apps found for "{searchQuery}"</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
        >
          {apps.map((app) => (
            <AppCard 
              key={app.id} 
              app={app} 
              onInstall={() => setInstallDialog(app)}
              getAppIcon={getAppIcon}
            />
          ))}
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">App Marketplace</h1>
        <p className="text-sm sm:text-base text-slate-400">Discover and install revenue-generating apps</p>
      </div>

      {/* Main Content */}
      {view === 'home' && renderHomeView()}
      {view === 'category' && renderCategoryView()}
      {view === 'search' && renderSearchView()}

      {/* Install Dialog */}
      <InstallDialog 
        app={installDialog}
        open={!!installDialog}
        onClose={() => setInstallDialog(null)}
        onInstall={handleInstall}
        installing={installing}
        getAppIcon={getAppIcon}
      />
    </div>
  );
}

// App Card Component
function AppCard({ app, onInstall, getAppIcon }) {
  const appName = app.name || app.app_name;
  const subscriptionPrice = app.subscription_price || app.monthly_subscription_fee;
  const revenueShare = app.revenue_share || app.revenue_sharing;
  const capacityRequired = app.capacity_required || app.resources_required || 3;
  const revenuePerNode = app.revenue_per_node || (subscriptionPrice * revenueShare / 100 * 30).toFixed(2);
  
  return (
    <motion.div
      variants={item}
      className="glass-card glass-card-hover p-4 sm:p-6"
      data-testid={`app-card-${app.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center shrink-0">
            {getAppIcon(app.icon)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">{appName}</h3>
              {app.is_trending && (
                <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px] sm:text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" /> Hot
                </Badge>
              )}
              {app.is_new && (
                <Badge className="bg-purple-500/20 text-purple-400 text-[10px] sm:text-xs">
                  <Sparkles className="w-3 h-3 mr-1" /> New
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-xs border-slate-600 text-slate-400 mt-1">
              {app.category}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">${subscriptionPrice}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">/user/month</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 line-clamp-2">{app.description}</p>

      {/* Tags */}
      {app.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {app.tags.slice(0, 3).map(tag => (
            <Badge key={tag} className={`text-[10px] border ${tagColors[tag] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-sm sm:text-lg font-bold text-white">{(app.active_nodes || 0).toLocaleString()}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Active Nodes</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-sm sm:text-lg font-bold text-white">{((app.subscribers || 0) / 1000).toFixed(1)}K</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Subscribers</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-sm sm:text-lg font-bold text-emerald-400">${revenuePerNode}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Avg/Node</p>
        </div>
      </div>

      {/* Revenue Share & Capacity */}
      <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4 py-2 sm:py-3 px-3 sm:px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <div>
          <span className="text-slate-400">Revenue Share:</span>
          <span className="text-emerald-400 font-bold ml-2">{revenueShare}%</span>
        </div>
        <div>
          <span className="text-slate-400">Capacity:</span>
          <span className="text-white font-semibold ml-2">{capacityRequired} GB</span>
        </div>
      </div>

      {/* Install Button */}
      <Button
        className="w-full bg-[#4865af] hover:bg-[#5a7ac4] text-white font-semibold rounded-full text-sm"
        onClick={onInstall}
        data-testid={`install-btn-${app.id}`}
      >
        <Download className="w-4 h-4 mr-2" />
        Install App
      </Button>
    </motion.div>
  );
}

// Install Dialog Component
function InstallDialog({ app, open, onClose, onInstall, installing, getAppIcon }) {
  if (!app) return null;
  
  const appName = app.name || app.app_name;
  const subscriptionPrice = app.subscription_price || app.monthly_subscription_fee;
  const revenueShare = app.revenue_share || app.revenue_sharing;
  const capacityRequired = app.capacity_required || app.resources_required || 3;
  const revenuePerNode = app.revenue_per_node || (subscriptionPrice * revenueShare / 100 * 30).toFixed(2);
  const resourceCost = calculateResourceCost(capacityRequired);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
            Install {appName}
            {app.featured && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" /> FEATURED
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Review the app details and resource costs before installing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4865af] to-[#6b8dd6] flex items-center justify-center">
              {getAppIcon(app.icon)}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{appName}</h3>
              <p className="text-sm text-slate-400">{app.category}</p>
            </div>
          </div>

          <p className="text-slate-300">{app.description}</p>

          {/* App Details */}
          <div className="rounded-xl p-4 bg-white/5 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Subscription Price</span>
              <span className="text-white font-semibold">${subscriptionPrice}/user/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Your Revenue Share</span>
              <span className="text-emerald-400 font-semibold">{revenueShare}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Monthly Revenue</span>
              <span className="text-emerald-400 font-bold">${revenuePerNode}</span>
            </div>
          </div>

          {/* Resource Upgrade Billing Section */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-white">Resource Upgrade Required</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Capacity Required</span>
                <span className="text-white font-semibold">{capacityRequired} GB</span>
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
                  ${(parseFloat(revenuePerNode) - resourceCost.monthlyCost).toFixed(2)}/mo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Revenue (${revenuePerNode}) - Resource Fee (${resourceCost.monthlyCost})
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="sm:flex-1">
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-[#4865af] to-[#6b8dd6] hover:from-[#5a7ac4] hover:to-[#7c9ee0] text-white font-semibold rounded-full sm:flex-1"
            onClick={() => onInstall(app)}
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
  );
}
