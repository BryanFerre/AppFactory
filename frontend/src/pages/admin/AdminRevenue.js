import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  Wallet, CreditCard, Package, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminRevenue() {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/revenue/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevenue(response.data);
    } catch (error) {
      toast.error('Failed to fetch revenue data');
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

  const totalCategoryRevenue = revenue?.by_category 
    ? Object.values(revenue.by_category).reduce((a, b) => a + b, 0) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">Revenue & Payouts</h1>
        <p className="text-slate-400 mt-1">Network-wide revenue analytics and payout management</p>
      </div>

      {/* Main Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">
                    ${revenue?.total_revenue?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+12.5% from last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-1">
                    ${revenue?.monthly_revenue?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-cyan-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>${revenue?.daily_average?.toLocaleString() || 0}/day avg</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Processed Payouts</p>
                  <p className="text-3xl font-bold text-purple-400 mt-1">
                    ${revenue?.processed_payouts?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-purple-400 text-sm">
                    <Wallet className="w-4 h-4" />
                    <span>To node operators</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Payouts</p>
                  <p className="text-3xl font-bold text-amber-400 mt-1">
                    ${revenue?.pending_payouts?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-amber-400 text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>Awaiting processing</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Revenue by Category & Top Apps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Revenue by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenue?.by_category && Object.entries(revenue.by_category).map(([category, amount], idx) => {
                const percent = (amount / totalCategoryRevenue) * 100;
                const colors = ['from-cyan-500 to-blue-500', 'from-purple-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500'];
                const textColors = ['text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-emerald-400'];
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{category}</span>
                      <span className={`font-bold ${textColors[idx % textColors.length]}`}>
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{percent.toFixed(1)}% of total</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Earning Apps */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Top Earning Apps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenue?.top_apps?.map((app, idx) => (
                <div key={app.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                    ${idx === 0 ? 'bg-amber-500/20 text-amber-400' : 
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' : 
                      idx === 2 ? 'bg-orange-700/20 text-orange-500' : 
                      'bg-white/5 text-slate-400'}`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{app.name}</p>
                    <p className="text-xs text-slate-500">Top performer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">${app.revenue?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">revenue</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Card */}
      <motion.div variants={item} initial="hidden" animate="show">
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Network Performance</h3>
                  <p className="text-slate-400">Platform is generating healthy revenue with consistent growth</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">
                    {((revenue?.processed_payouts || 0) / (revenue?.total_revenue || 1) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">Payout Ratio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {revenue?.top_apps?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Top Apps</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
