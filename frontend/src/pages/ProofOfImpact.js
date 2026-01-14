import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Trophy, Star, Zap, TrendingUp, Target, Award, Clock,
  ChevronRight, Flame, Calendar, Activity, Gift, Crown,
  Medal, Sparkles, ArrowUpRight, Users, Code, DollarSign,
  MessageSquare, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Globe icon component (not available in lucide-react)
const GlobeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// Tier configurations with icons and gradients
const tierConfig = {
  Starter: { 
    icon: Star, 
    gradient: 'from-slate-400 to-slate-600',
    bgGlow: 'bg-slate-500/20',
    textColor: 'text-slate-400'
  },
  Builder: { 
    icon: Zap, 
    gradient: 'from-emerald-400 to-emerald-600',
    bgGlow: 'bg-emerald-500/20',
    textColor: 'text-emerald-400'
  },
  Contributor: { 
    icon: Award, 
    gradient: 'from-blue-400 to-blue-600',
    bgGlow: 'bg-blue-500/20',
    textColor: 'text-blue-400'
  },
  Champion: { 
    icon: Crown, 
    gradient: 'from-purple-400 to-purple-600',
    bgGlow: 'bg-purple-500/20',
    textColor: 'text-purple-400'
  },
  Legend: { 
    icon: Trophy, 
    gradient: 'from-amber-400 to-orange-500',
    bgGlow: 'bg-amber-500/20',
    textColor: 'text-amber-400'
  },
};

// Category icons and colors
const categoryConfig = {
  ecosystem: { icon: GlobeIcon, color: '#10B981', label: 'Ecosystem' },
  growth: { icon: TrendingUp, color: '#6366F1', label: 'Growth' },
  revenue: { icon: DollarSign, color: '#F59E0B', label: 'Revenue' },
  builder: { icon: Code, color: '#8B5CF6', label: 'Builder' },
  operations: { icon: Activity, color: '#06B6D4', label: 'Operations' },
  community: { icon: Users, color: '#EC4899', label: 'Community' },
  feedback: { icon: MessageSquare, color: '#14B8A6', label: 'Feedback' },
  engagement: { icon: Flame, color: '#EF4444', label: 'Engagement' },
  milestones: { icon: Target, color: '#F97316', label: 'Milestones' },
  longterm: { icon: Medal, color: '#A855F7', label: 'Long-Term' },
};

