import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, Download, ArrowUpRight, ArrowDownRight, DollarSign, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${API}/earnings`);
      setEarnings(response.data);
    } catch (error) {
      console.error('Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            Earnings
          </h1>
          <p className="text-slate-400 mt-1">Track your revenue and OPT rewards</p>
        </div>
        <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
          data-testid="today-usd-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-slate-400">Today's Revenue</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">${earnings?.today_usd?.toFixed(2)}</p>
          <p className="text-sm text-slate-500">from subscriptions</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
          data-testid="today-opt-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            <p className="text-sm text-slate-400">Today's OPT Rewards</p>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{earnings?.today_opt_rewards?.toFixed(2)} <span className="text-lg">OPT</span></p>
          <p className="text-sm text-slate-500">from referrals</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
          data-testid="month-usd-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-slate-400">This Month (USD)</p>
          </div>
          <p className="text-3xl font-bold text-white">${earnings?.month_usd?.toFixed(2)}</p>
          <p className="text-sm text-slate-500">Week: ${earnings?.week_usd?.toFixed(2)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-slate-400">Total OPT Earned</p>
          </div>
          <p className="text-3xl font-bold text-purple-400">{earnings?.total_opt_rewards?.toFixed(0)} <span className="text-lg">OPT</span></p>
          <p className="text-sm text-slate-500">Lifetime rewards</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* USD Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white font-['Outfit']">Revenue (USD)</h2>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-28 bg-black/40 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10">
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earnings?.daily_history || []}>
                <defs>
                  <linearGradient id="usdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).getDate()}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F111A', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="usd" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#usdGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* OPT Rewards Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">OPT Rewards</h2>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earnings?.daily_history || []}>
                <defs>
                  <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).getDate()}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(value) => `${value} OPT`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F111A', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                  formatter={(value) => [`${value} OPT`, 'Rewards']}
                />
                <Area 
                  type="monotone" 
                  dataKey="opt_rewards" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#optGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Earnings by App */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Earnings by App</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">App</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Subscribers</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Daily Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Signups Driven</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">OPT Rewards</th>
              </tr>
            </thead>
            <tbody>
              {earnings?.earnings_by_app?.map((app, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg icon-bg-cyan flex items-center justify-center text-black font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white">{app.app_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">{app.subscribers?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">${app.usd?.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{app.signups_driven}</td>
                  <td className="py-3 px-4 text-right text-cyan-400 font-semibold">{app.opt_rewards?.toFixed(2)} OPT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
