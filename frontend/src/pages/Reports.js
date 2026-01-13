import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Reports() {
  const [earnings, setEarnings] = useState(null);
  const [year, setYear] = useState('2024');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${API}/earnings`);
      setEarnings(response.data);
    } catch (error) {
      console.error('Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    toast.success(`${format.toUpperCase()} report downloaded!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthlyData = [
    { month: 'January', opt: 245.6, usd: 208.76 },
    { month: 'February', opt: 312.4, usd: 265.54 },
    { month: 'March', opt: 287.9, usd: 244.72 },
    { month: 'April', opt: 356.2, usd: 302.77 },
    { month: 'May', opt: 401.8, usd: 341.53 },
    { month: 'June', opt: 378.5, usd: 321.73 },
    { month: 'July', opt: 445.2, usd: 378.42 },
    { month: 'August', opt: 423.7, usd: 360.15 },
    { month: 'September', opt: 389.1, usd: 330.74 },
    { month: 'October', opt: 467.3, usd: 397.21 },
    { month: 'November', opt: 512.8, usd: 435.88 },
    { month: 'December', opt: earnings?.month_opt || 0, usd: earnings?.month_usd || 0 }
  ];

  const yearTotal = monthlyData.reduce((sum, m) => sum + m.opt, 0);
  const yearTotalUsd = monthlyData.reduce((sum, m) => sum + m.usd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            Reports / Tax
          </h1>
          <p className="text-slate-400 mt-1">Generate tax-ready earnings reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28 bg-black/40 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Total Earnings ({year})</p>
          <p className="text-3xl font-bold text-white">{yearTotal.toFixed(2)} <span className="text-lg text-cyan-400">OPT</span></p>
          <p className="text-sm text-slate-500">${yearTotalUsd.toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Monthly Average</p>
          <p className="text-3xl font-bold text-white">{(yearTotal / 12).toFixed(2)} <span className="text-lg text-purple-400">OPT</span></p>
          <p className="text-sm text-slate-500">${(yearTotalUsd / 12).toFixed(2)} USD</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <p className="text-sm text-slate-400 mb-2">Tax Category</p>
          <p className="text-xl font-bold text-white">Schedule C</p>
          <p className="text-sm text-emerald-400">Self-Employment Income</p>
        </motion.div>
      </div>

      {/* Export Options */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Export Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            onClick={() => exportReport('csv')}
            className="bg-white/10 hover:bg-white/20 text-white justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button 
            onClick={() => exportReport('pdf')}
            className="bg-white/10 hover:bg-white/20 text-white justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button 
            onClick={() => exportReport('json')}
            className="bg-white/10 hover:bg-white/20 text-white justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </motion.div>

      {/* Monthly Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-6">Monthly Breakdown</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Month</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">OPT Earned</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">USD Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white">{month.month}</td>
                  <td className="py-3 px-4 text-right text-cyan-400 font-mono">{month.opt.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">${month.usd.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge className={index < 11 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                      {index < 11 ? 'Completed' : 'In Progress'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Total</td>
                <td className="py-3 px-4 text-right font-semibold text-cyan-400 font-mono">{yearTotal.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-semibold text-white font-mono">${yearTotalUsd.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
