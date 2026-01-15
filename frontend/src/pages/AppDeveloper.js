import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Code, Upload, Github, FileCode, Globe, DollarSign, Server, Users,
  CheckCircle, Clock, XCircle, Star, Sparkles, CreditCard, ExternalLink,
  AlertCircle, FileText, Mail, Percent, HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Available tags for selection
const availableTags = [
  { id: 'ai', name: 'AI' },
  { id: 'web3', name: 'Web3' },
  { id: 'no-code', name: 'No-Code' },
  { id: 'privacy-first', name: 'Privacy-First' },
  { id: 'rewards-enabled', name: 'Rewards-Enabled' },
  { id: 'open-source', name: 'Open Source' },
  { id: 'enterprise', name: 'Enterprise' },
  { id: 'free-tier', name: 'Free Tier' },
  { id: 'mobile-first', name: 'Mobile-First' },
  { id: 'api-available', name: 'API Available' }
];

export default function AppDeveloper() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [featuredDialog, setFeaturedDialog] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // New: Categories from API
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const iconInputRef = useRef(null);
  const codeInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    app_name: '',
    description: '',
    category: '',
    category_id: '',
    subcategory_id: '',
    tags: [],
    resources_required: '',
    monthly_subscription_fee: '',
    revenue_sharing: '',
    nodes_available: '',
    github_url: '',
    documentation_url: '',
    contact_email: '',
    terms_accepted: false
  });
  
  const [iconFile, setIconFile] = useState(null);
  const [codeFile, setCodeFile] = useState(null);

  useEffect(() => {
    fetchSubmissions();
    fetchCategories();
    checkPaymentReturn();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const checkPaymentReturn = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (canceled) {
      toast.error('Payment was canceled');
      window.history.replaceState({}, '', '/app-developer');
      return;
    }

    if (sessionId && success) {
      setProcessingPayment(true);
      await pollPaymentStatus(sessionId);
      window.history.replaceState({}, '', '/app-developer');
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setProcessingPayment(false);
      toast.error('Payment status check timed out. Please check your submissions.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/developer/featured/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setProcessingPayment(false);
        toast.success(response.data.message);
        fetchSubmissions();
        return;
      } else if (response.data.status === 'expired') {
        setProcessingPayment(false);
        toast.error('Payment session expired');
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      setProcessingPayment(false);
      toast.error('Error checking payment status');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/developer/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error('Please accept the terms of service');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build categories array for multi-category support
      const categoriesArray = formData.category_id ? [{
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null
      }] : [];
      
      const response = await axios.post(`${API}/developer/submit`, {
        ...formData,
        categories: categoriesArray,
        resources_required: parseFloat(formData.resources_required),
        monthly_subscription_fee: parseFloat(formData.monthly_subscription_fee),
        revenue_sharing: parseFloat(formData.revenue_sharing),
        nodes_available: parseInt(formData.nodes_available)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('App submitted successfully!');
      setShowForm(false);
      setSelectedCategory(null);
      setFormData({
        app_name: '',
        description: '',
        category: '',
        category_id: '',
        subcategory_id: '',
        tags: [],
        resources_required: '',
        monthly_subscription_fee: '',
        revenue_sharing: '',
        nodes_available: '',
        github_url: '',
        documentation_url: '',
        contact_email: '',
        terms_accepted: false
      });
      setIconFile(null);
      setCodeFile(null);
      fetchSubmissions();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to submit app'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeaturedCheckout = async (submission, plan) => {
    setProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/developer/featured/checkout`, {
        submission_id: submission.id,
        plan: plan,
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      setProcessingPayment(false);
      toast.error(getErrorMessage(error, 'Failed to start checkout'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">App Developer</h1>
          <p className="text-slate-400 mt-1">Submit your app to the App Marketplace marketplace</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-full"
          data-testid="submit-app-btn"
        >
          <Code className="w-4 h-4 mr-2" />
          Submit New App
        </Button>
      </div>

      {/* Payment Processing Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="glass-card border-white/10 max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
              <p className="text-slate-400">Please wait while we confirm your payment...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div variants={item}>
          <Card className="glass-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{submissions.length}</p>
                  <p className="text-sm text-slate-400">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="glass-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {submissions.filter(s => s.status === 'approved').length}
                  </p>
                  <p className="text-sm text-slate-400">Approved Apps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="glass-card border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {submissions.filter(s => s.featured).length}
                  </p>
                  <p className="text-sm text-slate-400">Featured Apps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="py-12 text-center">
            <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No submissions yet</h3>
            <p className="text-slate-400 mb-4">Submit your first app to get started</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-purple-500 hover:bg-purple-400 text-white rounded-full"
            >
              Submit Your First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {submissions.map((submission) => (
            <motion.div key={submission.id} variants={item}>
              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                        <FileCode className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">{submission.app_name}</h3>
                          {getStatusBadge(submission.status)}
                          {submission.featured && (
                            <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
                              <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{submission.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${submission.monthly_subscription_fee}/mo
                          </span>
                          <span className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            {submission.revenue_sharing}% share
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {submission.resources_required} GB
                          </span>
                          <span className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            {submission.nodes_available} nodes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.github_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(submission.github_url, '_blank')}
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      )}
                      {submission.status === 'approved' && !submission.featured && (
                        <Button
                          onClick={() => setFeaturedDialog(submission)}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-full"
                          size="sm"
                          data-testid={`feature-btn-${submission.id}`}
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          Get Featured
                        </Button>
                      )}
                      {submission.featured && submission.featured_until && (
                        <span className="text-xs text-emerald-400">
                          Featured until {new Date(submission.featured_until).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Submit App Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-400" />
              Submit New App
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill in the details below to submit your app for review
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* App Icon Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300">App Icon (SVG only)</Label>
              <div
                onClick={() => iconInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
              >
                <input
                  ref={iconInputRef}
                  type="file"
                  accept=".svg"
                  className="hidden"
                  onChange={(e) => setIconFile(e.target.files[0])}
                />
                {iconFile ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>{iconFile.name}</span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>Click to upload SVG icon</p>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app_name" className="text-slate-300">App Name *</Label>
                <Input
                  id="app_name"
                  value={formData.app_name}
                  onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                  placeholder="My Awesome App"
                  className="bg-black/40 border-white/10 text-white"
                  required
                  data-testid="app-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10" data-testid="category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your app does..."
                className="bg-black/40 border-white/10 text-white min-h-[100px]"
                required
                data-testid="description-input"
              />
            </div>

            {/* Pricing & Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resources_required" className="text-slate-300">Resources Required (GB) *</Label>
                <div className="relative">
                  <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="resources_required"
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.resources_required}
                    onChange={(e) => setFormData({ ...formData, resources_required: e.target.value })}
                    placeholder="10"
                    className="pl-10 bg-black/40 border-white/10 text-white"
                    required
                    data-testid="resources-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_subscription_fee" className="text-slate-300">Monthly Subscription Fee ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="monthly_subscription_fee"
                    type="number"
                    step="0.01"
                    min="0.99"
                    value={formData.monthly_subscription_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_subscription_fee: e.target.value })}
                    placeholder="19.99"
                    className="pl-10 bg-black/40 border-white/10 text-white"
                    required
                    data-testid="subscription-fee-input"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue_sharing" className="text-slate-300">Revenue Sharing (%) *</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="revenue_sharing"
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={formData.revenue_sharing}
                    onChange={(e) => setFormData({ ...formData, revenue_sharing: e.target.value })}
                    placeholder="70"
                    className="pl-10 bg-black/40 border-white/10 text-white"
                    required
                    data-testid="revenue-sharing-input"
                  />
                </div>
                <p className="text-xs text-slate-500">Percentage of subscription revenue to node operators</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nodes_available" className="text-slate-300">Number of Nodes Available *</Label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="nodes_available"
                    type="number"
                    min="1"
                    value={formData.nodes_available}
                    onChange={(e) => setFormData({ ...formData, nodes_available: e.target.value })}
                    placeholder="100"
                    className="pl-10 bg-black/40 border-white/10 text-white"
                    required
                    data-testid="nodes-available-input"
                  />
                </div>
              </div>
            </div>

            {/* Code Upload Options */}
            <div className="space-y-4">
              <Label className="text-slate-300">Code Source</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      placeholder="https://github.com/user/repo"
                      className="pl-10 bg-black/40 border-white/10 text-white"
                      data-testid="github-url-input"
                    />
                  </div>
                  <p className="text-xs text-slate-500">GitHub repository URL</p>
                </div>
                <div>
                  <div
                    onClick={() => codeInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-lg p-3 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                  >
                    <input
                      ref={codeInputRef}
                      type="file"
                      accept=".zip,.tar.gz"
                      className="hidden"
                      onChange={(e) => setCodeFile(e.target.files[0])}
                    />
                    {codeFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>{codeFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <Upload className="w-4 h-4" />
                        <span>Or upload code (.zip)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Documentation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-slate-300">Contact Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="developer@example.com"
                    className="pl-10 bg-black/40 border-white/10 text-white"
                    required
                    data-testid="contact-email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentation_url" className="text-slate-300">Documentation URL (optional)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="documentation_url"
                    type="url"
                    value={formData.documentation_url}
                    onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                    placeholder="https://docs.example.com"
                    className="pl-10 bg-black/40 border-white/10 text-white"
                    data-testid="docs-url-input"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
              <Checkbox
                id="terms"
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => setFormData({ ...formData, terms_accepted: checked })}
                data-testid="terms-checkbox"
              />
              <label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                I accept the <span className="text-purple-400 hover:underline">Terms of Service</span> and agree to the App Marketplace developer guidelines. I understand that my submission will be reviewed before being published.
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-full"
                data-testid="submit-form-btn"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Submit App
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Featured Listing Dialog */}
      <Dialog open={!!featuredDialog} onOpenChange={() => setFeaturedDialog(null)}>
        <DialogContent className="glass-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Get Featured Listing
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Boost your app's visibility with a featured listing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <p className="text-white font-semibold mb-2">Why get featured?</p>
              <ul className="text-sm text-slate-300 space-y-1">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Prominent placement at the top of App Marketplace
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Up to 5x more visibility to node operators
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Faster adoption and revenue growth
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card
                className="glass-card border-white/10 cursor-pointer hover:border-amber-500/50 transition-colors"
                onClick={() => handleFeaturedCheckout(featuredDialog, '30_days')}
                data-testid="featured-30-days"
              >
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-white">$29</p>
                  <p className="text-slate-400 mt-1">30 Days</p>
                  <p className="text-xs text-slate-500 mt-2">~$0.97/day</p>
                </CardContent>
              </Card>
              <Card
                className="glass-card border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-colors relative overflow-hidden"
                onClick={() => handleFeaturedCheckout(featuredDialog, '60_days')}
                data-testid="featured-60-days"
              >
                <div className="absolute top-2 right-2">
                  <Badge className="bg-amber-500 text-black text-xs">Best Value</Badge>
                </div>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-white">$59</p>
                  <p className="text-slate-400 mt-1">60 Days</p>
                  <p className="text-xs text-emerald-400 mt-2">Save $0.49/day</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CreditCard className="w-4 h-4" />
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setFeaturedDialog(null)}>
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import missing icon
function TrendingUp(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );
}
