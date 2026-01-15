import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  FileText, Download, Calendar, Filter, Users, Server, Package,
  DollarSign, TrendingUp, FileSpreadsheet, FileDown, Loader2,
  CheckCircle2, Clock, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
    description: 'Licensed nodes, status, and owner information',
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
    formats: ['csv', 'pdf']
  },
  {
    id: 'payouts',
    name: 'Payouts Report',
    description: 'Node operator payouts, pending amounts, and history',
    icon: TrendingUp,
    color: 'blue',
    formats: ['csv', 'pdf']
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
  const [recentExports, setRecentExports] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    // Load recent exports from localStorage
    const saved = localStorage.getItem('recentExports');
    if (saved) {
      const exports = JSON.parse(saved);
      // Filter out exports older than 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = exports.filter(e => new Date(e.timestamp).getTime() > sevenDaysAgo);
      setRecentExports(recent);
      localStorage.setItem('recentExports', JSON.stringify(recent));
    }
  }, []);

  const saveExport = (reportType, format, filename) => {
    const newExport = {
      id: Date.now(),
      reportType,
      format,
      filename,
      timestamp: new Date().toISOString(),
      period: selectedPeriod
    };
    const updated = [newExport, ...recentExports].slice(0, 10);
    setRecentExports(updated);
    localStorage.setItem('recentExports', JSON.stringify(updated));
  };

  const fetchReportData = async (reportType) => {
    const token = localStorage.getItem('admin_token');
    const response = await axios.get(`${API}/admin/reports/${reportType}?period=${selectedPeriod}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  };

  const handlePreview = async (reportType) => {
    setPreviewLoading(true);
    try {
      const data = await fetchReportData(reportType);
      setPreviewData({
        ...data,
        reportName: reportTypes.find(r => r.id === reportType)?.name || reportType
      });
      setShowPreview(true);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      toast.error('Failed to load report preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateReport = async (reportType, format) => {
    setGenerating(`${reportType}-${format}`);
    
    try {
      const token = localStorage.getItem('admin_token');
      
      if (format === 'csv') {
        // Download CSV directly from backend
        const response = await axios.get(
          `${API}/admin/reports/export/csv/${reportType}?period=${selectedPeriod}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        const filename = `${reportType}_report_${selectedPeriod}_${new Date().toISOString().slice(0,10)}.csv`;
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        saveExport(reportType, 'csv', filename);
        toast.success('CSV report downloaded successfully');
        
      } else if (format === 'pdf') {
        // Fetch data and generate PDF client-side
        const data = await fetchReportData(reportType);
        const reportInfo = reportTypes.find(r => r.id === reportType);
        
        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(34, 211, 238); // cyan
        doc.text(reportInfo?.name || 'Report', 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Period: ${periodOptions.find(p => p.value === selectedPeriod)?.label}`, 14, 34);
        
        // Summary section
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text('Summary', 14, 46);
        
        let yPos = 52;
        Object.entries(data.summary).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`${label}: `, 14, yPos);
          doc.setTextColor(40);
          doc.text(String(typeof value === 'number' ? value.toLocaleString() : value), 60, yPos);
          yPos += 6;
        });
        
        // Data table
        if (data.data.length > 0) {
          const headers = data.columns.map(c => c.label);
          const rows = data.data.map(row => 
            data.columns.map(c => {
              const val = row[c.key];
              if (typeof val === 'number') return val.toLocaleString();
              if (typeof val === 'string' && val.includes('T')) {
                return new Date(val).toLocaleDateString();
              }
              return String(val || '');
            })
          );
          
          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: yPos + 10,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [34, 211, 238], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
          });
        }
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Page ${i} of ${pageCount} - Optio CloudNode Admin`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
        
        // Save PDF
        const filename = `${reportType}_report_${selectedPeriod}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(filename);
        
        saveExport(reportType, 'pdf', filename);
        toast.success('PDF report downloaded successfully');
      }
      
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const colorClasses = {
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/50' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:border-emerald-500/50' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', hover: 'hover:border-purple-500/50' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', hover: 'hover:border-amber-500/50' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:border-blue-500/50' }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">Reports & Exports</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">Generate and export compliance-ready reports</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Label className="text-slate-400 text-xs sm:text-sm">Period:</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 sm:w-44 bg-black/40 border-white/10 text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f111a] border-white/10">
              {periodOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                      <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-semibold text-white truncate">{report.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">{report.description}</p>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(report.id)}
                          disabled={previewLoading}
                          className="text-slate-400 hover:text-white text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          Preview
                        </Button>
                        
                        <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:inline">Export:</span>
                        {report.formats.map(format => (
                          <Button
                            key={format}
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateReport(report.id, format)}
                            disabled={generating === `${report.id}-${format}`}
                            className={`border-white/10 hover:${colors.bg} hover:${colors.border} text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3`}
                          >
                            {generating === `${report.id}-${format}` ? (
                              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            ) : (
                              <>
                                {format === 'csv' && <FileSpreadsheet className="w-4 h-4 mr-1" />}
                                {format === 'pdf' && <FileText className="w-4 h-4 mr-1" />}
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
          {recentExports.length > 0 ? (
            <div className="space-y-2">
              {recentExports.map((exp) => {
                const report = reportTypes.find(r => r.id === exp.reportType);
                const IconComponent = report?.icon || FileText;
                const colors = colorClasses[report?.color || 'cyan'];
                
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <IconComponent className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{exp.filename}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(exp.timestamp)} • {periodOptions.find(p => p.value === exp.period)?.label}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${colors.bg} ${colors.text} border-0`}>
                      {exp.format.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No recent exports</p>
              <p className="text-sm text-slate-500 mt-1">Generated reports will appear here for 7 days</p>
            </div>
          )}
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

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-[#0F1420] border-white/10 text-white max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              {previewData?.reportName} Preview
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Period: {periodOptions.find(p => p.value === selectedPeriod)?.label} • 
              Generated: {previewData?.generated_at ? formatDate(previewData.generated_at) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {Object.entries(previewData.summary).map(([key, value]) => (
                  <div key={key} className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-bold text-white">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Data Table */}
              <div className="flex-1 overflow-auto border border-white/10 rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-[#0F1420]">
                    <TableRow className="border-white/10">
                      {previewData.columns.map((col) => (
                        <TableHead key={col.key} className="text-slate-400 font-medium">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.data.slice(0, 50).map((row, i) => (
                      <TableRow key={i} className="border-white/5 hover:bg-white/5">
                        {previewData.columns.map((col) => (
                          <TableCell key={col.key} className="text-slate-300 text-sm">
                            {typeof row[col.key] === 'number' 
                              ? row[col.key].toLocaleString()
                              : typeof row[col.key] === 'string' && row[col.key].includes('T')
                                ? new Date(row[col.key]).toLocaleDateString()
                                : row[col.key] || '-'
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.data.length > 50 && (
                  <div className="p-3 text-center text-sm text-slate-500 bg-white/5">
                    Showing 50 of {previewData.data.length} records. Export to see all data.
                  </div>
                )}
                {previewData.data.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No data available for this period
                  </div>
                )}
              </div>
              
              {/* Export Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="border-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleGenerateReport(previewData.report_type, 'csv');
                    setShowPreview(false);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => {
                    handleGenerateReport(previewData.report_type, 'pdf');
                    setShowPreview(false);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
