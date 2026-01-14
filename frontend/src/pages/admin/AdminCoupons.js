import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Tag, Plus, Edit2, Trash2, Search, Loader2, Save, X,
  Percent, DollarSign, Calendar, Users, Copy, Check,
  ToggleLeft, ToggleRight, AlertCircle, TrendingUp, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);

  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    applicable_products: [],
    min_purchase_amount: '0',
    max_discount_amount: '',
    usage_limit: '-1',
    usage_per_user: '1',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
    fetchStats();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data.coupons);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/coupons/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      applicable_products: [],
      min_purchase_amount: '0',
      max_discount_amount: '',
      usage_limit: '-1',
      usage_per_user: '1',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setError('');
    setShowCouponModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      applicable_products: coupon.applicable_products || [],
      min_purchase_amount: (coupon.min_purchase_amount || 0).toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: (coupon.usage_limit || -1).toString(),
      usage_per_user: (coupon.usage_per_user || 1).toString(),
      start_date: coupon.start_date?.split('T')[0] || '',
      end_date: coupon.end_date?.split('T')[0] || '',
      is_active: coupon.is_active,
    });
    setError('');
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...couponForm,
        code: couponForm.code || null,
        discount_value: parseFloat(couponForm.discount_value),
        min_purchase_amount: parseFloat(couponForm.min_purchase_amount) || 0,
        max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : null,
        usage_limit: parseInt(couponForm.usage_limit) || -1,
        usage_per_user: parseInt(couponForm.usage_per_user) || 1,
        start_date: couponForm.start_date ? `${couponForm.start_date}T00:00:00Z` : null,
        end_date: couponForm.end_date ? `${couponForm.end_date}T23:59:59Z` : null,
      };

      if (editingCoupon) {
        await axios.put(`${API}/admin/coupons/${editingCoupon.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/admin/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowCouponModal(false);
      fetchCoupons();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteCoupon) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/coupons/${deleteCoupon.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteCoupon(null);
      fetchCoupons();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && coupon.is_active) ||
                         (statusFilter === 'inactive' && !coupon.is_active);
    return matchesSearch && matchesStatus;
  });

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% off`;
    }
    return `$${coupon.discount_value} off`;
  };

  const isExpired = (coupon) => {
    if (!coupon.end_date) return false;
    return new Date(coupon.end_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Tag className="w-7 h-7 text-purple-400" />
            Coupons & Discounts
          </h1>
          <p className="text-slate-400 mt-1">Create and manage discount codes</p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Coupons</p>
                <p className="text-xl font-bold text-white">{stats.total_coupons}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Coupons</p>
                <p className="text-xl font-bold text-white">{stats.active_coupons}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Usages</p>
                <p className="text-xl font-bold text-white">{stats.total_usages}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Discounts Given</p>
                <p className="text-xl font-bold text-white">${stats.total_discount_given?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coupons Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Code</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Name</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Discount</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Usage</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Validity</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Status</th>
                <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded font-mono text-sm">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {copied === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{coupon.name}</p>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 truncate max-w-xs">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`border-0 ${
                      coupon.discount_type === 'percentage' 
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {coupon.discount_type === 'percentage' ? (
                        <Percent className="w-3 h-3 mr-1" />
                      ) : (
                        <DollarSign className="w-3 h-3 mr-1" />
                      )}
                      {formatDiscount(coupon)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300">
                      {coupon.usage_count || 0}
                      {coupon.usage_limit !== -1 && ` / ${coupon.usage_limit}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {coupon.end_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className={isExpired(coupon) ? 'text-red-400' : 'text-slate-400'}>
                          {isExpired(coupon) ? 'Expired' : `Until ${new Date(coupon.end_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">No expiry</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {coupon.is_active && !isExpired(coupon) ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Active</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-0">
                        {isExpired(coupon) ? 'Expired' : 'Inactive'}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => openEditModal(coupon)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-400"
                        onClick={() => setDeleteCoupon(coupon)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No coupons found</p>
                    <Button
                      onClick={openCreateModal}
                      variant="link"
                      className="text-purple-400 mt-2"
                    >
                      Create your first coupon
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Coupon Modal */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className="bg-[#0F1420] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingCoupon ? 'Update coupon details' : 'Create a discount code for your customers'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCoupon} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Coupon Code
                </label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 font-mono"
                  placeholder="Auto-generated if empty"
                  disabled={!!editingCoupon}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Name *
                </label>
                <Input
                  required
                  value={couponForm.name}
                  onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="Pre-Launch Discount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <Textarea
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Discount Type *
                </label>
                <Select
                  value={couponForm.discount_type}
                  onValueChange={(val) => setCouponForm({ ...couponForm, discount_type: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Discount Value *
                </label>
                <div className="relative">
                  {couponForm.discount_type === 'percentage' ? (
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  )}
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    max={couponForm.discount_type === 'percentage' ? '100' : undefined}
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    className={`bg-white/5 border-white/10 ${couponForm.discount_type === 'fixed' ? 'pl-9' : ''}`}
                    placeholder={couponForm.discount_type === 'percentage' ? '20' : '500'}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Usage Limit
                </label>
                <Input
                  type="number"
                  value={couponForm.usage_limit}
                  onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="-1 for unlimited"
                />
                <p className="text-xs text-slate-500 mt-1">-1 = unlimited uses</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Uses Per Customer
                </label>
                <Input
                  type="number"
                  min="1"
                  value={couponForm.usage_per_user}
                  onChange={(e) => setCouponForm({ ...couponForm, usage_per_user: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={couponForm.start_date}
                  onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  End Date
                </label>
                <Input
                  type="date"
                  value={couponForm.end_date}
                  onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {couponForm.discount_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Maximum Discount Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={couponForm.max_discount_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                    className="bg-white/5 border-white/10 pl-9"
                    placeholder="No limit"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Cap the maximum discount for percentage coupons</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={couponForm.is_active}
                onCheckedChange={(checked) => setCouponForm({ ...couponForm, is_active: checked })}
              />
              <label className="text-sm text-slate-300">Active</label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCoupon} onOpenChange={() => setDeleteCoupon(null)}>
        <AlertDialogContent className="bg-[#0F1420] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete coupon &ldquo;{deleteCoupon?.code}&rdquo;?
              {deleteCoupon?.usage_count > 0 
                ? ' This coupon has been used and will be deactivated instead of deleted.'
                : ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCoupon}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
