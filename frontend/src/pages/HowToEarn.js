import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Trophy, Star, Zap, TrendingUp, Target, Award, Clock,
  ChevronRight, Flame, Users, Code, DollarSign, Activity,
  MessageSquare, Gift, Crown, Medal, Sparkles, HelpCircle,
  CheckCircle2, Loader2, ArrowRight, Globe, Server, Share2,
  Rocket, Heart, Shield, BookOpen, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

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

// Tier configurations
const tierConfig = [
  { 
    name: 'Starter', 
    minPoints: 0, 
    icon: Star, 
    color: '#94A3B8',
    gradient: 'from-slate-400 to-slate-600',
    description: 'Begin your journey'
  },
  { 
    name: 'Builder', 
    minPoints: 1000, 
    icon: Zap, 
    color: '#22C55E',
    gradient: 'from-emerald-400 to-emerald-600',
    description: 'Active contributor'
  },
  { 
    name: 'Contributor', 
    minPoints: 5000, 
    icon: Award, 
    color: '#3B82F6',
    gradient: 'from-blue-400 to-blue-600',
    description: 'Valued community member'
  },
  { 
    name: 'Champion', 
    minPoints: 25000, 
    icon: Crown, 
    color: '#A855F7',
    gradient: 'from-purple-400 to-purple-600',
    description: 'Top performer'
  },
  { 
    name: 'Legend', 
    minPoints: 100000, 
    icon: Trophy, 
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-500',
    description: 'Elite status achieved'
  },
];

// Category configurations with icons
const categoryConfig = {
  ecosystem: { 
    icon: Globe, 
    color: '#10B981', 
    label: 'Ecosystem-Defining',
    description: 'High-impact actions that shape the platform',
    pointRange: '1,000 - 5,000 pts'
  },
  growth: { 
    icon: TrendingUp, 
    color: '#6366F1', 
    label: 'Growth & Distribution',
    description: 'Help expand the community',
    pointRange: '250 - 1,000 pts'
  },
  revenue: { 
    icon: DollarSign, 
    color: '#F59E0B', 
    label: 'Revenue & Monetization',
    description: 'Generate platform revenue',
    pointRange: '200 - 1,500 pts'
  },
  builder: { 
    icon: Code, 
    color: '#8B5CF6', 
    label: 'Builder & Developer',
    description: 'Create and improve apps',
    pointRange: '150 - 750 pts'
  },
  operations: { 
    icon: Server, 
    color: '#06B6D4', 
    label: 'Node Operations',
    description: 'Maintain and optimize nodes',
    pointRange: '100 - 600 pts'
  },
  community: { 
    icon: Users, 
    color: '#EC4899', 
    label: 'Community & Ambassador',
    description: 'Engage and grow the community',
    pointRange: '100 - 750 pts'
  },
  feedback: { 
    icon: MessageSquare, 
    color: '#14B8A6', 
    label: 'Feedback & Quality',
    description: 'Improve platform quality',
    pointRange: '75 - 250 pts'
  },
  engagement: { 
    icon: Flame, 
    color: '#EF4444', 
    label: 'Engagement & Consistency',
    description: 'Stay active and maintain streaks',
    pointRange: '25 - 300 pts'
  },
  milestones: { 
    icon: Target, 
    color: '#F97316', 
    label: 'Milestones & Achievements',
    description: 'Reach key milestones',
    pointRange: '300 - 2,000 pts'
  },
  longterm: { 
    icon: Medal, 
    color: '#A855F7', 
    label: 'Long-Term Impact',
    description: 'Sustained excellence',
    pointRange: '1,000 - 5,000 pts'
  },
};

// Quick start actions for new users
const quickStartActions = [
  { action: 'Complete Onboarding', points: 200, icon: CheckCircle2, color: '#22C55E' },
  { action: 'Daily Login', points: 25, icon: Flame, color: '#EF4444', note: 'Every day!' },
  { action: 'Install Your First App', points: 300, icon: Gift, color: '#F59E0B' },
  { action: 'Share a Referral Link', points: 100, icon: Share2, color: '#6366F1' },
  { action: 'Refer a Friend', points: 500, icon: Users, color: '#EC4899' },
];

