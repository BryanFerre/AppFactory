import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Settings, Zap, Save, RotateCcw, Search, Filter, ChevronDown,
  CheckCircle2, XCircle, Edit2, Loader2, TrendingUp, Users,
  Activity, Award, Target, Gift, Clock, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Category icons
const categoryIcons = {
  ecosystem: Target,
  growth: TrendingUp,
  revenue: Zap,
  builder: Settings,
  operations: Activity,
  community: Users,
  feedback: Edit2,
  engagement: Clock,
  milestones: Award,
  longterm: Gift,
};

// Category colors
const categoryColors = {
  ecosystem: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  growth: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  revenue: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  builder: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  operations: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  community: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  feedback: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  engagement: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  milestones: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  longterm: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
};

const cooldownLabels = {
  none: 'No Cooldown',
  daily: 'Once per Day',
  weekly: 'Once per Week',
  monthly: 'Once per Month',
  once: 'One Time Only',
};

export default function AdminPointsConfig() {
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [actionsRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/activity/actions`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/activity/stats`, { headers: getAuthHeader() })
      ]);
      
      setActions(actionsRes.data.actions);
      setCategories(actionsRes.data.categories);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch points configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (actionId, currentValue) => {
    try {
      await axios.put(
        `${API}/admin/activity/actions/${actionId}`,
        { enabled: !currentValue },
        { headers: getAuthHeader() }
      );
      
      setActions(actions.map(a => 
        a.id === actionId ? { ...a, enabled: !currentValue } : a
      ));
      
      toast.success(`Action ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update action');
    }
  };

  const handleEditAction = (action) => {
    setEditForm({
      base_points: action.base_points,
      cooldown: action.cooldown,
      description: action.description,
      enabled: action.enabled
    });
    setEditDialog(action);
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    
    setSaving(true);
    try {
      await axios.put(
        `${API}/admin/activity/actions/${editDialog.id}`,
        editForm,
        { headers: getAuthHeader() }
      );
      
      setActions(actions.map(a => 
        a.id === editDialog.id ? { ...a, ...editForm } : a
      ));
      
      setEditDialog(null);
      toast.success('Action updated successfully');
    } catch (error) {
      toast.error('Failed to update action');
    } finally {
      setSaving(false);
    }
  };

  const filteredActions = actions.filter(action => {
    const matchesSearch = !searchQuery || 
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || action.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group actions by category
  const actionsByCategory = filteredActions.reduce((acc, action) => {
    const cat = action.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Zap className="w-7 h-7 text-amber-400" />
            Points Configuration
          </h1>
          <p className="text-slate-400 mt-1">Configure action rewards and point values</p>
        </div>
        
        <Button
          variant="outline"
          className="border-white/10 text-slate-300 hover:bg-white/10"
          onClick={fetchData}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Points Issued</p>
              <p className="text-xl font-bold text-white">
                {stats?.total_points_issued?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Users with Points</p>
              <p className="text-xl font-bold text-white">
                {stats?.total_users_with_points?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Events</p>
              <p className="text-xl font-bold text-white">
                {stats?.total_events?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Action Types</p>
              <p className="text-xl font-bold text-white">{actions.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tier Distribution */}
      {stats?.tier_distribution && Object.keys(stats.tier_distribution).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Tier Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {stats.tiers?.map(tier => {
              const count = stats.tier_distribution[tier.name] || 0;
              return (
                <div 
                  key={tier.name}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tier.badge_color }}
                  />
                  <span className="text-white font-medium">{tier.name}</span>
                  <Badge className="bg-white/10 text-white border-0">{count}</Badge>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categories).map(([key, name]) => (
              <SelectItem key={key} value={key}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions by Category */}
      <div className="space-y-6">
        {Object.entries(actionsByCategory).map(([category, categoryActions]) => {
          const colors = categoryColors[category] || categoryColors.ecosystem;
          const Icon = categoryIcons[category] || Target;
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className={`p-4 border-b border-white/10 ${colors.bg}`}>
                <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                  <Icon className="w-5 h-5" />
                  {categories[category] || category}
                  <Badge className="bg-white/20 text-white border-0 ml-2">
                    {categoryActions.length} actions
                  </Badge>
                </h3>
              </div>
              
              <div className="divide-y divide-white/5">
                {categoryActions.map((action) => (
                  <div 
                    key={action.id}
                    className="p-4 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-white">{action.name}</p>
                          {!action.enabled && (
                            <Badge className="bg-red-500/20 text-red-400 border-0">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 truncate">
                          {action.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-400">
                            ID: <code className="text-cyan-400">{action.id}</code>
                          </span>
                          <span className="text-xs text-slate-400">
                            Cooldown: {cooldownLabels[action.cooldown] || action.cooldown}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">
                            {action.base_points}
                          </p>
                          <p className="text-xs text-slate-500">points</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={action.enabled}
                            onCheckedChange={() => handleToggleEnabled(action.id, action.enabled)}
                          />
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleEditAction(action)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Action</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editDialog?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Base Points</label>
              <Input
                type="number"
                value={editForm.base_points}
                onChange={(e) => setEditForm({ ...editForm, base_points: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Cooldown</label>
              <Select 
                value={editForm.cooldown} 
                onValueChange={(value) => setEditForm({ ...editForm, cooldown: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="none">No Cooldown</SelectItem>
                  <SelectItem value="daily">Once per Day</SelectItem>
                  <SelectItem value="weekly">Once per Week</SelectItem>
                  <SelectItem value="monthly">Once per Month</SelectItem>
                  <SelectItem value="once">One Time Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Enabled</label>
              <Switch
                checked={editForm.enabled}
                onCheckedChange={(checked) => setEditForm({ ...editForm, enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditDialog(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
