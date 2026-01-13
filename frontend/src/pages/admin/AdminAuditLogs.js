import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ScrollText, Search, Filter, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const actionColors = {
  create_admin: 'bg-cyan-500/20 text-cyan-400',
  suspend_user: 'bg-red-500/20 text-red-400',
  reinstate_user: 'bg-emerald-500/20 text-emerald-400',
  app_approve: 'bg-emerald-500/20 text-emerald-400',
  app_reject: 'bg-red-500/20 text-red-400',
  app_request_changes: 'bg-amber-500/20 text-amber-400',
  update_ticket: 'bg-blue-500/20 text-blue-400',
  node_suspend: 'bg-red-500/20 text-red-400',
  node_flag: 'bg-amber-500/20 text-amber-400'
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (targetFilter !== 'all') params.append('target_type', targetFilter);
      
      const response = await axios.get(`${API}/audit/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.logs);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">System Logs & Audit</h1>
        <p className="text-slate-400 mt-1">Complete audit trail of all admin actions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Target Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Targets</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="app">Apps</SelectItem>
            <SelectItem value="node">Nodes</SelectItem>
            <SelectItem value="ticket">Tickets</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="py-12 text-center">
            <ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-white">No audit logs found</p>
            <p className="text-slate-400 text-sm">Admin actions will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="bg-[rgba(15,17,26,0.6)] border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={actionColors[log.action] || 'bg-slate-500/20 text-slate-400'}>
                      {log.action?.replace(/_/g, ' ')}
                    </Badge>
                    <div>
                      <p className="text-white text-sm">
                        <span className="text-slate-400">Target:</span> {log.target_type} / {log.target_id?.slice(0, 8)}...
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {JSON.stringify(log.details).slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.admin_email}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
