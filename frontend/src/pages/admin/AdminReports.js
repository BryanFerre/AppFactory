import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Calendar, Filter, Users, Server, Package,
  DollarSign, TrendingUp, FileSpreadsheet, FileDown, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const reportTypes = [
  {
    id: 'users',
    name: 'User Activity Report',
    description: 'User registrations, activity metrics, and engagement data',
    icon: Users,
    color: 'cyan',
    formats: ['csv', 'pdf']
  },
  {
    id: 'nodes',
    name: 'Node Health Report',
    description: 'Node status, uptime, capacity utilization, and performance',
    icon: Server,
    color: 'emerald',
    formats: ['csv', 'pdf']
  },
  {
    id: 'apps',
    name: 'App Submissions Report',
    description: 'Submitted apps, approval rates, and developer analytics',
    icon: Package,
    color: 'purple',
    formats: ['csv', 'pdf']
  },
  {
    id: 'revenue',
    name: 'Revenue Report',
    description: 'Revenue breakdown, transactions, and financial summary',
    icon: DollarSign,
    color: 'amber',
    formats: ['csv', 'pdf', 'xlsx']
  },
  {
    id: 'payouts',
    name: 'Payouts Report',
    description: 'Node operator payouts, pending amounts, and history',
    icon: TrendingUp,
    color: 'blue',
    formats: ['csv', 'pdf', 'xlsx']
  }
];

const periodOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' }
];

export default function AdminReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [generating, setGenerating] = useState(null);

  const handleGenerateReport = async (reportType, format) => {
    setGenerating(`${reportType}-${format}`);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`${reportType.replace('_', ' ')} report generated successfully`);
    setGenerating(null);
    
    // In a real implementation, this would trigger a download
    toast.info('Report download will start automatically', {
      description: 'Check your downloads folder'
    });
  };

  const colorClasses = {
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/50' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:border-emerald-500/50' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', hover: 'hover:border-purple-500/50' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', hover: 'hover:border-amber-500/50' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:border-blue-500/50' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Reports & Exports</h1>
          <p className="text-slate-400 mt-1">Generate and export compliance-ready reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-slate-400">Time Period:</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-44 bg-black/40 border-white/10">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f111a] border-white/10">
              {periodOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reportTypes.map((report) => {
          const colors = colorClasses[report.color];
          const IconComponent = report.icon;
          
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`bg-[rgba(15,17,26,0.6)] border-white/10 ${colors.hover} transition-colors`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{report.description}</p>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs text-slate-500">Export as:</span>
                        {report.formats.map(format => (
                          <Button
                            key={format}
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateReport(report.id, format)}
                            disabled={generating === `${report.id}-${format}`}
                            className={`border-white/10 hover:${colors.bg} hover:${colors.border}`}
                          >
                            {generating === `${report.id}-${format}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {format === 'csv' && <FileSpreadsheet className="w-4 h-4 mr-1" />}
                                {format === 'pdf' && <FileText className="w-4 h-4 mr-1" />}
                                {format === 'xlsx' && <FileDown className="w-4 h-4 mr-1" />}
                                {format.toUpperCase()}
                              </>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Exports */}
      <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Recent Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No recent exports</p>
            <p className="text-sm text-slate-500 mt-1">Generated reports will appear here for 7 days</p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Compliance Ready</h4>
              <p className="text-sm text-slate-400">
                All reports are formatted for regulatory compliance and audit requirements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
