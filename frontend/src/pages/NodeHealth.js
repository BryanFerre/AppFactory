import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Activity, Cpu, HardDrive, Wifi, Clock, CheckCircle2,
  AlertTriangle, RefreshCw, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NodeHealth() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/node/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch node stats');
    } finally {
      setLoading(false);
    }
  };

  const verifyNode = async () => {
    setVerifying(true);
    try {
      await axios.post(`${API}/node/verify`);
      toast.success('Node verified successfully!');
      fetchStats();
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusColor = (value, thresholds) => {
    if (value < thresholds.good) return 'text-emerald-400';
    if (value < thresholds.warning) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = (value, thresholds) => {
    if (value < thresholds.good) return 'bg-emerald-500';
    if (value < thresholds.warning) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-400" />
            Node Health
          </h1>
          <p className="text-slate-400 mt-1">Monitor your node's performance and status</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`px-3 py-1 ${
            stats?.status === 'healthy' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {stats?.status === 'healthy' ? (
              <><CheckCircle2 className="w-4 h-4 mr-1" /> Healthy</>
            ) : (
              <><AlertTriangle className="w-4 h-4 mr-1" /> Warning</>
            )}
          </Badge>
          <Button 
            onClick={verifyNode}
            disabled={verifying}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full"
            data-testid="verify-btn"
          >
            {verifying ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Verify Node
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">System Resources</h2>
          
          <div className="space-y-6">
            {/* CPU */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300">CPU Usage</span>
                </div>
                <span className={`font-semibold ${getStatusColor(stats?.cpu_usage, { good: 60, warning: 80 })}`}>
                  {stats?.cpu_usage}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(stats?.cpu_usage, { good: 60, warning: 80 })} rounded-full transition-all duration-500`}
                  style={{ width: `${stats?.cpu_usage}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Memory Usage</span>
                </div>
                <span className={`font-semibold ${getStatusColor(stats?.memory_usage, { good: 70, warning: 85 })}`}>
                  {stats?.memory_usage}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(stats?.memory_usage, { good: 70, warning: 85 })} rounded-full transition-all duration-500`}
                  style={{ width: `${stats?.memory_usage}%` }}
                />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">Storage Usage</span>
                </div>
                <span className={`font-semibold ${getStatusColor(stats?.storage_usage, { good: 70, warning: 85 })}`}>
                  {stats?.storage_usage}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(stats?.storage_usage, { good: 70, warning: 85 })} rounded-full transition-all duration-500`}
                  style={{ width: `${stats?.storage_usage}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400">Uptime</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.uptime_percent}%</p>
            <p className="text-sm text-emerald-400">Excellent</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-purple-400" />
              <span className="text-slate-400">Latency</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.latency_ms}<span className="text-lg text-slate-400">ms</span></p>
            <p className="text-sm text-emerald-400">Very Low</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400">Reliability</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.reliability_score}%</p>
            <p className="text-sm text-cyan-400">Top 10%</p>
          </motion.div>
        </div>
      </div>

      {/* Network Info */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Node Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Node ID</p>
            <p className="font-mono text-white text-sm">{stats?.node_id}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Last Heartbeat</p>
            <p className="text-white">{new Date(stats?.last_heartbeat).toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Reputation Score</p>
            <p className="text-2xl font-bold text-cyan-400">{stats?.reputation_score}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
