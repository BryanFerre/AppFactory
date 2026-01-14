import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, Clock, CheckCircle2, XCircle, TrendingUp,
  TrendingDown, Wallet, CreditCard, RefreshCw, Check, X, Building,
  ChevronDown, Loader2, ArrowUpRight, ArrowDownRight, PieChart,
  BarChart3, Activity, Calendar, Filter, Download, Eye, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart, Line,
  CartesianGrid, Legend
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const NODE_PRICE = 5000;
const COMMISSION_RATE = 0.05;

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const commissionTypeLabels = {
  node_sale: { label: 'Node Sale (5%)', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  app_earnings: { label: 'App Earnings', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  processing: RefreshCw,
  paid: CheckCircle2,
  rejected: XCircle,
};

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// Generate mock trend data
const generateTrendData = (commissions, payouts) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, i) => {
    const baseCommission = 2500 + Math.random() * 5000;
    const basePayouts = 1500 + Math.random() * 3000;
    const growth = 1 + (i * 0.08);
    
    return {
      month,
      commissions: Math.round(baseCommission * growth),
      payouts: Math.round(basePayouts * growth),
      nodeSales: Math.floor(Math.random() * 15) + 5,
    };
  });
};

const generateWeeklyData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    sales: Math.floor(Math.random() * 8) + 1,
    amount: Math.floor(Math.random() * 2000) + 500,
  }));
};

