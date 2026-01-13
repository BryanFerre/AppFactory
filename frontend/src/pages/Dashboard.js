import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, Package, Zap, Cpu, HardDrive, Wifi,
  Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles,
  DollarSign, Coins, Users, Copy, Twitter, Linkedin, Facebook,
  Share2, MessageSquare, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';

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

const platformIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook
};

const platformColors = {
  twitter: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  linkedin: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  facebook: 'text-blue-600 bg-blue-600/10 border-blue-600/30'
};

export default function Dashboard() {
  const [nodeStats, setNodeStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [installedApps, setInstalledApps] = useState([]);
  const [availableApps, setAvailableApps] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [nodeRes, earningsRes, installedRes, availableRes, capacityRes, recsRes] = await Promise.all([
        axios.get(`${API}/node/stats`),
        axios.get(`${API}/earnings`),
        axios.get(`${API}/apps/installed`),
        axios.get(`${API}/apps/available?trending=true`),
        axios.get(`${API}/capacity`),
        axios.get(`${API}/ai/recommendations`)
      ]);
      
      setNodeStats(nodeRes.data);
      setEarnings(earningsRes.data);
      setInstalledApps(installedRes.data);
      setAvailableApps(availableRes.data.slice(0, 3));
      setCapacity(capacityRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setRecsLoading(true);
    try {
      const response = await axios.get(`${API}/ai/recommendations`);
      setRecommendations(response.data);
      toast.success('Fresh promotional content generated!');
    } catch (error) {
      toast.error('Failed to refresh recommendations');
    } finally {
      setRecsLoading(false);
    }
  };

  const copyPost = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Post copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareOnPlatform = (platform, content, hashtags = []) => {
    const hashtagString = hashtags.map(t => `#${t}`).join(' ');
    const fullContent = `${content} ${hashtagString}`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullContent)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://napp.io')}&summary=${encodeURIComponent(content)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(fullContent)}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const verifyNode = async () => {
    try {
      await axios.post(`${API}/node/verify`);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to verify node');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getAppIcon = (iconName) => {
    const icons = {
      database: <HardDrive className="w-5 h-5" />,
      video: <Activity className="w-5 h-5" />,
      link: <Wifi className="w-5 h-5" />,
      image: <Package className="w-5 h-5" />,
      shield: <CheckCircle2 className="w-5 h-5" />,
      cpu: <Cpu className="w-5 h-5" />,
      globe: <Activity className="w-5 h-5" />,
      gamepad: <Zap className="w-5 h-5" />
    };
    return icons[iconName] || <Package className="w-5 h-5" />;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit']">Dashboard</h1>
          <p className="text-slate-400">Your node is earning for you</p>
        </div>
        <Button 
          onClick={verifyNode}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full"
          data-testid="verify-node-btn"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Daily Verification
        </Button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Node Health Widget - Spans 2 cols */}
        <motion.div variants={item} className="md:col-span-2 glass-card glass-card-hover p-6" data-testid="node-health-widget">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Node Health</h2>
            <Badge className={`${nodeStats?.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {nodeStats?.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Uptime</p>
              <p className="text-xl font-bold text-white">{nodeStats?.uptime_percent}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">CPU</p>
              <div className="flex items-center gap-2">
                <Progress value={nodeStats?.cpu_usage} className="h-2 flex-1" />
                <span className="text-sm text-slate-300">{nodeStats?.cpu_usage}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Memory</p>
              <div className="flex items-center gap-2">
                <Progress value={nodeStats?.memory_usage} className="h-2 flex-1" />
                <span className="text-sm text-slate-300">{nodeStats?.memory_usage}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Latency</p>
              <p className="text-xl font-bold text-cyan-400">{nodeStats?.latency_ms}ms</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Last heartbeat:</span>
              <span className="text-slate-300">{new Date(nodeStats?.last_heartbeat).toLocaleTimeString()}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-400">Reliability:</span>
              <span className="text-sm font-semibold text-emerald-400">{nodeStats?.reliability_score}%</span>
            </div>
          </div>
        </motion.div>

        {/* Today's USD Earnings */}
        <motion.div variants={item} className="glass-card glass-card-hover p-6" data-testid="today-usd-widget">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Today's Revenue</h2>
          </div>
          <p className="text-3xl font-bold text-emerald-400">${earnings?.today_usd?.toFixed(2)}</p>
          <p className="text-slate-400 text-sm">from app subscriptions</p>
        </motion.div>

        {/* Today's OPT Rewards */}
        <motion.div variants={item} className="glass-card glass-card-hover p-6" data-testid="today-opt-widget">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg icon-bg-cyan flex items-center justify-center">
              <Coins className="w-4 h-4 text-black" />
            </div>
            <h2 className="text-lg font-semibold text-white font-['Outfit']">OPT Rewards</h2>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{earnings?.today_opt_rewards?.toFixed(2)} <span className="text-lg">OPT</span></p>
          <p className="text-slate-400 text-sm">from referrals & signups</p>
        </motion.div>

        {/* Earnings Chart - Spans 2 cols */}
        <motion.div variants={item} className="md:col-span-2 glass-card glass-card-hover p-6" data-testid="earnings-chart-widget">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Revenue Trend (USD)</h2>
            <NavLink to="/earnings" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View Details <ArrowUpRight className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earnings?.daily_history || []}>
                <defs>
                  <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).getDate()}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F111A', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="usd" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorUsd)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div variants={item} className="glass-card glass-card-hover p-6" data-testid="month-summary-widget">
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">This Month</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Revenue</span>
              <span className="text-emerald-400 font-semibold">${earnings?.month_usd?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">OPT Rewards</span>
              <span className="text-cyan-400 font-semibold">{earnings?.month_opt_rewards?.toFixed(2)} OPT</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-slate-400">Total OPT Earned</span>
              <span className="text-purple-400 font-semibold">{earnings?.total_opt_rewards?.toFixed(2)} OPT</span>
            </div>
          </div>
        </motion.div>

        {/* Network Score */}
        <motion.div variants={item} className="glass-card glass-card-hover p-6" data-testid="network-score-widget">
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Network Score</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#1E2235" strokeWidth="8" fill="none" />
                <circle 
                  cx="40" cy="40" r="32" 
                  stroke="url(#scoreGradient)" 
                  strokeWidth="8" 
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(nodeStats?.reputation_score / 1000) * 201} 201`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{nodeStats?.reputation_score}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Reputation</p>
              <p className="text-xs text-slate-500">Top 15% of operators</p>
            </div>
          </div>
        </motion.div>

        {/* Installed Apps - Spans 2 cols */}
        <motion.div variants={item} className="md:col-span-2 glass-card glass-card-hover p-6" data-testid="installed-apps-widget">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Installed Apps</h2>
            <NavLink to="/installed-apps" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Manage <ArrowUpRight className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {installedApps.map((app) => (
              <div key={app.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${
                    app.health === 'healthy' ? 'icon-bg-cyan' : 'icon-bg-magenta'
                  } flex items-center justify-center`}>
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{app.name}</p>
                    <p className="text-xs text-slate-400">{app.subscribers_served?.toLocaleString()} subscribers</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Revenue</span>
                    <span className="font-semibold text-emerald-400">${app.revenue_usd?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Signups driven</span>
                    <span className="font-semibold text-cyan-400">{app.signups_driven} (+{app.opt_rewards_earned} OPT)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Recommendations - Spans 2 cols */}
        <motion.div variants={item} className="md:col-span-2 glass-card glass-card-hover p-6" data-testid="ai-recommendations-widget">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white font-['Outfit']">AI Recommendations</h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-cyan-400' : 
                  rec.priority === 'medium' ? 'bg-purple-400' : 'bg-slate-400'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-white">{rec.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                </div>
                {rec.action && (
                  <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                    {rec.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Promotion Overview */}
        <motion.div variants={item} className="md:col-span-2 glass-card glass-card-hover p-6" data-testid="promotion-widget">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Grow Your OPT Rewards</h2>
            <NavLink to="/promotion" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Promotion Tools <ArrowUpRight className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/20">
              <Users className="w-6 h-6 text-cyan-400 mb-2" />
              <p className="text-sm text-slate-400">Refer Node Operators</p>
              <p className="text-lg font-semibold text-white">Earn 50 OPT per signup</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20">
              <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-sm text-slate-400">Drive App Signups</p>
              <p className="text-lg font-semibold text-white">Earn 2 OPT per user</p>
            </div>
          </div>
        </motion.div>

        {/* Capacity Widget */}
        <motion.div variants={item} className="glass-card glass-card-hover p-6" data-testid="capacity-widget">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Capacity</h2>
            <span className="text-sm text-slate-400">{capacity?.used_capacity}/{capacity?.total_capacity} GB</span>
          </div>
          <Progress value={(capacity?.used_capacity / capacity?.total_capacity) * 100} className="h-3 mb-4" />
          <div className="space-y-2">
            {capacity?.app_usage.slice(0, 3).map((app, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{app.name}</span>
                <span className="text-slate-300">{app.capacity} GB</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
