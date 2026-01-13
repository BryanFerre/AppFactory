import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Wallet, ExternalLink, CheckCircle2, Clock, ArrowUpRight,
  Copy, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await axios.get(`${API}/payouts`);
      setPayouts(response.data);
    } catch (error) {
      console.error('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const copyTxHash = (hash) => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPaid = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount_opt, 0);
  const pendingAmount = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount_opt, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Wallet className="w-8 h-8 text-cyan-400" />
            Payouts
          </h1>
          <p className="text-slate-400 mt-1">Track your earnings and withdrawals</p>
        </div>
        <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
          <Download className="w-4 h-4 mr-2" />
          Export History
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Total Received</p>
          <p className="text-3xl font-bold text-emerald-400">{totalPaid.toFixed(2)} OPT</p>
          <p className="text-sm text-slate-500">${(totalPaid * 0.85).toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Pending</p>
          <p className="text-3xl font-bold text-amber-400">{pendingAmount.toFixed(2)} OPT</p>
          <p className="text-sm text-slate-500">${(pendingAmount * 0.85).toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Next Payout</p>
          <p className="text-xl font-bold text-white">Weekly (Fridays)</p>
          <p className="text-sm text-cyan-400">Auto-transferred to wallet</p>
        </motion.div>
      </div>

      {/* Payout History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Payout History</h2>
        
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div 
              key={payout.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 rounded-xl p-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  payout.status === 'completed' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}>
                  {payout.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{payout.date}</p>
                  <p className="text-sm text-slate-400">
                    {payout.status === 'completed' ? 'Completed' : 'Processing'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-semibold text-white">{payout.amount_opt.toFixed(2)} OPT</p>
                  <p className="text-sm text-slate-400">${payout.amount_usd.toFixed(2)}</p>
                </div>

                {payout.tx_hash && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyTxHash(payout.tx_hash)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://etherscan.io/tx/${payout.tx_hash}`, '_blank')}
                      className="text-slate-400 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Badge className={`${
                  payout.status === 'completed' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {payout.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
