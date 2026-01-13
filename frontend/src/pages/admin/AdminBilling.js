import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  CreditCard, Search, Filter, DollarSign, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, ArrowUpRight,
  Receipt, Calendar, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const statusConfig = {
  completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  refunded: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: RefreshCw }
};

const typeColors = {
  subscription: 'bg-cyan-500/20 text-cyan-400',
  featured_listing: 'bg-purple-500/20 text-purple-400',
  payout: 'bg-emerald-500/20 text-emerald-400',
  refund: 'bg-red-500/20 text-red-400'
};

export default function AdminBilling() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_amount: 0,
    failed_payments: 0,
    refunds_this_month: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [statusFilter, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await axios.get(`${API}/billing/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.billing) {
        setStats({
          total_revenue: response.data.revenue?.total || 0,
          pending_amount: response.data.billing?.pending_payments || 0,
          failed_payments: response.data.billing?.failed_payments || 0,
          refunds_this_month: response.data.billing?.refunds || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    searchQuery === '' ||
    tx.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">Billing & Payments</h1>
        <p className="text-slate-400 mt-1">Manage subscriptions, payments, and refunds</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">${stats.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">${stats.pending_amount.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{stats.failed_payments}</p>
                <p className="text-xs text-slate-400">Failed Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">${stats.refunds_this_month.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Refunds (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or transaction ID..."
            className="pl-10 bg-black/40 border-white/10 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 bg-black/40 border-white/10">
            <Receipt className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="subscription">Subscriptions</SelectItem>
            <SelectItem value="featured_listing">Featured Listings</SelectItem>
            <SelectItem value="payout">Payouts</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-slate-400">Transactions will appear here as they occur</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const status = statusConfig[tx.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${status.color.split(' ')[0]} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${status.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{tx.description || tx.type}</p>
                            <Badge className={`${typeColors[tx.type] || 'bg-slate-500/20 text-slate-400'} text-xs`}>
                              {tx.type?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {tx.user_email || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(tx.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${tx.type === 'refund' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tx.type === 'refund' ? '-' : '+'}${tx.amount?.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">{tx.currency || 'USD'}</p>
                        </div>
                        <Badge className={`${status.color} border`}>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
