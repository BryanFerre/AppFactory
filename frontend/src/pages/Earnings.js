import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

  const weekChange = earnings?.week_opt > 0 ? ((earnings?.today_opt * 7 / earnings?.week_opt - 1) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            Earnings
          </h1>
          <p className="text-slate-400 mt-1">Track your node's revenue performance</p>
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
          data-testid="today-earnings-card"
        >
          <p className="text-sm text-slate-400 mb-2">Today's Earnings</p>
          <p className="text-3xl font-bold text-white">{earnings?.today_opt.toFixed(2)} <span className="text-lg text-cyan-400">OPT</span></p>
          <p className="text-sm text-slate-500">${earnings?.today_usd.toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
          data-testid="week-earnings-card"
        >
          <p className="text-sm text-slate-400 mb-2">This Week</p>
          <p className="text-3xl font-bold text-white">{earnings?.week_opt.toFixed(2)} <span className="text-lg text-purple-400">OPT</span></p>
          <p className="text-sm text-slate-500">${earnings?.week_usd.toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
          data-testid="month-earnings-card"
        >
          <p className="text-sm text-slate-400 mb-2">This Month</p>
          <p className="text-3xl font-bold text-white">{earnings?.month_opt.toFixed(2)} <span className="text-lg text-emerald-400">OPT</span></p>
          <p className="text-sm text-slate-500">${earnings?.month_usd.toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Weekly Trend</p>
          <div className="flex items-center gap-2">
            {parseFloat(weekChange) >= 0 ? (
              <>
                <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">+{weekChange}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-6 h-6 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{weekChange}%</span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-500">vs last week</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Earnings Over Time</h2>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-black/40 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={earnings?.daily_history || []}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                  borderRadius: '12px',
                  padding: '12px'
                }}
                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                formatter={(value, name) => [`${value} OPT ($${(value * 0.85).toFixed(2)})`, 'Earnings']}
              />
              <Area 
                type="monotone" 
                dataKey="opt" 
                stroke="#06B6D4" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#earningsGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Earnings by App */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Earnings by App</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings?.earnings_by_app || []} layout="vertical">
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis type="category" dataKey="app_name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F111A', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value} OPT`, 'Daily Revenue']}
                />
                <Bar dataKey="opt" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* List */}
          <div className="space-y-3">
            {earnings?.earnings_by_app.map((app, index) => (
              <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg icon-bg-cyan flex items-center justify-center text-black font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-white">{app.app_name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-cyan-400">{app.opt.toFixed(2)} OPT</p>
                  <p className="text-sm text-slate-500">${app.usd.toFixed(2)}/day</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
