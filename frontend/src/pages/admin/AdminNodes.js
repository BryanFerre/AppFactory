import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Server, Search, Filter, Activity, HardDrive, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const statusConfig = {
  healthy: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  warning: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle },
  offline: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
};

export default function AdminNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNodes();
  }, [statusFilter]);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/nodes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNodes(response.data.nodes);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch nodes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">NAPP Nodes</h1>
        <p className="text-slate-400 mt-1">Monitor and manage node network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{nodes.filter(n => n.status === 'healthy').length}</p>
                <p className="text-xs text-slate-400">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{nodes.filter(n => n.status === 'warning').length}</p>
                <p className="text-xs text-slate-400">Warning</p>
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
                <p className="text-2xl font-bold text-white">{nodes.filter(n => n.status === 'offline').length}</p>
                <p className="text-xs text-slate-400">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-xs text-slate-400">Total Nodes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {nodes.map((node) => {
            const status = statusConfig[node.status] || statusConfig.healthy;
            const StatusIcon = status.icon;
            const capacityPercent = (node.used_gb / node.capacity_gb) * 100;
            
            return (
              <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${status.color.split(' ')[0]} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${status.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{node.id}</p>
                          <p className="text-sm text-slate-400">{node.owner_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Capacity</p>
                          <div className="w-24 mt-1">
                            <Progress value={capacityPercent} className="h-2" />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{node.used_gb}/{node.capacity_gb} GB</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Apps</p>
                          <p className="text-lg font-bold text-white">{node.installed_apps}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Earnings</p>
                          <p className="text-lg font-bold text-emerald-400">${node.monthly_earnings}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Uptime</p>
                          <p className="text-lg font-bold text-cyan-400">{node.uptime_percent}%</p>
                        </div>
                        <Badge className={`${status.color} border`}>{node.status}</Badge>
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
