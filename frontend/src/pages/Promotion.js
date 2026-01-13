import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Megaphone, Link2, Copy, ExternalLink, MousePointer,
  Users, TrendingUp, Share2, Twitter, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'telegram': return <MessageCircle className="w-5 h-5" />;
      case 'discord': return <MessageCircle className="w-5 h-5" />;
      default: return <Share2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-cyan-400" />
          Promotion Tools
        </h1>
        <p className="text-slate-400 mt-1">Grow your referral network and earn more</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg icon-bg-cyan flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-black" />
            </div>
            <p className="text-sm text-slate-400">Total Clicks</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.clicks.toLocaleString()}</p>
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
            <p className="text-sm text-slate-400">Referrals</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.referrals}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg icon-bg-magenta flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">Conversions</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.conversions}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">Revenue Earned</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats?.revenue_attributed_opt.toFixed(1)} OPT</p>
        </motion.div>
      </div>

      {/* Share Links */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Your Referral Links</h2>
        
        <div className="space-y-4">
          {stats?.share_links.map((link, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  link.platform === 'twitter' ? 'bg-blue-500' :
                  link.platform === 'telegram' ? 'bg-sky-500' : 'bg-indigo-500'
                }`}>
                  {getPlatformIcon(link.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white capitalize">{link.platform}</p>
                  <p className="text-sm text-slate-400 truncate font-mono">{link.url}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {link.clicks} clicks
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyLink(link.url)}
                  className="text-slate-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(link.url, '_blank')}
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Promotion Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">AI Promotion Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/20">
            <p className="text-sm text-slate-300">
              Your Twitter link has the highest conversion rate (3.4%). Consider posting more content there to maximize referrals.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20">
            <p className="text-sm text-slate-300">
              Peak engagement time for your referrals is 2-4 PM UTC. Schedule your promotional posts accordingly.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
