import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Package, Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle,
  Eye, Github, Mail, DollarSign, Server, HardDrive, FileText, ExternalLink,
  ChevronRight, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const statusConfig = {
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending Review' },
  approved: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Rejected' },
  needs_revision: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: AlertTriangle, label: 'Needs Revision' }
};

export default function AdminAppSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [complianceNotes, setComplianceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/apps/submissions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data.submissions);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppDetail = async (submissionId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/apps/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedApp(response.data);
    } catch (error) {
      toast.error('Failed to fetch app details');
    }
  };

  const handleReview = async () => {
    if (!reviewAction) {
      toast.error('Please select an action');
      return;
    }
    if ((reviewAction === 'reject' || reviewAction === 'request_changes') && !reviewReason) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/apps/submissions/${reviewDialog.id}/review`, {
        action: reviewAction,
        reason: reviewReason || null,
        compliance_notes: complianceNotes || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`App ${reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'sent back for revision'}`);
      setReviewDialog(null);
      setReviewAction('');
      setReviewReason('');
      setComplianceNotes('');
      setSelectedApp(null);
      fetchSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => 
    searchQuery === '' || 
    sub.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.developer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">App Submissions</h1>
          <p className="text-slate-400 mt-1">Review and manage app submissions for the App Marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1">
            {submissions.filter(s => s.status === 'pending').length} pending review
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps or developers..."
            className="pl-10 bg-black/40 border-white/10 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-black/40 border-white/10">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No submissions found</h3>
            <p className="text-slate-400">No app submissions match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const status = statusConfig[submission.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* App Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30 shrink-0">
                          <Package className="w-7 h-7 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{submission.app_name}</h3>
                            <Badge className={`${status.color} border text-xs`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            <Badge className="bg-slate-500/20 text-slate-400 text-xs">
                              {submission.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{submission.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {submission.developer?.email || submission.contact_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${submission.monthly_subscription_fee}/mo
                            </span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {submission.resources_required} GB
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchAppDetail(submission.id)}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {submission.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewDialog(submission);
                              setReviewAction('');
                              setReviewReason('');
                            }}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black"
                          >
                            Review
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* App Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              {selectedApp?.app_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Full submission details and review history
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge className={`${statusConfig[selectedApp.status]?.color || 'bg-slate-500/20 text-slate-400'} border px-3 py-1`}>
                  {statusConfig[selectedApp.status]?.label || selectedApp.status}
                </Badge>
                <span className="text-sm text-slate-500">
                  Submitted {new Date(selectedApp.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Description */}
              <div>
                <Label className="text-slate-400 text-xs uppercase">Description</Label>
                <p className="text-white mt-1">{selectedApp.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <Label className="text-slate-400 text-xs">Category</Label>
                  <p className="text-white font-medium">{selectedApp.category}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Label className="text-slate-400 text-xs">Resources Required</Label>
                  <p className="text-white font-medium">{selectedApp.resources_required} GB</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Label className="text-slate-400 text-xs">Subscription Price</Label>
                  <p className="text-emerald-400 font-medium">${selectedApp.monthly_subscription_fee}/mo</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Label className="text-slate-400 text-xs">Revenue Share</Label>
                  <p className="text-white font-medium">{selectedApp.revenue_sharing}%</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Label className="text-slate-400 text-xs">Nodes Available</Label>
                  <p className="text-white font-medium">{selectedApp.nodes_available}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <Label className="text-slate-400 text-xs">Contact Email</Label>
                  <p className="text-white font-medium">{selectedApp.contact_email}</p>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2">
                {selectedApp.github_url && (
                  <a 
                    href={selectedApp.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                  >
                    <Github className="w-4 h-4" />
                    {selectedApp.github_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedApp.documentation_url && (
                  <a 
                    href={selectedApp.documentation_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                  >
                    <FileText className="w-4 h-4" />
                    {selectedApp.documentation_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Developer Info */}
              {selectedApp.developer && (
                <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <Label className="text-cyan-400 text-xs uppercase">Developer</Label>
                  <p className="text-white font-medium mt-1">{selectedApp.developer.name}</p>
                  <p className="text-slate-400 text-sm">{selectedApp.developer.email}</p>
                </div>
              )}

              {/* Review History */}
              {selectedApp.review_history?.length > 0 && (
                <div>
                  <Label className="text-slate-400 text-xs uppercase">Review History</Label>
                  <div className="mt-2 space-y-2">
                    {selectedApp.review_history.map((review, idx) => (
                      <div key={idx} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <Badge className={`${statusConfig[review.action === 'approve' ? 'approved' : review.action === 'reject' ? 'rejected' : 'needs_revision']?.color || ''} text-xs`}>
                            {review.action}
                          </Badge>
                          <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleString()}</span>
                        </div>
                        {review.reason && <p className="text-sm text-slate-300 mt-2">{review.reason}</p>}
                        <p className="text-xs text-slate-500 mt-1">By: {review.admin_email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedApp(null)}>Close</Button>
            {selectedApp?.status === 'pending' && (
              <Button 
                onClick={() => {
                  setReviewDialog(selectedApp);
                  setSelectedApp(null);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black"
              >
                Review This App
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl">
              Review: {reviewDialog?.app_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select an action and provide feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Action Selection */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setReviewAction('approve')}
                className={`h-auto py-4 flex flex-col gap-2 ${
                  reviewAction === 'approve' 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'border-white/10 hover:bg-emerald-500/10'
                }`}
              >
                <CheckCircle className="w-6 h-6" />
                <span className="text-xs">Approve</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setReviewAction('request_changes')}
                className={`h-auto py-4 flex flex-col gap-2 ${
                  reviewAction === 'request_changes' 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                    : 'border-white/10 hover:bg-amber-500/10'
                }`}
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs">Request Changes</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setReviewAction('reject')}
                className={`h-auto py-4 flex flex-col gap-2 ${
                  reviewAction === 'reject' 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'border-white/10 hover:bg-red-500/10'
                }`}
              >
                <XCircle className="w-6 h-6" />
                <span className="text-xs">Reject</span>
              </Button>
            </div>

            {/* Reason (required for reject/request_changes) */}
            {(reviewAction === 'reject' || reviewAction === 'request_changes') && (
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Reason <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Explain why the app is being rejected or what changes are needed..."
                  className="bg-black/40 border-white/10 text-white min-h-[100px]"
                />
              </div>
            )}

            {/* Compliance Notes (optional) */}
            <div className="space-y-2">
              <Label className="text-slate-300">Compliance Notes (optional)</Label>
              <Textarea
                value={complianceNotes}
                onChange={(e) => setComplianceNotes(e.target.value)}
                placeholder="Internal compliance notes..."
                className="bg-black/40 border-white/10 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button 
              onClick={handleReview}
              disabled={submitting || !reviewAction}
              className={`${
                reviewAction === 'approve' ? 'bg-emerald-500 hover:bg-emerald-400' :
                reviewAction === 'reject' ? 'bg-red-500 hover:bg-red-400' :
                'bg-amber-500 hover:bg-amber-400'
              } text-black font-semibold`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                `Confirm ${reviewAction === 'approve' ? 'Approval' : reviewAction === 'reject' ? 'Rejection' : 'Request'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
