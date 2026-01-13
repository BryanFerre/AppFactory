import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';

// App Factory Logo Component
const AppFactoryLogo = ({ size = "large" }) => (
  <svg viewBox="0 0 240.38 48.54" className={size === "large" ? "h-12 w-auto" : "h-10 w-auto"}>
    <defs>
      <style>{`.cls-1{fill:#fff;}.cls-2{fill:#4865af;}`}</style>
    </defs>
    <path className="cls-2" d="M39.71,15.49h1.91c-.13-.14-.24-.29-.33-.46-.17-.32-.35-.63-.54-.94-.41-.66-.44-1.47-.1-2.17l1.17-2.35c.46-.93.23-2.04-.56-2.71l-2.86-2.4c-.79-.66-1.93-.7-2.76-.09l-2.11,1.55c-.62.46-1.43.56-2.15.28-.34-.13-.68-.26-1.02-.37-.73-.24-1.28-.85-1.46-1.59l-.61-2.54c-.24-1-1.14-1.71-2.17-1.71h-3.73c-1.03,0-1.93.71-2.17,1.71l-.61,2.54c-.18.75-.73,1.35-1.46,1.59-.35.11-.69.24-1.02.37-.72.28-1.53.18-2.15-.28l-2.11-1.55c-.83-.61-1.97-.58-2.76.09l-2.86,2.4c-.79.66-1.02,1.78-.56,2.71l1.17,2.35c.34.69.31,1.51-.1,2.17-.19.31-.37.62-.54.94-.37.68-1.05,1.11-1.82,1.16l-2.61.16c-1.03.06-1.88.83-2.06,1.84L.03,21.87c-.18,1.02.36,2.02,1.31,2.44l2.39,1.05c.71.31,1.2.96,1.32,1.72.05.36.11.72.19,1.08.15.75-.09,1.53-.65,2.06l-1.89,1.8c-.75.71-.91,1.84-.39,2.74l1.86,3.23c.52.89,1.58,1.32,2.57,1.03l2.84-.83c.41-.08,1.01-.08,1.54.34.06.06.13.12.19.17,0,0,0,0,0,0h0c.29.26.58.51.88.75.6.48.92,1.23.83,2l-.29,2.6c-.11,1.03.49,2,1.46,2.35l3.5,1.28c.97.35,2.06,0,2.63-.86l1.45-2.18c.43-.64,1.15-1.02,1.92-1,.18,0,.36,0,.54,0s.36,0,.54,0c.77-.02,1.5.35,1.92,1l1.45,2.18c.57.86,1.66,1.22,2.63.86l3.5-1.28c.97-.35,1.57-1.32,1.46-2.35l-.29-2.6c-.09-.76.23-1.52.83-2,.3-.24.6-.49.89-.75,0,0,.56-.54,1.38-.54.17,0,.35.02.53.08l2.65.78c.99.29,2.05-.13,2.57-1.03l1.86-3.23c.52-.89.35-2.02-.39-2.74l-1.89-1.8c-.56-.53-.8-1.31-.65-2.06.07-.36.14-.72.19-1.08.11-.76.61-1.42,1.32-1.72l2.39-1.05s.09-.04.13-.06h-7.55v-8.76ZM35.03,7.69h3.61v3.61h-3.61v-3.61ZM38.2,26.77h-1.94c-1.19,5.66-6.27,9.9-12.31,9.76-6.55-.14-11.87-5.47-12.01-12.02-.16-7,5.57-12.72,12.57-12.57,2.99.06,5.73,1.21,7.84,3.07h3.93v4.03h-.9c.7,1.5,1.11,3.16,1.15,4.91,0,.02,0,.04,0,.07h1.68v2.74ZM41.21,29.43v2.74h-2.74v-2.74h2.74Z"/>
    <g>
      <path className="cls-1" d="M86.33,28.48h-8.55l-1.37,4.05h-5.84l8.29-22.91h6.46l8.29,22.91h-5.91l-1.37-4.05ZM84.89,24.17l-2.84-8.39-2.81,8.39h5.65Z"/>
      <path className="cls-1" d="M101.76,14.84c.96-.52,2.08-.78,3.36-.78,1.5,0,2.86.38,4.08,1.14,1.22.76,2.18,1.85,2.89,3.26.71,1.41,1.06,3.06,1.06,4.93s-.35,3.52-1.06,4.94c-.71,1.42-1.67,2.52-2.89,3.3-1.22.77-2.58,1.16-4.08,1.16-1.26,0-2.38-.26-3.34-.78s-1.72-1.2-2.27-2.02v11.22h-5.58V14.32h5.58v2.58c.54-.85,1.29-1.53,2.25-2.06ZM106.31,20.11c-.77-.79-1.72-1.19-2.86-1.19s-2.05.4-2.82,1.21c-.77.8-1.16,1.9-1.16,3.3s.39,2.49,1.16,3.3c.77.81,1.71,1.21,2.82,1.21s2.06-.41,2.84-1.22c.78-.82,1.17-1.92,1.17-3.31s-.39-2.48-1.16-3.28Z"/>
      <path className="cls-1" d="M121.72,14.84c.96-.52,2.08-.78,3.36-.78,1.5,0,2.86.38,4.08,1.14,1.22.76,2.18,1.85,2.89,3.26.71,1.41,1.06,3.06,1.06,4.93s-.35,3.52-1.06,4.94c-.71,1.42-1.67,2.52-2.89,3.3-1.22.77-2.58,1.16-4.08,1.16-1.26,0-2.38-.26-3.34-.78s-1.72-1.2-2.27-2.02v11.22h-5.58V14.32h5.58v2.58c.54-.85,1.29-1.53,2.25-2.06ZM126.28,20.11c-.77-.79-1.72-1.19-2.86-1.19s-2.05.4-2.82,1.21c-.77.8-1.16,1.9-1.16,3.3s.39,2.49,1.16,3.3c.77.81,1.71,1.21,2.82,1.21s2.06-.41,2.84-1.22c.78-.82,1.17-1.92,1.17-3.31s-.39-2.48-1.16-3.28Z"/>
      <path className="cls-2" d="M147.36,9.72v1.89h-10.05v8.52h8.48v1.89h-8.48v10.51h-2.28V9.72h12.33Z"/>
      <path className="cls-2" d="M148.54,18.77c.73-1.38,1.74-2.45,3.03-3.2s2.76-1.13,4.39-1.13,3.16.39,4.39,1.17c1.23.78,2.12,1.78,2.66,3v-3.92h2.28v17.82h-2.28v-3.95c-.57,1.22-1.46,2.22-2.69,3.02-1.23.79-2.69,1.19-4.39,1.19s-3.06-.38-4.36-1.14c-1.29-.76-2.31-1.84-3.03-3.23-.73-1.39-1.09-3-1.09-4.83s.36-3.43,1.09-4.81ZM162.13,19.83c-.59-1.09-1.39-1.92-2.4-2.51-1.01-.59-2.13-.88-3.34-.88s-2.39.28-3.39.85c-1,.57-1.79,1.39-2.37,2.46s-.86,2.35-.86,3.83.29,2.74.86,3.83c.58,1.1,1.37,1.94,2.37,2.51,1,.58,2.13.86,3.39.86s2.33-.29,3.34-.88c1.01-.59,1.81-1.42,2.4-2.51.59-1.09.88-2.35.88-3.79s-.29-2.7-.88-3.79Z"/>
      <path className="cls-2" d="M168.1,18.77c.74-1.38,1.76-2.45,3.07-3.2,1.3-.75,2.79-1.13,4.47-1.13,2.2,0,4.01.54,5.43,1.63,1.42,1.09,2.34,2.57,2.76,4.44h-2.45c-.31-1.28-.96-2.29-1.97-3.02-1.01-.73-2.27-1.09-3.77-1.09-1.2,0-2.27.27-3.23.82-.96.54-1.71,1.35-2.27,2.43-.55,1.08-.83,2.4-.83,3.96s.28,2.89.83,3.98c.55,1.09,1.31,1.9,2.27,2.45.96.54,2.03.82,3.23.82,1.5,0,2.76-.36,3.77-1.09,1.01-.73,1.67-1.75,1.97-3.05h2.45c-.41,1.83-1.34,3.3-2.77,4.41-1.44,1.11-3.24,1.66-5.42,1.66-1.67,0-3.17-.38-4.47-1.13-1.31-.75-2.33-1.82-3.07-3.2-.74-1.38-1.11-3-1.11-4.85s.37-3.46,1.11-4.85Z"/>
      <path className="cls-2" d="M188.82,16.64v11.06c0,1.09.21,1.84.62,2.25.41.41,1.14.62,2.19.62h2.09v1.96h-2.45c-1.61,0-2.81-.38-3.59-1.13s-1.17-1.98-1.17-3.7v-11.06h-2.48v-1.92h2.48v-4.47h2.32v4.47h4.89v1.92h-4.89Z"/>
      <path className="cls-2" d="M198.12,31.66c-1.34-.75-2.39-1.82-3.17-3.2-.77-1.38-1.16-3-1.16-4.85s.39-3.46,1.17-4.85c.78-1.38,1.85-2.45,3.2-3.2s2.86-1.13,4.54-1.13,3.19.38,4.55,1.13,2.43,1.82,3.2,3.2c.77,1.38,1.16,3,1.16,4.85s-.39,3.44-1.17,4.83-1.86,2.46-3.23,3.21c-1.37.75-2.89,1.13-4.57,1.13s-3.18-.38-4.52-1.13ZM205.9,30c1-.53,1.81-1.34,2.43-2.41s.93-2.4.93-3.96-.3-2.89-.91-3.96c-.61-1.08-1.42-1.88-2.42-2.41-1-.53-2.09-.8-3.26-.8s-2.26.27-3.26.8c-1,.53-1.8,1.34-2.4,2.41-.6,1.08-.9,2.4-.9,3.96s.3,2.89.9,3.96c.6,1.08,1.39,1.88,2.38,2.41.99.53,2.07.8,3.25.8s2.26-.27,3.26-.8Z"/>
      <path className="cls-2" d="M218.18,15.3c1.03-.61,2.3-.91,3.8-.91v2.38h-.62c-1.65,0-2.98.45-3.98,1.34-1,.89-1.5,2.38-1.5,4.47v9.95h-2.28V14.71h2.28v3.17c.5-1.11,1.27-1.97,2.3-2.58Z"/>
      <path className="cls-2" d="M240.38,14.71l-10.57,26.2h-2.38l3.46-8.48-7.31-17.72h2.51l6.07,15.21,5.87-15.21h2.35Z"/>
    </g>
    <rect className="cls-1" x="41.65" y="17.28" width="5.23" height="5.23"/>
    <rect className="cls-1" x="32.84" y="16.01" width="2.19" height="2.19"/>
    <rect className="cls-1" x="25.83" y="20.43" width="3.61" height="3.61"/>
    <rect className="cls-1" x="47.25" y="10.85" width="2.19" height="2.19"/>
    <rect className="cls-1" x="50.34" y="32.17" width="2.19" height="2.19"/>
    <rect className="cls-1" x="59.84" y="22.23" width="2.19" height="2.19"/>
    <rect className="cls-1" x="55.59" y="34.2" width="3.61" height="3.61"/>
    <rect className="cls-1" x="45.45" y="2.29" width="3.61" height="3.61"/>
    <rect className="cls-1" x="50.34" y="24.24" width="4.44" height="4.44"/>
    <rect className="cls-1" x="56.49" y="5.9" width="4.44" height="4.44"/>
    <rect className="cls-1" x="52.93" y="16.34" width="2.66" height="2.66"/>
  </svg>
);

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
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl icon-bg-cyan flex items-center justify-center">
              <Zap className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-['Outfit']">NAPP Node</h1>
              <p className="text-slate-400">Operator Dashboard</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white font-['Outfit'] mb-4">
            Your node is <span className="gradient-text-cyan">earning</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-md">
            Join thousands of entrepreneurs running decentralized nodes as micro-businesses on Optio Blockchain Cloud.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-cyan-400">$2.4M+</p>
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
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl icon-bg-cyan flex items-center justify-center">
              <Zap className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Outfit']">NAPP Node</h1>
            </div>
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
                    className="pl-10 bg-black/40 border-white/10 focus:border-cyan-500/50 text-white"
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
                    className="pl-10 bg-black/40 border-white/10 focus:border-cyan-500/50 text-white"
                    required
                    data-testid="login-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full h-11"
                data-testid="login-submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium" data-testid="register-link">
                Start operating
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