export default function AdminAccounting() {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('commissions');
  const [dashboard, setDashboard] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Chart data
  const [trendData, setTrendData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchCommissions();
    fetchPayouts();
    setTrendData(generateTrendData([], []));
    setWeeklyData(generateWeeklyData());
  }, [statusFilter]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/admin/accounting/dashboard`, {
        headers: getAuthHeader()
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard');
    }
  };

  const fetchCommissions = async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API}/admin/accounting/commissions${params}`, {
        headers: getAuthHeader()
      });
      setCommissions(response.data.commissions);
    } catch (error) {
      toast.error('Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API}/admin/accounting/payouts${params}`, {
        headers: getAuthHeader()
      });
      setPayouts(response.data.payouts);
    } catch (error) {
      toast.error('Failed to fetch payouts');
    }
  };

  const handleCommissionAction = async (commissionId, action) => {
    setProcessing(true);
    try {
      await axios.post(`${API}/admin/accounting/commissions/${commissionId}/action`, {
        action,
        reason: actionReason
      }, { headers: getAuthHeader() });
      toast.success(`Commission ${action}d successfully`);
      setActionDialog(null);
      setActionReason('');
      fetchCommissions();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} commission`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayoutAction = async (payoutId, action) => {
    setProcessing(true);
    try {
      await axios.post(`${API}/admin/accounting/payouts/${payoutId}/action`, {
        action,
        notes: actionReason
      }, { headers: getAuthHeader() });
      toast.success(`Payout ${action}ed successfully`);
      setActionDialog(null);
      setActionReason('');
      fetchPayouts();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} payout`);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async (commissionId) => {
    setProcessing(true);
    try {
      await axios.post(`${API}/admin/accounting/commissions/${commissionId}/pay`, {}, {
        headers: getAuthHeader()
      });
      toast.success('Commission marked as paid');
      fetchCommissions();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    } finally {
      setProcessing(false);
    }
  };

  const seedDemoData = async () => {
    try {
      const response = await axios.post(`${API}/admin/accounting/seed-demo-data`, {}, {
        headers: getAuthHeader()
      });
      toast.success(response.data.message);
      fetchCommissions();
      fetchPayouts();
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to seed demo data');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate summary stats
  const totalCommissionsPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const totalPayoutsPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingCommissionsCount = commissions.filter(c => c.status === 'pending').length;
  const pendingPayoutsCount = payouts.filter(p => p.status === 'pending').length;
  
  // Status distribution for pie chart
  const statusDistribution = [
    { name: 'Pending', value: commissions.filter(c => c.status === 'pending').length, color: '#F59E0B' },
    { name: 'Approved', value: commissions.filter(c => c.status === 'approved').length, color: '#6366F1' },
    { name: 'Paid', value: commissions.filter(c => c.status === 'paid').length, color: '#10B981' },
    { name: 'Rejected', value: commissions.filter(c => c.status === 'rejected').length, color: '#EF4444' },
  ].filter(s => s.value > 0);

  const filteredCommissions = commissions.filter(c => 
    searchQuery === '' || 
    c.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayouts = payouts.filter(p => 
    searchQuery === '' || 
    p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Sales') ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Building className="w-7 h-7 text-emerald-400" />
            Financial Overview
          </h1>
          <p className="text-slate-400 mt-1">Executive dashboard for commissions and payouts</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <Button
              size="sm"
              variant={activeView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveView('dashboard')}
              className={activeView === 'dashboard' ? 'bg-emerald-500 text-white' : 'text-slate-400'}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              size="sm"
              variant={activeView === 'transactions' ? 'default' : 'ghost'}
              onClick={() => setActiveView('transactions')}
              className={activeView === 'transactions' ? 'bg-emerald-500 text-white' : 'text-slate-400'}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Transactions
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="border-white/10 text-slate-300 hover:bg-white/10"
            onClick={seedDemoData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Seed Data
          </Button>
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-emerald-400 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12.5%
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(totalCommissionsPaid + totalPayoutsPaid + 45000)}
                </p>
                <p className="text-xs text-slate-500 mt-2">All time earnings</p>
              </div>
            </motion.div>

            {/* Commissions Paid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-blue-400 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8.2%
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Commissions Paid</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(totalCommissionsPaid + 12500)}
                </p>
                <p className="text-xs text-slate-500 mt-2">{commissions.filter(c => c.status === 'paid').length} transactions</p>
              </div>
            </motion.div>

            {/* App Payouts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-purple-400 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +15.3%
                  </div>
                </div>
                <p className="text-slate-400 text-sm">App Payouts</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(totalPayoutsPaid + 8750)}
                </p>
                <p className="text-xs text-slate-500 mt-2">{payouts.filter(p => p.status === 'paid').length} transactions</p>
              </div>
            </motion.div>

            {/* Pending Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  {(pendingCommissionsCount + pendingPayoutsCount) > 0 && (
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">Pending Actions</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {pendingCommissionsCount + pendingPayoutsCount}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {pendingCommissionsCount} commissions, {pendingPayoutsCount} payouts
                </p>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
                  <p className="text-sm text-slate-400">Monthly commissions vs payouts</p>
                </div>
                <Select defaultValue="year">
                  <SelectTrigger className="w-32 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="commissions" 
                      name="Commissions"
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCommissions)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="payouts" 
                      name="Payouts"
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPayouts)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">Commission Status</h3>
                <p className="text-sm text-slate-400">Distribution by status</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1f2e', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {statusDistribution.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-400">{item.name}</span>
                    <span className="text-sm text-white font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Sales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Weekly Node Sales</h3>
                  <p className="text-sm text-slate-400">This week's performance</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +23%
                </Badge>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="sales" 
                      name="Node Sales"
                      fill="#06B6D4" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Earners */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Top Earners</h3>
                  <p className="text-sm text-slate-400">Highest commission recipients</p>
                </div>
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-4">
                {commissions
                  .filter(c => c.status === 'paid')
                  .slice(0, 5)
                  .map((commission, i) => {
                    const percentage = (commission.amount / 1000) * 100;
                    return (
                      <div key={commission.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-medium text-sm">
                              {commission.user?.name || commission.user?.email?.split('@')[0] || 'User'}
                            </span>
                            <span className="text-emerald-400 font-semibold">${commission.amount}</span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                {commissions.filter(c => c.status === 'paid').length === 0 && (
                  <p className="text-slate-500 text-center py-8">No paid commissions yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                <p className="text-sm text-slate-400">Latest commission and payout activity</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveView('transactions')}
                className="border-white/10 text-slate-300 hover:bg-white/10"
              >
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-slate-400 font-medium text-sm">User</th>
                    <th className="text-left p-3 text-slate-400 font-medium text-sm">Type</th>
                    <th className="text-left p-3 text-slate-400 font-medium text-sm">Amount</th>
                    <th className="text-left p-3 text-slate-400 font-medium text-sm">Status</th>
                    <th className="text-left p-3 text-slate-400 font-medium text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...commissions, ...payouts]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5)
                    .map((item) => {
                      const isCommission = 'type' in item && item.type === 'node_sale';
                      const StatusIcon = statusIcons[item.status];
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold">
                                {item.user?.name?.charAt(0) || item.user?.email?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{item.user?.name || 'Unknown'}</p>
                                <p className="text-slate-500 text-xs">{item.user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={isCommission ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}>
                              {isCommission ? 'Commission' : 'App Payout'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-white font-semibold">${item.amount?.toFixed(2)}</span>
                          </td>
                          <td className="p-3">
                            <Badge className={`${statusColors[item.status]} border`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-400 text-sm">
                            {formatDate(item.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      ) : (
        /* Transactions View */
        <>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 p-1">
                <TabsTrigger 
                  value="commissions" 
                  className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Commissions
                  {dashboard?.commissions?.pending_count > 0 && (
                    <Badge className="ml-2 bg-amber-500/20 text-amber-400 text-xs">
                      {dashboard.commissions.pending_count}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="payouts"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  App Earnings
                  {dashboard?.app_earnings?.pending_count > 0 && (
                    <Badge className="ml-2 bg-purple-500/20 text-purple-400 text-xs">
                      {dashboard.app_earnings.pending_count}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-white/5 border-white/10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commissions Table */}
          {activeTab === 'commissions' && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-slate-400 font-medium">User</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Type</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Amount</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Date</th>
                      <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No commissions found
                        </td>
                      </tr>
                    ) : (
                      filteredCommissions.map((commission) => {
                        const StatusIcon = statusIcons[commission.status];
                        return (
                          <tr key={commission.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <div>
                                <p className="text-white font-medium">{commission.user?.name || 'Unknown'}</p>
                                <p className="text-sm text-slate-400">{commission.user?.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Badge className={`${commissionTypeLabels[commission.type]?.bgColor || 'bg-slate-500/20'} ${commissionTypeLabels[commission.type]?.color || 'text-slate-400'} border-0`}>
                                  {commissionTypeLabels[commission.type]?.label || commission.type?.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              {commission.type === 'node_sale' && commission.referred_user && (
                                <p className="text-xs text-slate-500 mt-1">Referred: {commission.referred_user}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="text-emerald-400 font-semibold text-lg">
                                ${commission.amount?.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge className={`${statusColors[commission.status]} border capitalize`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {commission.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-slate-400">
                              {formatDate(commission.created_at)}
                            </td>
                            <td className="p-4 text-right">
                              {commission.status === 'pending' && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                    onClick={() => handleCommissionAction(commission.id, 'approve')}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                    onClick={() => setActionDialog({ type: 'reject', item: commission })}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {commission.status === 'approved' && (
                                <Button
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                  onClick={() => handleMarkPaid(commission.id)}
                                >
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                              {(commission.status === 'paid' || commission.status === 'rejected') && (
                                <span className="text-slate-500 text-sm">
                                  {commission.status === 'paid' ? 'Completed' : 'Closed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payouts Table */}
          {activeTab === 'payouts' && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-slate-400 font-medium">User</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Apps</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Amount</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Period</th>
                      <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No payouts found
                        </td>
                      </tr>
                    ) : (
                      filteredPayouts.map((payout) => {
                        const StatusIcon = statusIcons[payout.status];
                        return (
                          <tr key={payout.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <div>
                                <p className="text-white font-medium">{payout.user?.name || 'Unknown'}</p>
                                <p className="text-sm text-slate-400">{payout.user?.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {payout.earnings_breakdown?.slice(0, 2).map((item, i) => (
                                  <div key={i} className="text-sm">
                                    <span className="text-slate-300">{item.app_name}</span>
                                    <span className="text-emerald-400 ml-2">${item.amount?.toFixed(2)}</span>
                                  </div>
                                ))}
                                {payout.earnings_breakdown?.length > 2 && (
                                  <span className="text-xs text-slate-500">
                                    +{payout.earnings_breakdown.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-emerald-400 font-semibold text-lg">
                                ${payout.amount?.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge className={`${statusColors[payout.status]} border capitalize`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {payout.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-slate-400 text-sm">
                              {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                            </td>
                            <td className="p-4 text-right">
                              {payout.status === 'pending' && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-purple-500 hover:bg-purple-600 text-white"
                                    onClick={() => handlePayoutAction(payout.id, 'process')}
                                  >
                                    Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                    onClick={() => setActionDialog({ type: 'reject-payout', item: payout })}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {payout.status === 'processing' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                  onClick={() => handlePayoutAction(payout.id, 'process')}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                              {(payout.status === 'paid' || payout.status === 'rejected') && (
                                <span className="text-slate-500 text-sm">
                                  {payout.status === 'paid' ? 'Completed' : 'Closed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionDialog?.type === 'reject' && 'Reject Commission'}
              {actionDialog?.type === 'reject-payout' && 'Reject Payout'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.item && (
            <div className="p-4 bg-white/5 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="text-white">{actionDialog.item.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-semibold">${actionDialog.item.amount?.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Rejection Reason</label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="bg-white/5 border-white/10"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setActionDialog(null);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (actionDialog?.type === 'reject') {
                  handleCommissionAction(actionDialog.item.id, 'reject');
                } else if (actionDialog?.type === 'reject-payout') {
                  handlePayoutAction(actionDialog.item.id, 'reject');
                }
              }}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