export default function HowToEarn() {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [userSummary, setUserSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [actionsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/activity/actions`, { headers }),
        axios.get(`${API}/activity/summary`, { headers })
      ]);

      setActions(actionsRes.data.actions_by_category || {});
      setUserSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const currentTier = userSummary?.tier || 'Starter';
  const currentTierIndex = tierConfig.findIndex(t => t.name === currentTier);
  const nextTier = currentTierIndex < tierConfig.length - 1 ? tierConfig[currentTierIndex + 1] : null;

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
            <Lightbulb className="w-7 h-7 text-amber-400" />
            How to Earn OPT Points
          </h1>
          <p className="text-slate-400 mt-1">Learn how to maximize your rewards and climb the ranks</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/proof-of-impact')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
          >
            <Trophy className="w-4 h-4 mr-2" />
            View My Progress
          </Button>
        </div>
      </div>

      {/* Current Status Banner */}
      {userSummary && (
        <motion.div
          variants={item}
          className="glass-card p-6 border border-cyan-500/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tierConfig[currentTierIndex]?.gradient} flex items-center justify-center shadow-lg`}>
                {React.createElement(tierConfig[currentTierIndex]?.icon || Star, { className: "w-8 h-8 text-white" })}
              </div>
              <div>
                <p className="text-sm text-slate-400">Your Current Status</p>
                <h2 className="text-2xl font-bold text-white">{currentTier}</h2>
                <p className="text-cyan-400 font-semibold">{formatNumber(userSummary.total_points)} points</p>
              </div>
            </div>
            
            {nextTier && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">Next Tier</p>
                  <p className="text-lg font-semibold text-white">{nextTier.name}</p>
                  <p className="text-sm text-slate-500">{formatNumber(userSummary.points_to_next_tier)} pts to go</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nextTier.gradient} opacity-50 flex items-center justify-center`}>
                  {React.createElement(nextTier.icon, { className: "w-6 h-6 text-white" })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="actions"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Zap className="w-4 h-4 mr-2" />
            All Actions
          </TabsTrigger>
          <TabsTrigger 
            value="tiers"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            <Crown className="w-4 h-4 mr-2" />
            Tier System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Start Section */}
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-400" />
              Quick Start - Earn Your First Points
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {quickStartActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all text-center"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: action.color }} />
                    </div>
                    <p className="text-white font-medium text-sm">{action.action}</p>
                    <Badge 
                      className="mt-2 border-0"
                      style={{ backgroundColor: `${action.color}20`, color: action.color }}
                    >
                      +{action.points} pts
                    </Badge>
                    {action.note && (
                      <p className="text-xs text-slate-500 mt-1">{action.note}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              How the Points System Works
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                  <span className="text-emerald-400 font-bold">1</span>
                </div>
                <h4 className="text-white font-medium mb-2">Earn Points</h4>
                <p className="text-sm text-slate-400">
                  Complete actions like logging in daily, installing apps, referring friends, and contributing to the ecosystem.
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                  <span className="text-cyan-400 font-bold">2</span>
                </div>
                <h4 className="text-white font-medium mb-2">Level Up Tiers</h4>
                <p className="text-sm text-slate-400">
                  As you accumulate points, you'll progress through tiers: Starter → Builder → Contributor → Champion → Legend.
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                  <span className="text-purple-400 font-bold">3</span>
                </div>
                <h4 className="text-white font-medium mb-2">Unlock Rewards</h4>
                <p className="text-sm text-slate-400">
                  Higher tiers unlock exclusive badges, recognition on leaderboards, and future token rewards.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Categories Overview */}
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              Point Categories
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                const categoryActions = actions[key]?.actions || [];
                
                return (
                  <div 
                    key={key}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                    onClick={() => setActiveTab('actions')}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm">{config.label}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge 
                            className="border-0 text-xs"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                          >
                            {config.pointRange}
                          </Badge>
                          <span className="text-xs text-slate-500">{categoryActions.length} actions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Streak Bonuses */}
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Login Streak Bonuses
            </h3>
            
            <p className="text-slate-400 mb-4">
              Log in every day to maintain your streak and earn bonus points at milestones!
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { days: 7, points: 100, label: '7-Day Streak' },
                { days: 30, points: 300, label: '30-Day Streak' },
                { days: 90, points: 750, label: '90-Day Streak' },
                { days: 365, points: 2000, label: '365-Day Streak' },
              ].map((milestone, i) => (
                <div key={i} className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20 text-center">
                  <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">{milestone.label}</p>
                  <Badge className="bg-orange-500/20 text-orange-400 border-0 mt-2">
                    +{milestone.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* All Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">All Point-Earning Actions</h3>
            
            <Accordion type="single" collapsible className="space-y-3">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                const categoryActions = actions[key]?.actions || [];
                
                if (categoryActions.length === 0) return null;
                
                return (
                  <AccordionItem 
                    key={key} 
                    value={key}
                    className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{config.label}</p>
                          <p className="text-xs text-slate-500">{categoryActions.length} actions • {config.pointRange}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 mt-2">
                        {categoryActions.map((action, i) => (
                          <div 
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{action.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
                              {action.cooldown !== 'none' && (
                                <Badge className="bg-slate-500/20 text-slate-400 border-0 text-xs mt-1">
                                  {action.cooldown === 'once' ? 'One-time' : 
                                   action.cooldown === 'daily' ? 'Daily' :
                                   action.cooldown === 'weekly' ? 'Weekly' : 'Monthly'}
                                </Badge>
                              )}
                            </div>
                            <Badge 
                              className="border-0 ml-4 shrink-0"
                              style={{ backgroundColor: `${config.color}20`, color: config.color }}
                            >
                              +{action.base_points} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </motion.div>
        </TabsContent>

        {/* Tier System Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Tier Progression System
            </h3>
            
            <div className="space-y-4">
              {tierConfig.map((tier, i) => {
                const Icon = tier.icon;
                const isCurrentTier = tier.name === currentTier;
                const isAchieved = (userSummary?.total_points || 0) >= tier.minPoints;
                
                return (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentTier 
                        ? 'bg-white/10 border-white/20' 
                        : isAchieved 
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg ${
                        !isAchieved ? 'opacity-40 grayscale' : ''
                      }`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`text-xl font-bold ${isAchieved ? 'text-white' : 'text-slate-500'}`}>
                            {tier.name}
                          </h4>
                          {isCurrentTier && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                              Current
                            </Badge>
                          )}
                          {isAchieved && !isCurrentTier && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <p className={`text-sm ${isAchieved ? 'text-slate-400' : 'text-slate-600'}`}>
                          {tier.description}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${isAchieved ? 'text-white' : 'text-slate-600'}`}>
                          {formatNumber(tier.minPoints)}
                        </p>
                        <p className="text-sm text-slate-500">points required</p>
                      </div>
                    </div>
                    
                    {/* Progress bar for current tier */}
                    {isCurrentTier && nextTier && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">Progress to {nextTier.name}</span>
                          <span className="text-cyan-400">
                            {formatNumber(userSummary?.total_points || 0)} / {formatNumber(nextTier.minPoints)}
                          </span>
                        </div>
                        <Progress 
                          value={((userSummary?.total_points || 0) - tier.minPoints) / (nextTier.minPoints - tier.minPoints) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Tier Benefits */}
          <motion.div variants={item} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Tier Benefits
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-400" />
                  Leaderboard Recognition
                </h4>
                <p className="text-sm text-slate-400">
                  Higher tiers get better visibility on the leaderboard with special badges and colors.
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Exclusive Badges
                </h4>
                <p className="text-sm text-slate-400">
                  Earn exclusive badges as you reach each tier, displayed on your profile.
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  Special Recognition
                </h4>
                <p className="text-sm text-slate-400">
                  Top performers may be recognized as "Top Node Operator" or "Top Ambassador".
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Future Token Rewards
                </h4>
                <p className="text-sm text-slate-400">
                  Your points may be convertible to OPT tokens in future reward distributions.
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* CTA */}
      <motion.div
        variants={item}
        className="glass-card p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Ready to start earning?</h3>
            <p className="text-slate-400 text-sm mt-1">
              Check out your current progress and see how you rank against others!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/leaderboard')}
              className="border-white/10 text-slate-300 hover:bg-white/10"
            >
              <Medal className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button
              onClick={() => navigate('/proof-of-impact')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              My Progress
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
