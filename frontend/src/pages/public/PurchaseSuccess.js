import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  CheckCircle2, Loader2, Copy, Check, ArrowRight,
  Cloud, Key, Mail, Lock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [purchaseData, setPurchaseData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (sessionId) {
      verifyPurchase();
    } else {
      setStatus('error');
      setError('Invalid session. Please contact support.');
    }
  }, [sessionId]);

  const verifyPurchase = async () => {
    try {
      const response = await axios.post(`${API}/api/purchase/verify`, {
        session_id: sessionId
      });

      setPurchaseData(response.data);
      setStatus('success');

      // Store token and login
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Trigger auth context update
        setTimeout(() => {
          login(response.data.token);
        }, 100);
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.detail || 'Failed to verify purchase. Please contact support.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToDashboard = () => {
    navigate('/');
    window.location.reload(); // Force reload to update auth state
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Verifying Your Purchase</h2>
          <p className="text-slate-400">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Something Went Wrong</h2>
          <p className="text-slate-400 mb-8">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-white/10 text-white hover:bg-white/20"
            >
              Return to Home
            </Button>
            <p className="text-sm text-slate-500">
              Need help? Contact support@optio.cloud
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Optio Cloud!
          </h1>
          <p className="text-slate-400">
            Your CloudNode purchase is complete. Here are your account details.
          </p>
        </div>

        {/* Account Details Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-6">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Optio CloudNode</h3>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                  License Activated
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-white/5 rounded-lg text-white font-mono text-sm">
                  {purchaseData?.user?.email}
                </div>
              </div>
            </div>

            {/* Temporary Password (if new user) */}
            {purchaseData?.is_new_user && purchaseData?.temp_password && (
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <Lock className="w-4 h-4" />
                  Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-white/5 rounded-lg text-white font-mono text-sm">
                    {purchaseData.temp_password}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(purchaseData.temp_password)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-amber-400 mt-2">
                  ⚠️ Please save this password! You&apos;ll need it to log in. We recommend changing it in settings.
                </p>
              </div>
            )}

            {/* License Key */}
            {purchaseData?.license && (
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <Key className="w-4 h-4" />
                  License Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-white/5 rounded-lg text-cyan-400 font-mono text-sm tracking-wider">
                    {purchaseData.license.license_key}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(purchaseData.license.license_key)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6 mb-6">
          <h4 className="text-white font-semibold mb-3">What&apos;s Next?</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <span>Access your dashboard to monitor node performance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <span>Your CloudNode is automatically configured and earning</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <span>View your license in the dashboard sidebar</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={goToDashboard}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-6 hover:from-cyan-600 hover:to-blue-600"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-center text-sm text-slate-500">
            A confirmation email has been sent to your inbox
          </p>
        </div>
      </motion.div>
    </div>
  );
}
