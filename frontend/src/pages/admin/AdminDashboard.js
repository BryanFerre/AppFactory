import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Users, Server, Package, HeadphonesIcon, CreditCard, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle, ArrowUpRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">System overview and quick actions</p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Users */}
        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/users')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats?.users?.total || 0}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                      {stats?.users?.active || 0} active
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Nodes */}
        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/nodes')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Nodes</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats?.nodes?.total?.toLocaleString() || 0}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                      {stats?.nodes?.healthy || 0} healthy
                    </Badge>
                    {stats?.nodes?.warning > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                        {stats?.nodes?.warning} warning
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Server className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Apps */}
        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/apps')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">App Submissions</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats?.apps?.total || 0}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {stats?.apps?.pending > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                        {stats?.apps?.pending} pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div variants={item}>
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/support')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Open Tickets</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats?.support?.open_tickets || 0}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                      Support queue
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <HeadphonesIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Summary */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-sm text-slate-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">${stats?.revenue?.total?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <p className="text-sm text-slate-400">This Month</p>
                  <p className="text-2xl font-bold text-cyan-400">${stats?.revenue?.monthly?.toLocaleString() || 0}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-slate-400 hover:text-white"
                onClick={() => navigate('/admin/revenue')}
              >
                View Details
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts & Issues */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.nodes?.offline > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-white">{stats.nodes.offline} nodes offline</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => navigate('/admin/nodes?status=offline')}>
                    View
                  </Button>
                </div>
              )}
              
              {stats?.billing?.failed_payments > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span className="text-white">{stats.billing.failed_payments} failed payments</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-amber-400" onClick={() => navigate('/admin/billing?status=failed')}>
                    Review
                  </Button>
                </div>
              )}
              
              {stats?.apps?.pending > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-white">{stats.apps.pending} apps pending review</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-purple-400" onClick={() => navigate('/admin/apps?status=pending')}>
                    Review
                  </Button>
                </div>
              )}

              {stats?.nodes?.offline === 0 && stats?.billing?.failed_payments === 0 && stats?.apps?.pending === 0 && (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400">All systems operational</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} initial="hidden" animate="show">
        <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                onClick={() => navigate('/admin/apps?status=pending')}
              >
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-slate-300">Review Apps</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30"
                onClick={() => navigate('/admin/support')}
              >
                <HeadphonesIcon className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-slate-300">Support Queue</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                onClick={() => navigate('/admin/nodes')}
              >
                <Server className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-slate-300">Node Health</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-amber-500/10 hover:border-amber-500/30"
                onClick={() => navigate('/admin/audit')}
              >
                <ScrollText className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-slate-300">Audit Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Missing import
function ScrollText(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/>
      <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
      <path d="M15 8h-5"/>
      <path d="M15 12h-5"/>
    </svg>
  );
}
