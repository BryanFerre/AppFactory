import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Package, MoreVertical, TrendingUp, Users, Activity,
  Trash2, BarChart2, AlertTriangle, CheckCircle2,
  HardDrive, Globe, Cpu, Gamepad2, Shield, Image, DollarSign, Coins,
  ChevronRight, ExternalLink
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
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uninstallDialog, setUninstallDialog] = useState(null);

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
            onClick={() => navigate('/apps')}
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
              onClick={() => navigate(`/app/${app.id}`)}
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
                    onClick={() => navigate(`/app/${app.id}`)}
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
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
                        onClick={() => navigate(`/app/${app.id}`)}
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
