import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Megaphone, Link2, Copy, ExternalLink, MousePointer,
  Users, TrendingUp, Share2, Coins, Package, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Promotion() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-cyan-400" />
          Promotion Tools
        </h1>
        <p className="text-slate-400 mt-1">Earn OPT rewards by growing the network</p>
      </div>

      {/* How It Works */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">How to Earn OPT Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg icon-bg-cyan flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-semibold text-white">Refer Node Operators</p>
                <p className="text-cyan-400 font-bold">50 OPT per signup</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Invite friends to become node operators. When they sign up and activate their node, you earn 50 OPT.
            </p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg icon-bg-purple flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Drive App Signups</p>
                <p className="text-purple-400 font-bold">2 OPT per user</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Share your hosted apps across your networks. Earn 2 OPT for every new user who signs up through your link.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg icon-bg-cyan flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-black" />
            </div>
            <p className="text-sm text-slate-400">Operator Referrals</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.operator_signups}</p>
          <p className="text-sm text-cyan-400">+{stats?.operator_opt_rewards} OPT earned</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg icon-bg-purple flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">App Signups Driven</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.app_signups_driven}</p>
          <p className="text-sm text-purple-400">+{stats?.app_opt_rewards} OPT earned</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">Total Link Clicks</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.app_link_clicks?.toLocaleString()}</p>
          <p className="text-sm text-slate-500">{stats?.operator_invites_sent} invites sent</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">Total OPT Earned</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            {(stats?.operator_opt_rewards + stats?.app_opt_rewards)?.toFixed(0)} OPT
          </p>
        </motion.div>
      </div>

      {/* Tabs for different promotion types */}
      <Tabs defaultValue="apps" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="apps" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
            Promote Your Apps
          </TabsTrigger>
          <TabsTrigger value="operators" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Refer Operators
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Your App Share Links</h2>
            <p className="text-slate-400 mb-6">
              Share these links to drive signups to apps you host. Earn 2 OPT for each new user.
            </p>
            
            <div className="space-y-4">
              {stats?.app_share_links?.map((link, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg icon-bg-cyan flex items-center justify-center">
                      <Package className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{link.app_name}</p>
                      <p className="text-sm text-slate-400 truncate font-mono">{link.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {link.signups} signups
                    </Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-400">
                      +{link.opt_earned} OPT
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLink(link.url)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="operators" className="mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Operator Referral Link</h2>
            <p className="text-slate-400 mb-6">
              Invite friends to become node operators. Earn 50 OPT when they activate their node.
            </p>
            
            <div className="flex items-center gap-4 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 mb-1">Your referral link</p>
                <p className="font-mono text-white truncate">{stats?.operator_referral_link}</p>
              </div>
              <Button
                onClick={() => copyLink(stats?.operator_referral_link)}
                className="bg-purple-500 hover:bg-purple-400 text-white rounded-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stats?.operator_invites_sent}</p>
                <p className="text-sm text-slate-400">Invites Sent</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-purple-400">{stats?.operator_signups}</p>
                <p className="text-sm text-slate-400">Operators Signed Up</p>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {stats?.recent_activity?.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activity.type === 'operator_signup' ? 'bg-purple-500/20' : 'bg-cyan-500/20'
              }`}>
                {activity.type === 'operator_signup' ? (
                  <UserPlus className="w-5 h-5 text-purple-400" />
                ) : (
                  <Users className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white">
                  {activity.type === 'operator_signup' 
                    ? `${activity.user} became a node operator`
                    : `${activity.user} signed up for ${activity.app}`
                  }
                </p>
                <p className="text-sm text-slate-500">{activity.time}</p>
              </div>
              <Badge className={`${
                activity.type === 'operator_signup' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                +{activity.opt_reward} OPT
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
