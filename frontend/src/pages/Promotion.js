import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Link2, Copy, ExternalLink, MousePointer,
  Users, TrendingUp, Share2, Coins, Package, UserPlus,
  CheckCircle2, Twitter, Linkedin, Trophy, Medal, Award,
  Crown, Star, Flame, Calendar, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Rank badge component
const RankBadge = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <Crown className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/30">
        <Award className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
      <span className="text-lg font-bold text-slate-400">#{rank}</span>
    </div>
  );
};

export default function Promotion() {
  const [stats, setStats] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all_time');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchReferralCode();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardPeriod]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/promotion/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch promotion stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await axios.get(`${API}/referral/code`);
      setReferralCode(response.data);
    } catch (error) {
      console.error('Failed to fetch referral code');
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await axios.get(`${API}/promotion/leaderboard?period=${leaderboardPeriod}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const copyLink = (link, type = 'link') => {
    navigator.clipboard.writeText(link);
    setCopied(type);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const shareOnSocial = (platform, link) => {
    const text = "Join me on Optio CloudNode and start earning as a node operator!";
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-2 sm:gap-3">
          <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
          Promotion Tools
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-1">Earn OPT rewards by growing the network</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400">Operator Referrals</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats?.operator_signups || 0}</p>
          <p className="text-xs sm:text-sm text-cyan-400">+{stats?.operator_opt_rewards || 0} OPT</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400">App Signups</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats?.app_signups_driven || 0}</p>
          <p className="text-xs sm:text-sm text-purple-400">+{stats?.app_opt_rewards || 0} OPT</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
              <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400">Link Clicks</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats?.app_link_clicks?.toLocaleString() || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400">Total OPT Earned</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
            {((stats?.operator_opt_rewards || 0) + (stats?.app_opt_rewards || 0)).toFixed(0)}
          </p>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 w-full sm:w-auto flex">
          <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="share" className="flex-1 sm:flex-none data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
            <Share2 className="w-4 h-4 mr-2" />
            Share Links
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 sm:flex-none data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">Share Leaderboard</h2>
                  <p className="text-sm text-slate-400">Top promoters in the network</p>
                </div>
              </div>
              
              <Select value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
                <SelectTrigger className="w-40 bg-black/40 border-white/10" data-testid="leaderboard-period-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Your Position Banner */}
            {leaderboard?.current_user_rank && (
              <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-cyan-400">#{leaderboard.current_user_rank.rank}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Your Position</p>
                      <p className="text-sm text-slate-400">{leaderboard.current_user_rank.total_shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">+{leaderboard.current_user_rank.opt_earned} OPT</p>
                    <p className="text-sm text-slate-400">{leaderboard.current_user_rank.signups_driven} signups</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard List */}
            {loadingLeaderboard ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : leaderboard?.leaderboard?.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No promoters yet</h3>
                <p className="text-slate-400 mb-6">Be the first to share and claim the top spot!</p>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Start Sharing
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard?.leaderboard?.map((entry, idx) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      entry.is_current_user 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' 
                        : entry.rank <= 3 
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    <RankBadge rank={entry.rank} />
                    
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                      entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {entry.avatar_initial}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${entry.is_current_user ? 'text-cyan-400' : 'text-white'}`}>
                          {entry.display_name}
                          {entry.is_current_user && <span className="text-xs ml-2 text-cyan-400">(You)</span>}
                        </p>
                        {entry.rank === 1 && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                            <Flame className="w-3 h-3 mr-1" /> Top Promoter
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{entry.installed_apps} apps</span>
                        <span>•</span>
                        <span>{entry.apps_shared_count} shared</span>
                        {entry.platforms_used?.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {entry.platforms_used.includes('twitter') && <Twitter className="w-3 h-3" />}
                              {entry.platforms_used.includes('linkedin') && <Linkedin className="w-3 h-3" />}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Share2 className="w-4 h-4 text-slate-400" />
                        <span className="text-lg font-bold text-white">{entry.total_shares}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-purple-400">{entry.signups_driven} signups</span>
                        <span className="text-emerald-400 font-semibold">+{entry.opt_earned} OPT</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Total Participants */}
            {leaderboard?.total_participants?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10 text-center text-slate-400">
                <p>{leaderboard.total_participants.length} total promoters in the network</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Share Links Tab */}
        <TabsContent value="share" className="mt-4 space-y-4">
          {/* Your Referral Link */}
          {referralCode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Your Operator Referral Link</h3>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      50 OPT/signup
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">Invite friends to become node operators</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-white/10 overflow-hidden">
                    <span className="text-sm text-slate-300 truncate">{referralCode.operator_referral_link}</span>
                  </div>
                  <Button
                    onClick={() => copyLink(referralCode.operator_referral_link, 'referral')}
                    className={`${copied === 'referral' ? 'bg-emerald-500' : 'bg-cyan-500 hover:bg-cyan-400'} text-black shrink-0`}
                  >
                    {copied === 'referral' ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" /> Copy</>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                <span className="text-sm text-slate-400">Share on:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnSocial('twitter', referralCode.operator_referral_link)}
                  className="border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/20"
                >
                  <Twitter className="w-4 h-4 mr-2" /> Twitter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnSocial('linkedin', referralCode.operator_referral_link)}
                  className="border-[#0077B5]/30 text-[#0077B5] hover:bg-[#0077B5]/20"
                >
                  <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </Button>
              </div>
            </motion.div>
          )}

          {/* App Share Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Your App Share Links</h2>
            <p className="text-slate-400 mb-6">
              Share your hosted apps to earn 2-100 OPT for each signup and share.
            </p>
            
            <div className="space-y-4">
              {stats?.app_share_links?.map((link, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{link.app_name}</p>
                      <p className="text-sm text-slate-400 truncate font-mono">{link.referral_link}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {link.signups} signups
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      +{link.opt_earned} OPT
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLink(link.referral_link)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!stats?.app_share_links || stats.app_share_links.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No apps installed yet. Visit the marketplace to install apps!</p>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {stats?.recent_activity?.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'operator_signup' ? 'bg-purple-500/20' : 
                    activity.type === 'app_signup' ? 'bg-cyan-500/20' : 'bg-slate-500/20'
                  }`}>
                    {activity.type === 'operator_signup' ? (
                      <UserPlus className="w-5 h-5 text-purple-400" />
                    ) : activity.type === 'app_signup' ? (
                      <Users className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <MousePointer className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      {activity.type === 'operator_signup' 
                        ? 'New operator signed up via your link'
                        : activity.type === 'app_signup'
                          ? `User signed up for ${activity.app_name || 'your app'}`
                          : 'Link clicked'
                      }
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  {activity.opt_earned > 0 && (
                    <Badge className={`${
                      activity.type === 'operator_signup' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      +{activity.opt_earned} OPT
                    </Badge>
                  )}
                </div>
              ))}
              
              {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity yet. Start sharing to earn rewards!</p>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* How It Works - Compact */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-white font-['Outfit'] mb-3 sm:mb-4">How to Earn OPT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-cyan-400 font-bold text-lg">+100 OPT</p>
            <p className="text-sm text-slate-400">Share an app</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-purple-400 font-bold text-lg">+50 OPT</p>
            <p className="text-sm text-slate-400">Refer an operator</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-bold text-lg">+2 OPT</p>
            <p className="text-sm text-slate-400">Per app signup</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
