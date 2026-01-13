import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    earnings: true,
    nodeStatus: true,
    promotions: false,
    weekly: true
  });

  const saveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-cyan-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Profile</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input 
                defaultValue={user?.name}
                className="bg-black/40 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input 
                defaultValue={user?.email}
                className="bg-black/40 border-white/10 text-white"
                disabled
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Earnings Updates</p>
              <p className="text-sm text-slate-400">Get notified about daily earnings</p>
            </div>
            <Switch 
              checked={notifications.earnings}
              onCheckedChange={(checked) => setNotifications({...notifications, earnings: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Node Status Alerts</p>
              <p className="text-sm text-slate-400">Alerts when node health changes</p>
            </div>
            <Switch 
              checked={notifications.nodeStatus}
              onCheckedChange={(checked) => setNotifications({...notifications, nodeStatus: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Promotional Updates</p>
              <p className="text-sm text-slate-400">New apps and features</p>
            </div>
            <Switch 
              checked={notifications.promotions}
              onCheckedChange={(checked) => setNotifications({...notifications, promotions: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Weekly Summary</p>
              <p className="text-sm text-slate-400">Weekly performance report</p>
            </div>
            <Switch 
              checked={notifications.weekly}
              onCheckedChange={(checked) => setNotifications({...notifications, weekly: checked})}
            />
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Security</h2>
        </div>
        
        <div className="space-y-4">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            Change Password
          </Button>
          <p className="text-sm text-slate-400">
            Two-factor authentication coming soon
          </p>
        </div>
      </motion.div>

      {/* Appearance Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Moon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Appearance</h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">Dark Mode</p>
            <p className="text-sm text-slate-400">Use dark theme (default)</p>
          </div>
          <Switch checked={true} disabled />
        </div>
      </motion.div>

      {/* Save Button */}
      <Button 
        onClick={saveSettings}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full px-8"
      >
        Save Changes
      </Button>
    </div>
  );
}
