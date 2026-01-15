import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, User, Bell, Shield, 
  Smartphone, Key, CheckCircle, XCircle, Copy, AlertTriangle,
  RefreshCw, Loader2, Eye, EyeOff, HelpCircle, Coins, PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';
import OnboardingModal from '@/components/OnboardingModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    earnings: true,
    nodeStatus: true,
    promotions: false,
    weekly: true
  });

  // 2FA State
  const [twoFaStatus, setTwoFaStatus] = useState(null);
  const [setupDialog, setSetupDialog] = useState(false);
  const [disableDialog, setDisableDialog] = useState(false);
  const [backupCodesDialog, setBackupCodesDialog] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [resettingTutorial, setResettingTutorial] = useState(false);

  useEffect(() => {
    fetchTwoFaStatus();
  }, []);

  const fetchTwoFaStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/2fa/status`);
      setTwoFaStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch 2FA status');
    }
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/2fa/setup`);
      setSetupData(response.data);
      setSetupDialog(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to start 2FA setup'));
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/2fa/verify`, {
        code: verificationCode
      });
      
      setBackupCodes(response.data.backup_codes);
      setBackupCodesDialog(true);
      setSetupDialog(false);
      setVerificationCode('');
      setSetupData(null);
      fetchTwoFaStatus();
      toast.success('Two-factor authentication enabled!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid verification code'));
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFa = async () => {
    if (!disableCode) {
      toast.error('Please enter your 2FA code');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/2fa/disable`, {
        code: disableCode
      });
      
      setDisableDialog(false);
      setDisableCode('');
      fetchTwoFaStatus();
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const saveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const replayTutorial = async () => {
    setResettingTutorial(true);
    try {
      await axios.post(`${API}/auth/onboarding/reset`);
      setShowTutorial(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reset tutorial'));
    } finally {
      setResettingTutorial(false);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    toast.success('Tutorial completed!');
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

      {/* Security Section - 2FA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Security</h2>
        </div>
        
        <div className="space-y-6">
          {/* 2FA Status Card */}
          <div className={`p-4 rounded-xl border ${
            twoFaStatus?.two_factor_enabled 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  twoFaStatus?.two_factor_enabled ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}>
                  <Smartphone className={`w-5 h-5 ${
                    twoFaStatus?.two_factor_enabled ? 'text-emerald-400' : 'text-amber-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">Two-Factor Authentication</p>
                    <Badge className={
                      twoFaStatus?.two_factor_enabled 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }>
                      {twoFaStatus?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {twoFaStatus?.two_factor_enabled 
                      ? `Enabled on ${new Date(twoFaStatus.enabled_at).toLocaleDateString()}. ${twoFaStatus.backup_codes_remaining} backup codes remaining.`
                      : 'Add an extra layer of security to your account using authenticator apps like Google Authenticator or Authy.'
                    }
                  </p>
                </div>
              </div>
              
              {twoFaStatus?.two_factor_enabled ? (
                <Button 
                  variant="outline"
                  onClick={() => setDisableDialog(true)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Disable
                </Button>
              ) : (
                <Button 
                  onClick={startSetup}
                  disabled={loading}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Change Password</p>
                <p className="text-sm text-slate-400">Update your account password</p>
              </div>
            </div>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              Change
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Notifications Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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

      {/* Help & Tutorials Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Help & Tutorials</h2>
        </div>
        
        <div className="space-y-4">
          {/* OPT Points Tutorial */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">OPT Points Tutorial</p>
                <p className="text-sm text-slate-400">Learn how to earn and maximize your rewards</p>
              </div>
            </div>
            <Button
              onClick={replayTutorial}
              disabled={resettingTutorial}
              variant="outline"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
              data-testid="replay-tutorial-btn"
            >
              {resettingTutorial ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              Replay Tutorial
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <Button 
        onClick={saveSettings}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full px-8"
      >
        Save Changes
      </Button>

      {/* 2FA Setup Dialog */}
      <Dialog open={setupDialog} onOpenChange={setSetupDialog}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan the QR code with your authenticator app, then enter the verification code.
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-6 py-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <img 
                    src={`data:image/png;base64,${setupData.qr_code}`} 
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <p className="text-sm text-slate-400 text-center">
                  Can't scan? Enter this code manually:
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="px-3 py-2 bg-black/40 rounded-lg text-cyan-400 font-mono text-sm">
                    {showSecret ? setupData.secret : '••••••••••••••••••••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="text-slate-400"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label className="text-slate-300">Enter 6-digit code from your app</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="bg-black/40 border-white/10 text-white text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSetupDialog(false)}>Cancel</Button>
            <Button 
              onClick={verifySetup}
              disabled={loading || verificationCode.length < 6}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={backupCodesDialog} onOpenChange={setBackupCodesDialog}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Save Your Backup Codes
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Store these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                These codes will only be shown once. If you lose access to your authenticator, use a backup code to login.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, idx) => (
                <div 
                  key={idx}
                  className="px-3 py-2 bg-black/40 rounded-lg text-white font-mono text-center border border-white/10"
                >
                  {code}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="w-full border-white/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Codes
            </Button>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setBackupCodesDialog(false)}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold w-full"
            >
              I've Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialog} onOpenChange={setDisableDialog}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your current 2FA code to disable two-factor authentication.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-200">
                Disabling 2FA will make your account less secure. Only do this if you're setting up a new authenticator device.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Enter 6-digit code or backup code</Label>
              <Input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="000000 or 0000-0000"
                className="bg-black/40 border-white/10 text-white text-center text-lg tracking-wider font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisableDialog(false)}>Cancel</Button>
            <Button 
              onClick={disableTwoFa}
              disabled={loading || !disableCode}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
