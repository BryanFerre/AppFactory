import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Copy, ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Wallet() {
  const { user } = useAuth();

  const copyAddress = () => {
    navigator.clipboard.writeText(user?.wallet_address || '');
    toast.success('Wallet address copied!');
  };

  const transactions = [
    { type: 'receive', amount: 125.5, from: 'Node Payout', date: '2024-01-12', status: 'completed' },
    { type: 'receive', amount: 98.3, from: 'Referral Bonus', date: '2024-01-10', status: 'completed' },
    { type: 'send', amount: 50.0, to: 'Exchange', date: '2024-01-08', status: 'completed' },
    { type: 'receive', amount: 112.7, from: 'Node Payout', date: '2024-01-05', status: 'completed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <WalletIcon className="w-8 h-8 text-cyan-400" />
          Wallet
        </h1>
        <p className="text-slate-400 mt-1">Manage your OPT tokens</p>
      </div>

      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
        
        <div className="relative">
          <p className="text-slate-400 mb-2">Total Balance</p>
          <p className="text-5xl font-bold text-white mb-1">1,247.80 <span className="text-2xl text-cyan-400">OPT</span></p>
          <p className="text-xl text-slate-400">≈ $1,060.63 USD</p>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full px-6">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-6">
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Receive
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Wallet Address */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Wallet Address</h2>
        <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
          <p className="flex-1 font-mono text-slate-300 text-sm truncate">{user?.wallet_address}</p>
          <Button variant="ghost" size="icon" onClick={copyAddress}>
            <Copy className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon">
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Recent Transactions</h2>
        
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'receive' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  {tx.type === 'receive' ? (
                    <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {tx.type === 'receive' ? tx.from : `To ${tx.to}`}
                  </p>
                  <p className="text-sm text-slate-400">{tx.date}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${tx.type === 'receive' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'receive' ? '+' : '-'}{tx.amount} OPT
                </p>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
