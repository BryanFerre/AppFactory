import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HardDrive, ArrowUpCircle, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Capacity() {
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacity();
  }, []);

  const fetchCapacity = async () => {
    try {
      const response = await axios.get(`${API}/capacity`);
      setCapacity(response.data);
    } catch (error) {
      console.error('Failed to fetch capacity data');
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

  const usagePercent = (capacity?.used_capacity / capacity?.total_capacity) * 100;
  
  const chartData = capacity?.app_usage.map((app, index) => ({
    name: app.name,
    value: app.capacity,
    color: ['#06B6D4', '#D946EF', '#8B5CF6', '#10B981', '#F59E0B'][index % 5]
  })) || [];

  const upgrades = [
    { name: 'Standard', capacity: 100, price: 29, current: true },
    { name: 'Professional', capacity: 250, price: 59, recommended: true },
    { name: 'Enterprise', capacity: 500, price: 99 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <HardDrive className="w-8 h-8 text-cyan-400" />
          Capacity & Upgrades
        </h1>
        <p className="text-slate-400 mt-1">Manage your node's storage capacity</p>
      </div>

      {/* Capacity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Storage Overview</h2>
          
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: capacity?.used_capacity, fill: '#06B6D4' },
                      { value: capacity?.available_capacity, fill: '#1E2235' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-white">{usagePercent.toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Used</p>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Used</span>
                  <span className="text-white">{capacity?.used_capacity} GB</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Available</span>
                <span className="text-emerald-400">{capacity?.available_capacity} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total</span>
                <span className="text-white">{capacity?.total_capacity} GB</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Usage by App</h2>
          
          <div className="flex items-center gap-6">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F111A', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} GB`, 'Capacity']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2">
              {chartData.map((app, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: app.color }} />
                    <span className="text-sm text-slate-300">{app.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{app.value} GB</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upgrade Plans */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Upgrade Your Capacity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upgrades.map((plan) => (
            <div 
              key={plan.name}
              className={`relative rounded-xl p-6 border ${
                plan.recommended 
                  ? 'bg-cyan-500/10 border-cyan-500/30' 
                  : plan.current 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.recommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black">
                  Recommended
                </Badge>
              )}
              {plan.current && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-600 text-white">
                  Current Plan
                </Badge>
              )}
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-white mb-1">
                {plan.capacity} <span className="text-lg text-slate-400">GB</span>
              </p>
              <p className="text-slate-400 mb-4">${plan.price}/month</p>
              
              <Button 
                className={`w-full rounded-full ${
                  plan.current 
                    ? 'bg-white/10 text-slate-400 cursor-not-allowed' 
                    : plan.recommended 
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black font-semibold' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                disabled={plan.current}
              >
                {plan.current ? 'Current' : 'Upgrade'}
              </Button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Warning */}
      {usagePercent > 80 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 border border-amber-500/30 bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-amber-200">
              Your storage is {usagePercent.toFixed(0)}% full. Consider upgrading to ensure optimal performance.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
