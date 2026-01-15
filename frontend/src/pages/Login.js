import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Smartphone, ArrowLeft, Shield, Zap } from 'lucide-react';
import { ReactComponent as CloudNodeLogo } from '@/assets/CloudNode.svg';
import { getErrorMessage } from '@/utils/errorUtils';

export default function Login() {
  const { login, verify2FA, cancel2FA, pending2FA } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requires_2fa) {
        toast.info('Enter your 2FA code to continue');
      } else {
        toast.success('Welcome back!');
        // Show points earned notification
        if (result.points_earned) {
          setTimeout(() => {
            toast.success(`+${result.points_earned} points earned for logging in!`, {
              icon: <Zap className="w-4 h-4 text-emerald-400" />,
              duration: 3000
            });
          }, 500);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error('Please enter a valid code');
      return;
    }

    setLoading(true);
    try {
      const result = await verify2FA(totpCode);
      if (!result.requires_2fa) {
        toast.success('Welcome back!');
        if (result.points_earned) {
          setTimeout(() => {
            toast.success(`+${result.points_earned} points earned for logging in!`, {
              icon: <Zap className="w-4 h-4 text-emerald-400" />,
              duration: 3000
            });
          }, 500);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    cancel2FA();
    setTotpCode('');
  };

  // Show 2FA verification screen
  if (pending2FA) {
    return (
      <div className="min-h-screen bg-[#05050A] flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4865af]/20 via-transparent to-purple-500/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4865af]/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col justify-center px-16">
            <div className="mb-8">
              <CloudNodeLogo className="h-12 w-auto" />
            </div>
            
            <h2 className="text-4xl font-bold text-white font-['Outfit'] mb-4">
              <span className="text-emerald-400">Secure</span> authentication
            </h2>
            <p className="text-lg text-slate-400 max-w-md">
              Two-factor authentication adds an extra layer of security to protect your earnings and node operations.
            </p>
          </div>
        </div>

        {/* Right Panel - 2FA Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-10">
              <CloudNodeLogo className="h-10 w-auto" />
            </div>

            <div className="glass-card p-8">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-['Outfit']">2FA Verification</h2>
                  <p className="text-slate-400 text-sm">Enter the code from your authenticator app</p>
                </div>
              </div>

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
                      className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 text-white text-center text-2xl tracking-widest font-mono"
                      maxLength={8}
                      autoFocus
                      required
                      data-testid="login-2fa-code"
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    Enter your 6-digit code or a backup code
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || totpCode.length < 6}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full h-11"
                  data-testid="login-2fa-submit"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-slate-500 mt-6 text-sm">
                Lost access to your authenticator?{' '}
                <span className="text-slate-400">Use a backup code</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal login form
  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4865af]/20 via-transparent to-purple-500/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4865af]/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <CloudNodeLogo className="h-12 w-auto" />
          </div>
          
          <h2 className="text-4xl font-bold text-white font-['Outfit'] mb-4">
            Your node is <span className="text-[#6b8dd6]">earning</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-md">
            Join thousands of entrepreneurs hosting apps and earning recurring revenue on the Optio Blockchain Cloud.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-[#6b8dd6]">$2.4M+</p>
              <p className="text-sm text-slate-400">Paid to operators</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-purple-400">12,450</p>
              <p className="text-sm text-slate-400">Active nodes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <CloudNodeLogo className="h-10 w-auto" />
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white font-['Outfit']">Welcome back</h2>
              <p className="text-slate-400 mt-1">Sign in to your operator dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@example.com"
                    className="pl-10 bg-black/40 border-white/10 focus:border-[#4865af]/50 text-white"
                    required
                    data-testid="login-email"
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
                    className="pl-10 bg-black/40 border-white/10 focus:border-[#4865af]/50 text-white"
                    required
                    data-testid="login-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4865af] hover:bg-[#5a7ac4] text-white font-semibold rounded-full h-11"
                data-testid="login-submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-slate-400 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#6b8dd6] hover:text-[#8ba8e0] font-medium" data-testid="register-link">
                Start operating
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
