import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, MoreVertical, TrendingUp, Users, Activity,
  Trash2, BarChart2, AlertTriangle, CheckCircle2,
  HardDrive, Globe, Cpu, Gamepad2, Shield, Image, DollarSign, Coins,
  ChevronRight, ExternalLink, Share2, Copy, Twitter, Linkedin, Mail,
  Link2, X, ArrowUpRight, Clock, Zap, Eye, MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function InstalledApps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uninstallDialog, setUninstallDialog] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appStats, setAppStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchApps();
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

  const fetchAppStats = async (app) => {
    setLoadingStats(true);
    try {
      const response = await axios.get(`${API}/promotion/app/${app.id}/stats`);
      setAppStats(response.data);
    } catch (error) {
      // Use app data as fallback
      setAppStats({
        app_id: app.id,
        app_name: app.name,
        share_link: `${window.location.origin}/app/${app.id}`,
        total_shares: 0,
        clicks: app.share_clicks || 0,
        signups_driven: app.signups_driven || 0,
        opt_earned_from_shares: app.opt_rewards_earned || 0,
        performance: {
          revenue_usd: app.revenue_usd || 0,
          subscribers_served: app.subscribers_served || 0,
          uptime_percentage: app.uptime || 99.9,
          health: app.health || 'healthy'
        }
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAppClick = (app) => {
    setSelectedApp(app);
    fetchAppStats(app);
  };

  const handleUninstall = async (app) => {
    try {
      await axios.delete(`${API}/apps/installed/${app.id}`);
      toast.success(`${app.name} uninstalled successfully`);
      setUninstallDialog(null);
      setSelectedApp(null);
      fetchApps();
    } catch (error) {
      toast.error('Failed to uninstall app');
    }
  };

  const handleShare = async (platform) => {
    if (!selectedApp || !appStats) return;
    
    setSharing(true);
    try {
      const response = await axios.post(`${API}/promotion/share/${selectedApp.id}`, null, {
        params: { platform }
      });
      
      const shareLink = response.data.share_link || appStats.share_link;
      const shareText = `Check out ${selectedApp.name} on Optio CloudNode! 🚀`;
      
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareLink);
        toast.success(
          <div>
            <p className="font-semibold">Link copied!</p>
            {response.data.points_awarded > 0 && (
              <p className="text-sm text-emerald-400">+{response.data.points_awarded} OPT earned!</p>
            )}
          </div>
        );
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`, '_blank');
        if (response.data.points_awarded > 0) {
          toast.success(`+${response.data.points_awarded} OPT earned for sharing!`);
        }
      } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, '_blank');
        if (response.data.points_awarded > 0) {
          toast.success(`+${response.data.points_awarded} OPT earned for sharing!`);
        }
      } else if (platform === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Check out ${selectedApp.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareLink}`)}`;
        if (response.data.points_awarded > 0) {
          toast.success(`+${response.data.points_awarded} OPT earned for sharing!`);
        }
      }
      
      // Refresh stats to show updated share count
      fetchAppStats(selectedApp);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to share'));
    } finally {
      setSharing(false);
    }
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
          <Button 
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full"
            onClick={() => window.location.href = '/dashboard/app-marketplace'}
          >
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
              className="glass-card glass-card-hover p-6 cursor-pointer group"
              onClick={() => handleAppClick(app)}
              data-testid={`installed-app-${app.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* App Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl ${
                    app.health === 'healthy' ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                  } flex items-center justify-center`}>
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{app.name}</h3>
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
                    <p className="text-xs text-slate-500 mb-1">Signups</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-1 justify-center lg:justify-start">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      {app.signups_driven || 0}
                    </p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-slate-500 mb-1">OPT</p>
                    <p className="text-lg font-semibold text-cyan-400 flex items-center gap-1 justify-center lg:justify-start">
                      <Coins className="w-4 h-4" />
                      {app.opt_rewards_earned?.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    onClick={() => handleAppClick(app)}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share & Stats
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`app-menu-${app.id}`}>
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-white/10">
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => handleAppClick(app)}
                      >
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

      {/* App Details & Share Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => { setSelectedApp(null); setAppStats(null); }}>
        <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-3">
              {selectedApp && getAppIcon(selectedApp.icon)}
              {selectedApp?.name}
              {selectedApp?.health === 'healthy' && (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              App performance, revenue stats, and share link
            </DialogDescription>
          </DialogHeader>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appStats && (
            <div className="space-y-6 py-4">
              {/* Performance Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-400">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${appStats.performance?.revenue_usd?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-400">Subscribers</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {appStats.performance?.subscribers_served?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">Uptime</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {appStats.performance?.uptime_percentage?.toFixed(1) || 99.9}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-400">OPT Earned</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-400">
                    {appStats.opt_earned_from_shares?.toFixed(0) || 0}
                  </p>
                </div>
              </div>

              {/* Share Stats */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-cyan-400" />
                  Share Performance
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{appStats.total_shares || 0}</p>
                    <p className="text-xs text-slate-400">Total Shares</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{appStats.clicks || 0}</p>
                    <p className="text-xs text-slate-400">Link Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{appStats.signups_driven || 0}</p>
                    <p className="text-xs text-slate-400">Signups Driven</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-300">
                    Earn <span className="text-emerald-400 font-bold">+100 OPT</span> every time you share this app!
                  </span>
                </div>
              </div>

              {/* Share Link Section */}
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-purple-500/20">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-purple-400" />
                  Your Referral Link
                </h3>
                
                {/* Link Display */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-black/40 rounded-lg border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={appStats.share_link || ''}
                    className="flex-1 bg-transparent text-sm text-slate-300 outline-none truncate"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleShare('copy')}
                    disabled={sharing}
                    className="bg-purple-500 hover:bg-purple-400 text-white shrink-0"
                    data-testid="copy-link-btn"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                {/* Social Share Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleShare('twitter')}
                    disabled={sharing}
                    className="bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] border border-[#1DA1F2]/30"
                    data-testid="share-twitter-btn"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => handleShare('linkedin')}
                    disabled={sharing}
                    className="bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#0077B5] border border-[#0077B5]/30"
                    data-testid="share-linkedin-btn"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    onClick={() => handleShare('email')}
                    disabled={sharing}
                    className="bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border border-slate-500/30"
                    data-testid="share-email-btn"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    setUninstallDialog(selectedApp);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Uninstall App
                </Button>
                <Button
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                  onClick={() => { setSelectedApp(null); setAppStats(null); }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
