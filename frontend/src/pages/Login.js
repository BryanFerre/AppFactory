import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { ReactComponent as AppFactoryLogo } from '@/assets/AppFactory.svg';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4865af]/20 via-transparent to-purple-500/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4865af]/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <AppFactoryLogo className="h-12 w-auto" />
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
            <AppFactoryLogo className="h-10 w-auto" />
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
