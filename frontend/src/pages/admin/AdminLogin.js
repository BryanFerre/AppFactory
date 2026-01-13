import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Mail, Lock, ArrowRight, Smartphone, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const { admin, login, loading, pending2FA, verify2FA, cancel2FA } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const result = await login(email, password);
      if (result?.requires_2fa) {
        toast.info('Enter your 2FA code to continue');
      } else {
        toast.success('Welcome back, Admin!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error('Please enter a valid code');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verify2FA(totpCode);
      if (!result?.requires_2fa) {
        toast.success('Welcome back, Admin!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid 2FA code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    cancel2FA();
    setTotpCode('');
  };

  // 2FA Verification Screen
  if (pending2FA) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">2FA Verification</h1>
            <p className="text-slate-400 mt-2">Enter your authentication code</p>
          </div>

          {/* 2FA Form */}
          <div className="bg-[rgba(15,17,26,0.8)] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>

            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="totp" className="text-slate-300">Authentication Code</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="totp"
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="000000"
                    className="pl-11 bg-black/40 border-white/10 text-white h-12 text-center text-2xl tracking-widest font-mono"
                    maxLength={8}
                    autoFocus
                    required
                    data-testid="admin-2fa-code"
                  />
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Enter your 6-digit code or a backup code
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting || totpCode.length < 6}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl"
                data-testid="admin-2fa-submit"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Verify & Access
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Lost access? Use a backup code or contact IT support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Login Screen
  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Optio Admin</h1>
          <p className="text-slate-400 mt-2">Internal Control Panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-[rgba(15,17,26,0.8)] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-400 text-sm font-medium">Production Environment</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@optio.com"
                  className="pl-11 bg-black/40 border-white/10 text-white h-12"
                  required
                  data-testid="admin-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 bg-black/40 border-white/10 text-white h-12"
                  required
                  data-testid="admin-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl"
              data-testid="admin-login-submit"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Control Panel
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Authorized personnel only. All actions are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
