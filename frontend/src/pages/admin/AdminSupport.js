import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  HeadphonesIcon, Search, Filter, MessageSquare, User, Calendar,
  AlertCircle, CheckCircle2, Clock, XCircle, ChevronRight, Send,
  Tag, Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const statusConfig = {
  open: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertCircle, label: 'Open' },
  in_progress: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Clock, label: 'In Progress' },
  resolved: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Resolved' },
  closed: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle, label: 'Closed' }
};

const priorityConfig = {
  low: { color: 'bg-slate-500/20 text-slate-400', label: 'Low' },
  medium: { color: 'bg-blue-500/20 text-blue-400', label: 'Medium' },
  high: { color: 'bg-amber-500/20 text-amber-400', label: 'High' },
  urgent: { color: 'bg-red-500/20 text-red-400', label: 'Urgent' }
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0 });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await axios.get(`${API}/support/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ticketList = response.data.tickets || [];
      setTickets(ticketList);
      
      // Calculate stats
      setStats({
        open: ticketList.filter(t => t.status === 'open').length,
        in_progress: ticketList.filter(t => t.status === 'in_progress').length,
        resolved: ticketList.filter(t => t.status === 'resolved').length
      });
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(`${API}/support/tickets/${updateDialog.id}`, {
        status: newStatus,
        response: responseMessage || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Ticket updated successfully');
      setUpdateDialog(null);
      setNewStatus('');
      setResponseMessage('');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    searchQuery === '' ||
    ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Customer Support</h1>
          <p className="text-slate-400 mt-1">Manage support tickets and customer communications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1">
            {stats.open} open tickets
          </Badge>
          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1">
            {stats.in_progress} in progress
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{stats.open}</p>
                <p className="text-xs text-slate-400">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{stats.in_progress}</p>
                <p className="text-xs text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
                <p className="text-xs text-slate-400">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <HeadphonesIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{tickets.length}</p>
                <p className="text-xs text-slate-400">Total Tickets</p>
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
            placeholder="Search tickets..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10">
            <Flag className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="py-12 text-center">
            <HeadphonesIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No tickets found</h3>
            <p className="text-slate-400">Support tickets will appear here when created</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const status = statusConfig[ticket.status] || statusConfig.open;
            const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${status.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`w-5 h-5 ${status.color.split(' ')[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium">{ticket.subject}</p>
                            <Badge className={`${status.color} border text-xs`}>
                              {status.label}
                            </Badge>
                            <Badge className={`${priority.color} text-xs`}>
                              {priority.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {ticket.user_email || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {ticket.category || 'General'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setUpdateDialog(ticket);
                            setNewStatus(ticket.status);
                          }}
                          className="bg-cyan-500 hover:bg-cyan-400 text-black"
                        >
                          Respond
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-slate-400 mt-3 ml-14 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Update Ticket Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl">
              Respond to Ticket
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {updateDialog?.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Original Message */}
            {updateDialog?.description && (
              <div className="p-3 bg-white/5 rounded-lg">
                <Label className="text-slate-400 text-xs uppercase">Customer Message</Label>
                <p className="text-white text-sm mt-1">{updateDialog.description}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="space-y-2">
              <Label className="text-slate-300">Update Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f111a] border-white/10">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Response Message */}
            <div className="space-y-2">
              <Label className="text-slate-300">Response Message (optional)</Label>
              <Textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response to the customer..."
                className="bg-black/40 border-white/10 text-white min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setUpdateDialog(null)}>Cancel</Button>
            <Button 
              onClick={handleUpdateTicket}
              disabled={submitting || !newStatus}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Update Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
