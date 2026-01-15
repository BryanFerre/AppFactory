import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Award, Crown, Star, Users, TrendingUp,
  ChevronUp, ChevronDown, Minus, Filter, Search, Loader2,
  Flame, Zap, Target, ArrowUpRight, Calendar, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

// Tier configurations
const tierConfig = {
  Starter: { 
    gradient: 'from-slate-400 to-slate-600',
    bgColor: 'bg-slate-500/20',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30'
  },
  Builder: { 
    gradient: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  Contributor: { 
    gradient: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  Champion: { 
    gradient: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  Legend: { 
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
};

// Rank badge configurations
const rankConfig = {
  1: { 
    icon: Crown, 
    color: 'text-amber-400', 
    bgColor: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    label: '1st',
    glow: 'shadow-amber-500/50'
  },
  2: { 
    icon: Medal, 
    color: 'text-slate-300', 
    bgColor: 'bg-gradient-to-br from-slate-300 to-slate-400',
    label: '2nd',
    glow: 'shadow-slate-400/50'
  },
  3: { 
    icon: Award, 
    color: 'text-orange-400', 
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
    label: '3rd',
    glow: 'shadow-orange-500/50'
  },
};

// Category options
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'ecosystem', label: 'Ecosystem-Defining' },
  { value: 'growth', label: 'Growth & Distribution' },
  { value: 'revenue', label: 'Revenue & Monetization' },
  { value: 'builder', label: 'Builder & Developer' },
  { value: 'community', label: 'Community & Ambassador' },
  { value: 'engagement', label: 'Engagement & Consistency' },
  { value: 'milestones', label: 'Milestones & Achievements' },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('all-time');
  const [periodInfo, setPeriodInfo] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [category, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = `${API}/activity/leaderboard`;
      let params = '?limit=100';
      
      // Handle timeframe-based endpoints
      if (timeframe === 'weekly') {
        endpoint = `${API}/activity/leaderboard/weekly`;
        params = '?limit=100';
      } else if (timeframe === 'monthly') {
        endpoint = `${API}/activity/leaderboard/monthly`;
        params = '?limit=100';
      } else if (category !== 'all') {
        params = `?category=${category}&limit=100`;
      }
      
      const response = await axios.get(`${endpoint}${params}`, { headers });
      
      // Map response based on timeframe (different point field names)
      const leaderboardData = response.data.leaderboard.map(entry => ({
        ...entry,
        total_points: entry.total_points || entry.points_this_week || entry.points_this_month || 0
      }));
      
      setLeaderboard(leaderboardData);
      setPeriodInfo(response.data.period_start ? {
        period: response.data.period,
        start: response.data.period_start
      } : null);
      
      // Find current user's rank
      if (user) {
        const userEntry = leaderboardData.find(entry => entry.user_id === user.id);
        if (userEntry) {
          setUserRank(userEntry.rank);
        } else {
          // User not in top 100, fetch their summary
          const summaryRes = await axios.get(`${API}/activity/summary`, { headers });
          setUserRank({
            rank: '>100',
            total_points: summaryRes.data.total_points,
            tier: summaryRes.data.tier
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || '?';
  };

  const filteredLeaderboard = leaderboard.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return entry.name?.toLowerCase().includes(query) || 
           entry.email?.toLowerCase().includes(query);
  });

  // Get top 3 for podium
  const topThree = filteredLeaderboard.slice(0, 3);
  const restOfLeaderboard = filteredLeaderboard.slice(3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2 sm:gap-3">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">Compete with the community and climb the ranks</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-48 bg-white/5 border-white/10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
        <TabsList className="bg-white/5 p-1 w-full grid grid-cols-3 sm:w-auto sm:inline-flex">
          <TabsTrigger 
            value="all-time" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            All Time
          </TabsTrigger>
          <TabsTrigger 
            value="monthly"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            This Month
          </TabsTrigger>
          <TabsTrigger 
            value="weekly"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            This Week
          </TabsTrigger>
        </TabsList>
        
        {/* Period Info */}
        {periodInfo && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>
              {timeframe === 'weekly' ? 'Week' : 'Month'} started: {new Date(periodInfo.start).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
      </Tabs>

      {/* Category Filter - only show for all-time */}
      {timeframe === 'all-time' && (
        <div className="flex items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-56 bg-white/5 border-white/10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* User's Current Rank Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border border-cyan-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {getInitials(user.name, user.email)}
              </div>
              <div>
                <p className="text-white font-semibold">{user.name || 'You'}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-400">Your Rank</p>
                <p className="text-2xl font-bold text-cyan-400">
                  #{typeof userRank === 'object' ? userRank.rank : userRank || '-'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-slate-400">Total Points</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(
                    typeof userRank === 'object' 
                      ? userRank.total_points 
                      : leaderboard.find(e => e.user_id === user.id)?.total_points || 0
                  )}
                </p>
              </div>
              
              <Badge className={`${
                tierConfig[typeof userRank === 'object' ? userRank.tier : leaderboard.find(e => e.user_id === user.id)?.tier || 'Starter']?.bgColor
              } ${
                tierConfig[typeof userRank === 'object' ? userRank.tier : leaderboard.find(e => e.user_id === user.id)?.tier || 'Starter']?.textColor
              } border-0 text-sm px-3 py-1`}>
                {typeof userRank === 'object' ? userRank.tier : leaderboard.find(e => e.user_id === user.id)?.tier || 'Starter'}
              </Badge>
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium - Top 3 */}
      {topThree.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Top Performers
          </h2>
          
          <div className="flex items-end justify-center gap-4 pb-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className={`w-20 h-20 rounded-full ${rankConfig[2].bgColor} flex items-center justify-center text-slate-800 font-bold text-2xl shadow-lg ${rankConfig[2].glow}`}>
                  {getInitials(topThree[1]?.name, topThree[1]?.email)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold text-sm border-2 border-[#0a0f1a]">
                  2
                </div>
              </div>
              <p className="text-white font-medium text-center mt-2 max-w-24 truncate">
                {topThree[1]?.name || topThree[1]?.email?.split('@')[0]}
              </p>
              <p className="text-slate-400 text-sm">{formatNumber(topThree[1]?.total_points)} pts</p>
              <Badge className={`${tierConfig[topThree[1]?.tier]?.bgColor} ${tierConfig[topThree[1]?.tier]?.textColor} border-0 mt-1`}>
                {topThree[1]?.tier}
              </Badge>
              <div className="w-24 h-20 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-lg mt-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-white/80">2</span>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-8">
              <div className="relative mb-2">
                <div className={`w-24 h-24 rounded-full ${rankConfig[1].bgColor} flex items-center justify-center text-amber-900 font-bold text-3xl shadow-lg ${rankConfig[1].glow} ring-4 ring-amber-400/30`}>
                  {getInitials(topThree[0]?.name, topThree[0]?.email)}
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Crown className="w-8 h-8 text-amber-400 drop-shadow-lg" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-sm border-2 border-[#0a0f1a]">
                  1
                </div>
              </div>
              <p className="text-white font-semibold text-center mt-2 max-w-28 truncate">
                {topThree[0]?.name || topThree[0]?.email?.split('@')[0]}
              </p>
              <p className="text-amber-400 text-sm font-medium">{formatNumber(topThree[0]?.total_points)} pts</p>
              <Badge className={`${tierConfig[topThree[0]?.tier]?.bgColor} ${tierConfig[topThree[0]?.tier]?.textColor} border-0 mt-1`}>
                {topThree[0]?.tier}
              </Badge>
              <div className="w-28 h-28 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg mt-4 flex items-center justify-center">
                <span className="text-4xl font-bold text-white/80">1</span>
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className={`w-20 h-20 rounded-full ${rankConfig[3].bgColor} flex items-center justify-center text-orange-900 font-bold text-2xl shadow-lg ${rankConfig[3].glow}`}>
                  {getInitials(topThree[2]?.name, topThree[2]?.email)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-orange-900 font-bold text-sm border-2 border-[#0a0f1a]">
                  3
                </div>
              </div>
              <p className="text-white font-medium text-center mt-2 max-w-24 truncate">
                {topThree[2]?.name || topThree[2]?.email?.split('@')[0]}
              </p>
              <p className="text-slate-400 text-sm">{formatNumber(topThree[2]?.total_points)} pts</p>
              <Badge className={`${tierConfig[topThree[2]?.tier]?.bgColor} ${tierConfig[topThree[2]?.tier]?.textColor} border-0 mt-1`}>
                {topThree[2]?.tier}
              </Badge>
              <div className="w-24 h-16 bg-gradient-to-t from-orange-700 to-orange-600 rounded-t-lg mt-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-white/80">3</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Rankings
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0 ml-2">
              {filteredLeaderboard.length} users
            </Badge>
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-4 text-slate-400 font-medium w-20">Rank</th>
                <th className="text-left p-4 text-slate-400 font-medium">User</th>
                <th className="text-left p-4 text-slate-400 font-medium">Tier</th>
                <th className="text-right p-4 text-slate-400 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry, index) => {
                  const isCurrentUser = user && entry.user_id === user.id;
                  const rankInfo = rankConfig[entry.rank];
                  const tierInfo = tierConfig[entry.tier] || tierConfig.Starter;
                  
                  return (
                    <motion.tr
                      key={entry.user_id}
                      variants={item}
                      className={`border-b border-white/5 hover:bg-white/5 transition-all ${
                        isCurrentUser ? 'bg-cyan-500/10 border-cyan-500/30' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-4">
                        {entry.rank <= 3 ? (
                          <div className={`w-10 h-10 rounded-full ${rankInfo.bgColor} flex items-center justify-center shadow-md`}>
                            <span className="text-white font-bold">{entry.rank}</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-slate-400 font-medium">{entry.rank}</span>
                          </div>
                        )}
                      </td>
                      
                      {/* User */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            entry.rank <= 3 
                              ? 'bg-gradient-to-br ' + tierInfo.gradient
                              : 'bg-white/10'
                          }`}>
                            {getInitials(entry.name, entry.email)}
                          </div>
                          <div>
                            <p className={`font-medium ${isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>
                              {entry.name || 'Anonymous'}
                              {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                            </p>
                            <p className="text-sm text-slate-500">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Tier */}
                      <td className="p-4">
                        <Badge className={`${tierInfo.bgColor} ${tierInfo.textColor} border-0`}>
                          {entry.tier}
                        </Badge>
                      </td>
                      
                      {/* Points */}
                      <td className="p-4 text-right">
                        <span className={`text-lg font-bold ${
                          entry.rank === 1 ? 'text-amber-400' :
                          entry.rank === 2 ? 'text-slate-300' :
                          entry.rank === 3 ? 'text-orange-400' :
                          'text-white'
                        }`}>
                          {formatNumber(entry.total_points)}
                        </span>
                        <span className="text-slate-500 text-sm ml-1">pts</span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Top Score</p>
              <p className="text-xl font-bold text-white">
                {formatNumber(topThree[0]?.total_points || 0)} pts
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Participants</p>
              <p className="text-xl font-bold text-white">{leaderboard.length}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Average Points</p>
              <p className="text-xl font-bold text-white">
                {formatNumber(
                  leaderboard.length > 0 
                    ? Math.round(leaderboard.reduce((sum, e) => sum + e.total_points, 0) / leaderboard.length)
                    : 0
                )} pts
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
