import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Package, MoreVertical, TrendingUp, Users, Activity,
  Trash2, BarChart2, Share2, AlertTriangle, CheckCircle2,
  HardDrive, Globe, Cpu, Gamepad2, Shield, Image, DollarSign, Coins,
  Copy, Check, Sparkles, Loader2, Mail, ExternalLink, RefreshCw,
  Twitter, Facebook, Linkedin, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Social platform configurations
const socialPlatforms = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black hover:bg-zinc-800',
    shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    maxLength: 280
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-[#1877F2] hover:bg-[#166FE5]',
    shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    maxLength: 500
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-[#0A66C2] hover:bg-[#095196]',
    shareUrl: (text, url) => `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    maxLength: 700
  },
  {
    id: 'parler',
    name: 'Parler',
    icon: MessageCircle,
    color: 'bg-[#892E2E] hover:bg-[#732626]',
    shareUrl: (text, url) => `https://parler.com/new-post?message=${encodeURIComponent(text + ' ' + url)}`,
    maxLength: 1000
  }
];

export default function InstalledApps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uninstallDialog, setUninstallDialog] = useState(null);
  const [shareDialog, setShareDialog] = useState(null);
  const [generatedPost, setGeneratedPost] = useState('');
  const [generatingPost, setGeneratingPost] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    fetchApps();
    fetchReferralCode();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await axios.get(`${API}/apps/installed`);
      setApps(response.data);
    } catch (error) {
      toast.error('Failed to fetch installed apps');
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

  const handleUninstall = async (app) => {
    try {
      await axios.delete(`${API}/apps/installed/${app.id}`);
      toast.success(`${app.name} uninstalled successfully`);
      setUninstallDialog(null);
      fetchApps();
    } catch (error) {
      toast.error('Failed to uninstall app');
    }
  };

  const openShareDialog = async (app) => {
    setShareDialog(app);
    setGeneratedPost('');
    setCopiedLink(false);
    setCopiedPost(false);
    
    // Auto-generate post when dialog opens
    await generateAIPost(app);
  };

  const generateAIPost = async (app) => {
    setGeneratingPost(true);
    try {
      const response = await axios.get(`${API}/ai/app-promotions/${app.id}`);
      if (response.data.social_posts && response.data.social_posts.length > 0) {
        setGeneratedPost(response.data.social_posts[0].content);
      } else {
        // Fallback post
        setGeneratedPost(`🚀 Check out ${app.name} on AppCloud! I'm hosting this amazing app on the decentralized cloud. Join the future of distributed computing! #AppCloud #Web3 #DecentralizedCloud`);
      }
    } catch (error) {
      // Fallback post on error
      setGeneratedPost(`🚀 Check out ${app.name} on AppCloud! I'm hosting this amazing app on the decentralized cloud. Join the future of distributed computing! #AppCloud #Web3 #DecentralizedCloud`);
    } finally {
      setGeneratingPost(false);
    }
  };

  const getShareLink = (app) => {
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

  const shareToSocial = (platform, app) => {
    const shareLink = getShareLink(app);
    const url = platform.shareUrl(generatedPost, shareLink);
    window.open(url, '_blank', 'width=600,height=400');
    toast.success(`Opening ${platform.name}...`);
  };

  const shareViaEmail = (app) => {
    const shareLink = getShareLink(app);
    const subject = encodeURIComponent(`Check out ${app.name} on AppCloud!`);
    const body = encodeURIComponent(`${generatedPost}\n\n${shareLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Opening email client...');
  };

  const getAppIcon = (iconName) => {
    const icons = {
      database: <HardDrive className="w-6 h-6" />,
      video: <Activity className="w-6 h-6" />,
      link: <Globe className="w-6 h-6" />,
      image: <Image className="w-6 h-6" />,
      shield: <Shield className="w-6 h-6" />,
      cpu: <Cpu className="w-6 h-6" />,
      globe: <Globe className="w-6 h-6" />,
      gamepad: <Gamepad2 className="w-6 h-6" />
    };
    return icons[iconName] || <Package className="w-6 h-6" />;
  };

  const totalRevenue = apps.reduce((sum, app) => sum + (app.revenue_usd || 0), 0);
  const totalUsers = apps.reduce((sum, app) => sum + (app.subscribers_served || 0), 0);
  const totalSignups = apps.reduce((sum, app) => sum + (app.signups_driven || 0), 0);
  const totalOptRewards = apps.reduce((sum, app) => sum + (app.opt_rewards_earned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <Package className="w-8 h-8 text-cyan-400" />
          Installed Apps
        </h1>
        <p className="text-slate-400 mt-1">Manage your revenue-generating applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Apps</p>
          <p className="text-2xl font-bold text-white">{apps.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Revenue (USD)</p>
          <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Subscribers</p>
          <p className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">OPT Rewards</p>
          <p className="text-2xl font-bold text-cyan-400">{totalOptRewards.toFixed(0)} OPT</p>
          <p className="text-xs text-slate-500">{totalSignups} signups driven</p>
        </div>
      </div>

      {/* Apps List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No apps installed</h3>
          <p className="text-slate-400 mb-6">Visit the App Marketplace to discover and install revenue-generating apps</p>
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full">
            Browse App Marketplace
          </Button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {apps.map((app) => (
            <motion.div
              key={app.id}
              variants={item}
              className="glass-card glass-card-hover p-6"
              data-testid={`installed-app-${app.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* App Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl ${
                    app.health === 'healthy' ? 'icon-bg-cyan' : 'icon-bg-magenta'
                  } flex items-center justify-center`}>
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{app.name}</h3>
                      <Badge className={`text-xs ${
                        app.health === 'healthy' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {app.health === 'healthy' ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Healthy</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3 mr-1" /> Warning</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      Installed {new Date(app.installed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-slate-500 mb-1">Subscribers</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-1 justify-center lg:justify-start">
                      <Users className="w-4 h-4 text-slate-400" />
                      {app.subscribers_served?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-slate-500 mb-1">Revenue</p>
                    <p className="text-lg font-semibold text-emerald-400 flex items-center gap-1 justify-center lg:justify-start">
                      <DollarSign className="w-4 h-4" />
                      {app.revenue_usd?.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-slate-500 mb-1">Signups Driven</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-1 justify-center lg:justify-start">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      {app.signups_driven || 0}
                    </p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-slate-500 mb-1">OPT Rewards</p>
                    <p className="text-lg font-semibold text-cyan-400 flex items-center gap-1 justify-center lg:justify-start">
                      <Coins className="w-4 h-4" />
                      {app.opt_rewards_earned?.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Share & Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300"
                    onClick={() => openShareDialog(app)}
                    data-testid={`share-btn-${app.id}`}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share & Promote
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`app-menu-${app.id}`}>
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-white/10">
                      <DropdownMenuItem className="cursor-pointer">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-400 focus:text-red-400"
                        onClick={() => setUninstallDialog(app)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Uninstall
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Uninstall Dialog */}
      <AlertDialog open={!!uninstallDialog} onOpenChange={() => setUninstallDialog(null)}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Uninstall {uninstallDialog?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove the app from your node and stop generating revenue from it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleUninstall(uninstallDialog)}
              data-testid="confirm-uninstall-btn"
            >
              Uninstall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share & Promote Dialog */}
      <Dialog open={!!shareDialog} onOpenChange={() => setShareDialog(null)}>
        <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Share & Promote {shareDialog?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Share your hosted app to earn referral rewards when users sign up
            </DialogDescription>
          </DialogHeader>

          {shareDialog && (
            <Tabs defaultValue="share" className="mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger value="share" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Share Link
                </TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Social Post
                </TabsTrigger>
              </TabsList>

              {/* Share Link Tab */}
              <TabsContent value="share" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Your Referral Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 truncate">
                      {getShareLink(shareDialog)}
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/10 text-slate-300 hover:bg-white/10"
                      onClick={() => copyToClipboard(getShareLink(shareDialog), 'link')}
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Share this link to earn OPT rewards when users sign up through your referral
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Earn Rewards</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Earn <span className="text-emerald-400 font-bold">2 OPT</span> for every user who signs up through your link and installs this app!
                  </p>
                </div>
              </TabsContent>

              {/* Social Post Tab */}
              <TabsContent value="social" className="space-y-4 mt-4">
                {/* AI Generated Post */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      AI-Generated Post
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white h-8"
                      onClick={() => generateAIPost(shareDialog)}
                      disabled={generatingPost}
                    >
                      {generatingPost ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {generatingPost ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating promotional content...
                    </div>
                  ) : (
                    <Textarea
                      value={generatedPost}
                      onChange={(e) => setGeneratedPost(e.target.value)}
                      className="bg-white/5 border-white/10 text-slate-200 min-h-[120px] resize-none"
                      placeholder="AI-generated promotional content will appear here..."
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{generatedPost.length} characters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white h-8"
                      onClick={() => copyToClipboard(generatedPost, 'post')}
                      disabled={!generatedPost}
                    >
                      {copiedPost ? <Check className="w-4 h-4 text-emerald-400 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      Copy Text
                    </Button>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="space-y-3">
                  <label className="text-sm text-slate-400">Share to Social Media</label>
                  <div className="grid grid-cols-2 gap-3">
                    {socialPlatforms.map((platform) => (
                      <Button
                        key={platform.id}
                        className={`${platform.color} text-white justify-start`}
                        onClick={() => shareToSocial(platform, shareDialog)}
                        disabled={!generatedPost}
                        data-testid={`share-${platform.id}`}
                      >
                        <platform.icon className="w-5 h-5 mr-2" />
                        {platform.name}
                        <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Email Share */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-slate-300 hover:bg-white/10"
                    onClick={() => shareViaEmail(shareDialog)}
                    disabled={!generatedPost}
                    data-testid="share-email"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send via Email
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </Button>
                </div>

                {/* Tips */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 font-semibold">Pro Tips</span>
                  </div>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Post during peak hours (9am-12pm, 7pm-9pm) for maximum reach</li>
                    <li>• Engage with comments to boost visibility</li>
                    <li>• Share consistently across multiple platforms</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
