import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Server, Search, Filter, Key, User, Mail, Calendar,
  CheckCircle, XCircle, Loader2, MoreVertical, Shield,
  AlertTriangle, Eye, Ban, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  active: { 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
    icon: CheckCircle,
    label: 'Active'
  },
  suspended: { 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
    icon: AlertTriangle,
    label: 'Suspended'
  },
  revoked: { 
    color: 'bg-red-500/20 text-red-400 border-red-500/30', 
    icon: XCircle,
    label: 'Revoked'
  }
};

export default function AdminNodes() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ active: 0, suspended: 0, revoked: 0 });
  
  // Modal states
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, [statusFilter]);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '500');
      
      const response = await axios.get(`${API}/admin/licenses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLicenses(response.data.licenses);
      setTotal(response.data.total);
      
      // Calculate stats
      const allLicenses = response.data.licenses;
      setStats({
        active: allLicenses.filter(l => l.status === 'active').length,
        suspended: allLicenses.filter(l => l.status === 'suspended').length,
        revoked: allLicenses.filter(l => l.status === 'revoked').length
      });
    } catch (error) {
      toast.error('Failed to fetch licenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedLicense) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/licenses/${selectedLicense.id}/status`,
        { status, reason: deactivateReason || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`License ${status === 'active' ? 'activated' : status}`);
      setShowDeactivateDialog(false);
      setDeactivateReason('');
      setSelectedLicense(null);
      fetchLicenses();
    } catch (error) {
      toast.error('Failed to update license status');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openDeactivateDialog = (license, action) => {
    setSelectedLicense({ ...license, targetStatus: action });
    setDeactivateReason('');
    setShowDeactivateDialog(true);
  };

  const openDetailsModal = (license) => {
    setSelectedLicense(license);
    setShowDetailsModal(true);
  };

  // Filter licenses based on search
  const filteredLicenses = licenses.filter(license => {
    const searchLower = searchQuery.toLowerCase();
    return (
      license.license_key?.toLowerCase().includes(searchLower) ||
      license.user_name?.toLowerCase().includes(searchLower) ||
      license.user_email?.toLowerCase().includes(searchLower) ||
      license.id?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
            <Server className="w-7 h-7 text-cyan-400" />
            Licensed Nodes
          </h1>
          <p className="text-slate-400 mt-1">Manage CloudNode licenses and operators</p>
        </div>
        
        <Button
          onClick={fetchLicenses}
          variant="outline"
          className="border-white/10 text-slate-300 hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Licenses</p>
              <p className="text-2xl font-bold text-white">{total}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Suspended</p>
              <p className="text-2xl font-bold text-white">{stats.suspended}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Revoked</p>
              <p className="text-2xl font-bold text-white">{stats.revoked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by name, email, or license key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Licenses Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">License Key</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Operator</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Email</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Issue Date</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Status</th>
                <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((license) => {
                const status = statusConfig[license.status] || statusConfig.active;
                const StatusIcon = status.icon;
                
                return (
                  <tr key={license.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-cyan-400" />
                        <code className="text-cyan-400 font-mono text-sm">
                          {license.license_key}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {license.user_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-white font-medium">{license.user_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span>{license.user_email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(license.issue_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${status.color} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card border-white/10">
                            <DropdownMenuItem
                              onClick={() => openDetailsModal(license)}
                              className="text-slate-300 hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            {license.status === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => openDeactivateDialog(license, 'suspended')}
                                  className="text-amber-400 hover:text-amber-300"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Suspend License
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeactivateDialog(license, 'revoked')}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Revoke License
                                </DropdownMenuItem>
                              </>
                            )}
                            {license.status === 'suspended' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLicense(license);
                                    handleStatusChange('active');
                                  }}
                                  className="text-emerald-400 hover:text-emerald-300"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivate License
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeactivateDialog(license, 'revoked')}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Revoke License
                                </DropdownMenuItem>
                              </>
                            )}
                            {license.status === 'revoked' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedLicense(license);
                                  handleStatusChange('active');
                                }}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reactivate License
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLicenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">
                      {searchQuery ? 'No licenses found matching your search' : 'No licenses found'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* License Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-[#0F1420] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              License Details
            </DialogTitle>
          </DialogHeader>

          {selectedLicense && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">License Key</p>
                  <code className="text-cyan-400 font-mono">{selectedLicense.license_key}</code>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">License ID</p>
                  <code className="text-slate-400 font-mono text-sm">{selectedLicense.id}</code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Operator Name</p>
                  <p className="text-white font-medium">{selectedLicense.user_name || 'N/A'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-white">{selectedLicense.user_email || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Issue Date</p>
                  <p className="text-white">{formatDate(selectedLicense.issue_date)}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Purchase Date</p>
                  <p className="text-white">{formatDate(selectedLicense.purchase_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">License Type</p>
                  <p className="text-white capitalize">{selectedLicense.license_type || 'Lifetime'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <Badge className={`${statusConfig[selectedLicense.status]?.color} border`}>
                    {statusConfig[selectedLicense.status]?.label || selectedLicense.status}
                  </Badge>
                </div>
              </div>

              {selectedLicense.status_reason && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-400 mb-1">Status Reason</p>
                  <p className="text-slate-300">{selectedLicense.status_reason}</p>
                </div>
              )}

              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Product</p>
                <p className="text-white">{selectedLicense.product_name || selectedLicense.metadata?.product_name || 'CloudNode'}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDetailsModal(false)}
              className="text-slate-400"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent className="bg-[#0F1420] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {selectedLicense?.targetStatus === 'suspended' ? 'Suspend' : 'Revoke'} License
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to {selectedLicense?.targetStatus === 'suspended' ? 'suspend' : 'revoke'} this license?
              <br />
              <strong className="text-cyan-400 font-mono">{selectedLicense?.license_key}</strong>
              <br /><br />
              {selectedLicense?.targetStatus === 'suspended' 
                ? 'The operator will lose access until the license is reactivated.'
                : 'This action will permanently disable the license. You can reactivate it later if needed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Reason (optional)
            </label>
            <Textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Enter reason for this action..."
              className="bg-white/5 border-white/10"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange(selectedLicense?.targetStatus)}
              disabled={actionLoading}
              className={selectedLicense?.targetStatus === 'suspended' 
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-red-500 text-white hover:bg-red-600'}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                selectedLicense?.targetStatus === 'suspended' ? 'Suspend License' : 'Revoke License'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
