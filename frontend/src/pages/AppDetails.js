import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Package, ArrowLeft, Users, DollarSign, TrendingUp, Coins,
  Share2, Copy, Check, Sparkles, Loader2, Mail, ExternalLink,
  RefreshCw, Twitter, Facebook, Linkedin, MessageCircle,
  Activity, Globe, CheckCircle2, AlertTriangle, Calendar,
  BarChart3, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

// Social platform configurations
const socialPlatforms = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black hover:bg-zinc-800 border border-white/10',
    shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-[#1877F2] hover:bg-[#166FE5]',
    shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-[#0A66C2] hover:bg-[#095196]',
    shareUrl: (text, url) => `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: 'parler',
    name: 'Parler',
    icon: MessageCircle,
    color: 'bg-[#892E2E] hover:bg-[#732626]',
    shareUrl: (text, url) => `https://parler.com/new-post?message=${encodeURIComponent(text + ' ' + url)}`,
  }
];

export default function AppDetails() {
  const { appId } = useParams();
  const navigate = useNavigate();
  
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [generatingPost, setGeneratingPost] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  useEffect(() => {
    fetchAppDetails();
    fetchReferralCode();
  }, [appId]);

  const fetchAppDetails = async () => {
    try {
      const response = await axios.get(`${API}/apps/installed`);
      const foundApp = response.data.find(a => a.id === appId);
      if (foundApp) {
        setApp(foundApp);
        generateAIPost(foundApp);
      } else {
        toast.error('App not found');
        navigate('/dashboard/installed-apps');
      }
    } catch (error) {
      toast.error('Failed to fetch app details');
      navigate('/dashboard/installed-apps');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await axios.get(`${API}/referral/code`);
      setReferralCode(response.data.referral_code);
    } catch (error) {
      console.error('Failed to fetch referral code');
    }
  };

  const generateAIPost = async (appData) => {
    const targetApp = appData || app;
    if (!targetApp) return;
    
    setGeneratingPost(true);
    try {
      const response = await axios.get(`${API}/ai/app-promotions/${targetApp.id}`);
      if (response.data.social_posts && response.data.social_posts.length > 0) {
        setGeneratedPost(response.data.social_posts[0].content);
      } else {
        setGeneratedPost(`Check out ${targetApp.name} on AppCloud! I'm hosting this amazing app on the decentralized cloud. Join the future of distributed computing! #AppCloud #Web3 #DecentralizedCloud`);
      }
    } catch (error) {
      setGeneratedPost(`Check out ${targetApp.name} on AppCloud! I'm hosting this amazing app on the decentralized cloud. Join the future of distributed computing! #AppCloud #Web3 #DecentralizedCloud`);
    } finally {
      setGeneratingPost(false);
    }
  };

  const getShareLink = () => {
    if (!app) return '';
    return `${FRONTEND_URL}/app-marketplace?app=${app.id}&ref=${referralCode}`;
  };

  const copyToClipboard = async (text, type) => {
    await navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Share link copied!');
    } else {
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2000);
      toast.success('Post copied to clipboard!');
    }
  };

  const shareToSocial = (platform) => {
    const shareLink = getShareLink();
    const url = platform.shareUrl(generatedPost, shareLink);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const shareLink = getShareLink();
    const subject = encodeURIComponent(`Check out ${app.name} on AppCloud!`);
    const body = encodeURIComponent(`${generatedPost}\n\n${shareLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="text-slate-400 hover:text-white -ml-2"
        onClick={() => navigate('/installed-apps')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Installed Apps
      </Button>

      {/* App Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
            <Package className="w-10 h-10 text-cyan-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white font-['Outfit']">{app.name}</h1>
              <Badge className={`${
                app.health === 'healthy' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              } border`}>
                {app.health === 'healthy' ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Healthy</>
                ) : (
                  <><AlertTriangle className="w-3 h-3 mr-1" /> Warning</>
                )}
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {app.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Installed {new Date(app.installed_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Subscribers</span>
          </div>
          <p className="text-3xl font-bold text-white">{app.subscribers_served?.toLocaleString() || 0}</p>
          <p className="text-xs text-emerald-400 mt-1">+12% this month</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Revenue (USD)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">${app.revenue_usd?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-emerald-400 mt-1">Total earned</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Signups Driven</span>
          </div>
          <p className="text-3xl font-bold text-white">{app.signups_driven || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Via your referral</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-400">OPT Rewards</span>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{app.opt_rewards_earned?.toFixed(0) || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Earned from app</p>
        </div>
      </motion.div>

      {/* Share & Promote Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
            <Share2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Share & Promote</h2>
            <p className="text-sm text-slate-400">Earn OPT rewards when users sign up through your link</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Referral Link & AI Post */}
          <div className="space-y-6">
            {/* Referral Link */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Your Referral Link
                </label>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30">
                  <Coins className="w-3 h-3 mr-1" />
                  Earn 2 OPT per signup
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 overflow-hidden">
                  <p className="text-sm text-slate-300 truncate font-mono">
                    {getShareLink()}
                  </p>
                </div>
                <Button
                  className={`shrink-0 ${
                    copiedLink 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : 'bg-cyan-500 hover:bg-cyan-600'
                  } text-white px-4`}
                  onClick={() => copyToClipboard(getShareLink(), 'link')}
                >
                  {copiedLink ? (
                    <><Check className="w-4 h-4 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy</>
                  )}
                </Button>
              </div>
            </div>

            {/* AI Generated Post */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI-Generated Post
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white h-8"
                  onClick={() => generateAIPost()}
                  disabled={generatingPost}
                >
                  {generatingPost ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              
              {generatingPost ? (
                <div className="bg-black/40 border border-white/10 rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  <span className="text-sm">Generating promotional content...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    value={generatedPost}
                    onChange={(e) => setGeneratedPost(e.target.value)}
                    className="bg-black/40 border-white/10 text-slate-200 min-h-[120px] resize-none"
                    placeholder="AI-generated promotional content will appear here..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{generatedPost.length} characters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${copiedPost ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                      onClick={() => copyToClipboard(generatedPost, 'post')}
                      disabled={!generatedPost}
                    >
                      {copiedPost ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copiedPost ? 'Copied!' : 'Copy Text'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Social Share */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Share to Social Media</label>
              <div className="grid grid-cols-2 gap-3">
                {socialPlatforms.map((platform) => (
                  <Button
                    key={platform.id}
                    className={`${platform.color} text-white h-12 justify-start font-medium`}
                    onClick={() => shareToSocial(platform)}
                    disabled={!generatedPost}
                    data-testid={`share-${platform.id}`}
                  >
                    <platform.icon className="w-5 h-5 mr-3" />
                    {platform.name}
                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                className="w-full border-white/20 text-slate-300 hover:bg-white/10 h-12 font-medium mt-2"
                onClick={shareViaEmail}
                disabled={!generatedPost}
                data-testid="share-email"
              >
                <Mail className="w-5 h-5 mr-3" />
                Send via Email
                <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
              </Button>
            </div>

            {/* Pro Tips */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Pro Tips for Maximum Reach</span>
              </div>
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Post during peak hours (9am-12pm, 7pm-9pm)
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Engage with comments to boost visibility
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  Share consistently across multiple platforms
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Performance Analytics</h2>
            <p className="text-sm text-slate-400">Track your app's performance over time</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Uptime</span>
              <span className="text-emerald-400 font-semibold">99.9%</span>
            </div>
            <Progress value={99.9} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Capacity Used</span>
              <span className="text-cyan-400 font-semibold">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Response Time</span>
              <span className="text-blue-400 font-semibold">24ms</span>
            </div>
            <Progress value={76} className="h-2" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