export default function ProofOfImpact() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, historyRes, streakRes] = await Promise.all([
        axios.get(`${API}/activity/summary`, { headers }),
        axios.get(`${API}/activity/history?limit=20`, { headers }),
        axios.get(`${API}/activity/streak`, { headers })
      ]);

      setSummary(summaryRes.data);
      setHistory(historyRes.data.history);
      setStreak(streakRes.data);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (category) => {
    const config = categoryConfig[category];
    if (config) {
      const Icon = config.icon;
      return <Icon className="w-4 h-4" style={{ color: config.color }} />;
    }
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const currentTier = summary?.tier || 'Starter';
  const TierIcon = tierConfig[currentTier]?.icon || Star;
  const tierGradient = tierConfig[currentTier]?.gradient || 'from-slate-400 to-slate-600';
  const tierBgGlow = tierConfig[currentTier]?.bgGlow || 'bg-slate-500/20';
  const tierTextColor = tierConfig[currentTier]?.textColor || 'text-slate-400';

  // Prepare chart data
  const categoryData = Object.entries(summary?.points_by_category || {}).map(([key, value]) => ({
    name: categoryConfig[key]?.label || key,
    value,
    color: categoryConfig[key]?.color || '#64748B'
  }));

  // Calculate tier progress
  const currentTierData = summary?.tiers?.find(t => t.name === currentTier);
  const nextTierData = summary?.next_tier ? summary.tiers?.find(t => t.name === summary.next_tier) : null;
  const tierProgress = nextTierData 
    ? ((summary.total_points - (currentTierData?.min_points || 0)) / 
       (nextTierData.min_points - (currentTierData?.min_points || 0))) * 100
    : 100;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            Proof of Impact
          </h1>
          <p className="text-slate-400 mt-1">Track your contributions and achievements</p>
        </div>
        
        <Button
          variant="outline"
          className="border-white/10 text-slate-300 hover:bg-white/10"
          onClick={fetchData}
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier & Points Card */}
        <motion.div
          variants={item}
          className="lg:col-span-2 glass-card p-6 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 ${tierBgGlow} rounded-full blur-3xl -mr-32 -mt-32 opacity-50`} />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Tier Badge */}
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${tierGradient} flex items-center justify-center shadow-lg shadow-${currentTier.toLowerCase()}-500/20`}>
              <TierIcon className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${tierBgGlow} ${tierTextColor} border-0 text-sm px-3 py-1`}>
                  {currentTier}
                </Badge>
                {summary?.next_tier && (
                  <span className="text-slate-500 text-sm flex items-center">
                    <ChevronRight className="w-4 h-4" />
                    {summary.next_tier}
                  </span>
                )}
              </div>
              
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-bold text-white font-['Outfit']">
                  {formatNumber(summary?.total_points || 0)}
                </span>
                <span className="text-slate-400 text-lg">points</span>
              </div>
              
              {summary?.next_tier && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Progress to {summary.next_tier}</span>
                    <span className={tierTextColor}>{formatNumber(summary.points_to_next_tier)} pts needed</span>
                  </div>
                  <Progress value={tierProgress} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          variants={item}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Login Streak
              </h3>
              {streak?.current_streak >= 7 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-0">
                  🔥 On Fire!
                </Badge>
              )}
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-white font-['Outfit']">
                {streak?.current_streak || 0}
              </span>
              <span className="text-slate-400">days</span>
            </div>
            
            <div className="text-sm text-slate-400 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                Best: {streak?.longest_streak || 0} days
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="milestones"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            Milestones
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <motion.div
              variants={item}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Points by Category
              </h3>
              
              {categoryData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1a1f2e', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [`${value} pts`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm text-slate-400">{cat.name}</span>
                        <span className="text-sm text-white ml-auto font-medium">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start earning points to see your breakdown</p>
                </div>
              )}
            </motion.div>

            {/* Tier Progress */}
            <motion.div
              variants={item}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Tier Progression
              </h3>
              
              <div className="space-y-4">
                {summary?.tiers?.map((tier, i) => {
                  const TIcon = tierConfig[tier.name]?.icon || Star;
                  const isCurrentTier = tier.name === currentTier;
                  const isAchieved = (summary?.total_points || 0) >= tier.min_points;
                  const progress = isAchieved ? 100 : 
                    i > 0 ? Math.min(100, ((summary?.total_points || 0) / tier.min_points) * 100) : 100;
                  
                  return (
                    <div key={tier.name} className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                      isCurrentTier ? 'bg-white/10 border border-white/10' : ''
                    }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isAchieved 
                          ? `bg-gradient-to-br ${tierConfig[tier.name]?.gradient}` 
                          : 'bg-white/5'
                      }`}>
                        <TIcon className={`w-5 h-5 ${isAchieved ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${isAchieved ? 'text-white' : 'text-slate-500'}`}>
                            {tier.name}
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatNumber(tier.min_points)} pts
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-1.5"
                        />
                      </div>
                      
                      {isAchieved && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Preview */}
          <motion.div
            variants={item}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Recent Activity
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300"
                onClick={() => setActiveTab('activity')}
              >
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {history.slice(0, 5).map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    {getCategoryIcon(entry.category)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{entry.action_name}</p>
                    <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    +{entry.points}
                  </Badge>
                </div>
              ))}
              
              {history.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity yet. Start exploring to earn points!</p>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          {/* Streak Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Login Streak Milestones
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {streak?.milestones?.map((milestone, i) => (
                <div 
                  key={milestone.action_id}
                  className={`p-4 rounded-xl border transition-all ${
                    milestone.achieved 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      milestone.achieved 
                        ? 'bg-emerald-500/20' 
                        : 'bg-white/10'
                    }`}>
                      {milestone.achieved ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Calendar className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <Badge className={`${
                      milestone.achieved 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    } border-0`}>
                      +{milestone.points}
                    </Badge>
                  </div>
                  
                  <h4 className={`font-semibold mb-1 ${
                    milestone.achieved ? 'text-white' : 'text-slate-400'
                  }`}>
                    {milestone.name}
                  </h4>
                  
                  <p className="text-sm text-slate-500 mb-3">
                    {milestone.days} consecutive days
                  </p>
                  
                  {!milestone.achieved && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-400">{Math.round(milestone.progress)}%</span>
                      </div>
                      <Progress value={milestone.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievement Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Achievement Categories
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summary?.categories || {}).map(([key, name]) => {
                const config = categoryConfig[key];
                const points = summary?.points_by_category?.[key] || 0;
                const Icon = config?.icon || Activity;
                
                return (
                  <div 
                    key={key}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config?.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config?.color }} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{name}</h4>
                        <p className="text-sm text-slate-500">{formatNumber(points)} pts</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={points > 0 ? Math.min(100, (points / 1000) * 100) : 0} 
                      className="h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Activity History
            </h3>
            
            <div className="space-y-3">
              {history.map((entry, i) => (
                <motion.div 
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${categoryConfig[entry.category]?.color}20` }}
                  >
                    {getCategoryIcon(entry.category)}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-white font-medium">{entry.action_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge 
                        className="text-xs border-0"
                        style={{ 
                          backgroundColor: `${categoryConfig[entry.category]?.color}20`,
                          color: categoryConfig[entry.category]?.color 
                        }}
                      >
                        {categoryConfig[entry.category]?.label || entry.category}
                      </Badge>
                      <span className="text-sm text-slate-500">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-lg font-bold">
                      +{entry.points}
                    </Badge>
                  </div>
                </motion.div>
              ))}
              
              {history.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No activity yet</p>
                  <p className="text-sm mt-2">Start using the platform to earn your first points!</p>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
