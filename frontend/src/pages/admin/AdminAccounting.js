import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Search, Filter, ArrowUpDown, MoreHorizontal,
  Wallet, TrendingUp, CreditCard, FileText, RefreshCw, Check,
  X, Building, ChevronDown, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Get auth header for admin requests
const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const NODE_PRICE = 5000;
const COMMISSION_RATE = 0.05; // 5%

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

export default function AdminAccounting() {
  const [activeTab, setActiveTab] = useState('commissions');
  const [dashboard, setDashboard] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  
  // Action dialog state
  const [actionDialog, setActionDialog] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchCommissions();
    fetchPayouts();
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
      });
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
      });
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

  const handleBulkCommissionAction = async (action) => {
    if (selectedCommissions.length === 0) {
      toast.error('No commissions selected');
      return;
    }
    
    setProcessing(true);
    try {
      await axios.post(`${API}/admin/accounting/commissions/bulk-action`, {
        commission_ids: selectedCommissions,
        action,
        reason: actionReason
      });
      toast.success(`${selectedCommissions.length} commissions ${action}d`);
      setSelectedCommissions([]);
      setActionDialog(null);
      setActionReason('');
      fetchCommissions();
      fetchDashboard();
    } catch (error) {
      toast.error('Bulk action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPayoutAction = async (action) => {
    if (selectedPayouts.length === 0) {
      toast.error('No payouts selected');
      return;
    }
    
    setProcessing(true);
    try {
      await axios.post(`${API}/admin/accounting/payouts/bulk-action`, {
        payout_ids: selectedPayouts,
        action,
        notes: actionReason
      });
      toast.success(`${selectedPayouts.length} payouts ${action}ed`);
      setSelectedPayouts([]);
      setActionDialog(null);
      setActionReason('');
      fetchPayouts();
      fetchDashboard();
    } catch (error) {
      toast.error('Bulk action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async (commissionId) => {
    setProcessing(true);
    try {
      await axios.post(`${API}/admin/accounting/commissions/${commissionId}/pay`);
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
      const response = await axios.post(`${API}/admin/accounting/seed-demo-data`);
      toast.success(response.data.message);
      fetchCommissions();
      fetchPayouts();
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to seed demo data');
    }
  };

  const toggleCommissionSelection = (id) => {
    setSelectedCommissions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const togglePayoutSelection = (id) => {
    setSelectedPayouts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllCommissions = () => {
    const pendingIds = commissions.filter(c => c.status === 'pending').map(c => c.id);
    setSelectedCommissions(prev => 
      prev.length === pendingIds.length ? [] : pendingIds
    );
  };

  const selectAllPayouts = () => {
    const pendingIds = payouts.filter(p => p.status === 'pending').map(p => p.id);
    setSelectedPayouts(prev => 
      prev.length === pendingIds.length ? [] : pendingIds
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Building className="w-7 h-7 text-emerald-400" />
            Accounting
          </h1>
          <p className="text-slate-400 mt-1">Manage commissions and app earnings payouts</p>
        </div>
        
        <Button
          variant="outline"
          className="border-white/10 text-slate-300 hover:bg-white/10"
          onClick={seedDemoData}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Seed Demo Data
        </Button>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-slate-400">Pending Commissions</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboard.commissions.pending_count}</p>
            <p className="text-sm text-amber-400">${dashboard.commissions.pending_amount.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">Approved (Awaiting Pay)</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboard.commissions.approved_awaiting_payment}</p>
            <p className="text-sm text-slate-500">Ready for payment</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">Pending App Payouts</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboard.app_earnings.pending_count}</p>
            <p className="text-sm text-purple-400">${dashboard.app_earnings.pending_amount.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-400">Paid This Month</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              ${(dashboard.commissions.paid_this_month + dashboard.app_earnings.paid_this_month).toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">Commissions + App Earnings</p>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <TabsList className="bg-white/5 p-1">
            <TabsTrigger 
              value="commissions" 
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Commissions
              {dashboard?.commissions.pending_count > 0 && (
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
              {dashboard?.app_earnings.pending_count > 0 && (
                <Badge className="ml-2 bg-purple-500/20 text-purple-400 text-xs">
                  {dashboard.app_earnings.pending_count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
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

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          {/* Bulk Actions */}
          {selectedCommissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex items-center justify-between"
            >
              <span className="text-white font-medium">
                {selectedCommissions.length} commission(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => setActionDialog({ type: 'bulk-approve-commissions' })}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  onClick={() => setActionDialog({ type: 'bulk-reject-commissions' })}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400"
                  onClick={() => setSelectedCommissions([])}
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}

          {/* Commissions List */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-slate-400 font-medium">
                      <Checkbox
                        checked={selectedCommissions.length === commissions.filter(c => c.status === 'pending').length && commissions.filter(c => c.status === 'pending').length > 0}
                        onCheckedChange={selectAllCommissions}
                      />
                    </th>
                    <th className="text-left p-4 text-slate-400 font-medium">User</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Type</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Amount</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Date</th>
                    <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No commissions found
                      </td>
                    </tr>
                  ) : (
                    filteredCommissions.map((commission) => {
                      const StatusIcon = statusIcons[commission.status];
                      return (
                        <tr key={commission.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            {commission.status === 'pending' && (
                              <Checkbox
                                checked={selectedCommissions.includes(commission.id)}
                                onCheckedChange={() => toggleCommissionSelection(commission.id)}
                              />
                            )}
                          </td>
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
                                  onClick={() => setActionDialog({ type: 'approve', item: commission })}
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
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          {/* Bulk Actions */}
          {selectedPayouts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex items-center justify-between"
            >
              <span className="text-white font-medium">
                {selectedPayouts.length} payout(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={() => setActionDialog({ type: 'bulk-process-payouts' })}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Process All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  onClick={() => setActionDialog({ type: 'bulk-reject-payouts' })}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400"
                  onClick={() => setSelectedPayouts([])}
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}

          {/* Payouts List */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-slate-400 font-medium">
                      <Checkbox
                        checked={selectedPayouts.length === payouts.filter(p => p.status === 'pending').length && payouts.filter(p => p.status === 'pending').length > 0}
                        onCheckedChange={selectAllPayouts}
                      />
                    </th>
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
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No payouts found
                      </td>
                    </tr>
                  ) : (
                    filteredPayouts.map((payout) => {
                      const StatusIcon = statusIcons[payout.status];
                      return (
                        <tr key={payout.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            {payout.status === 'pending' && (
                              <Checkbox
                                checked={selectedPayouts.includes(payout.id)}
                                onCheckedChange={() => togglePayoutSelection(payout.id)}
                              />
                            )}
                          </td>
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
                                  onClick={() => setActionDialog({ type: 'process-payout', item: payout })}
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
                                onClick={() => setActionDialog({ type: 'complete-payout', item: payout })}
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
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionDialog?.type === 'approve' && 'Approve Commission'}
              {actionDialog?.type === 'reject' && 'Reject Commission'}
              {actionDialog?.type === 'bulk-approve-commissions' && `Approve ${selectedCommissions.length} Commissions`}
              {actionDialog?.type === 'bulk-reject-commissions' && `Reject ${selectedCommissions.length} Commissions`}
              {actionDialog?.type === 'process-payout' && 'Process Payout'}
              {actionDialog?.type === 'reject-payout' && 'Reject Payout'}
              {actionDialog?.type === 'complete-payout' && 'Complete Payout'}
              {actionDialog?.type === 'bulk-process-payouts' && `Process ${selectedPayouts.length} Payouts`}
              {actionDialog?.type === 'bulk-reject-payouts' && `Reject ${selectedPayouts.length} Payouts`}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionDialog?.type?.includes('approve') && 'This will approve the commission for payment.'}
              {actionDialog?.type?.includes('reject') && 'Please provide a reason for rejection.'}
              {actionDialog?.type?.includes('process') && 'This will mark the payout as processing.'}
              {actionDialog?.type?.includes('complete') && 'This will mark the payout as paid.'}
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

          {(actionDialog?.type?.includes('reject') || actionDialog?.type?.includes('complete')) && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">
                {actionDialog?.type?.includes('reject') ? 'Rejection Reason' : 'Payment Notes'} (optional)
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={actionDialog?.type?.includes('reject') ? 'Enter reason for rejection...' : 'Enter payment reference or notes...'}
                className="bg-white/5 border-white/10"
              />
            </div>
          )}

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
              className={
                actionDialog?.type?.includes('reject') 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : actionDialog?.type?.includes('payout')
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }
              onClick={() => {
                if (actionDialog?.type === 'approve') {
                  handleCommissionAction(actionDialog.item.id, 'approve');
                } else if (actionDialog?.type === 'reject') {
                  handleCommissionAction(actionDialog.item.id, 'reject');
                } else if (actionDialog?.type === 'bulk-approve-commissions') {
                  handleBulkCommissionAction('approve');
                } else if (actionDialog?.type === 'bulk-reject-commissions') {
                  handleBulkCommissionAction('reject');
                } else if (actionDialog?.type === 'process-payout' || actionDialog?.type === 'complete-payout') {
                  handlePayoutAction(actionDialog.item.id, 'process');
                } else if (actionDialog?.type === 'reject-payout') {
                  handlePayoutAction(actionDialog.item.id, 'reject');
                } else if (actionDialog?.type === 'bulk-process-payouts') {
                  handleBulkPayoutAction('process');
                } else if (actionDialog?.type === 'bulk-reject-payouts') {
                  handleBulkPayoutAction('reject');
                }
              }}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
