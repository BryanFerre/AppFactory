import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Edit2, Trash2, Search, Filter, DollarSign,
  Eye, EyeOff, Star, Loader2, Save, X, ChevronDown, Check,
  ShoppingBag, TrendingUp, AlertCircle, Tag, Percent, Calendar,
  Copy, ChevronRight, Gift
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'node', label: 'CloudNode' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'addon', label: 'Add-on' },
  { value: 'service', label: 'Service' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Coupon states
  const [productCoupons, setProductCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponSection, setShowCouponSection] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const [copied, setCopied] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    currency: 'USD',
    category: 'node',
    image_url: '',
    features: [],
    is_active: true,
    is_featured: false,
    stock: -1,
  });
  const [featureInput, setFeatureInput] = useState('');

  // Coupon form
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    usage_limit: '-1',
    usage_per_user: '1',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/products/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchProductCoupons = async (productId) => {
    setLoadingCoupons(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/coupons?product_id=${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductCoupons(response.data.coupons);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setProductCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: '',
      currency: 'USD',
      category: 'node',
      image_url: '',
      features: [],
      is_active: true,
      is_featured: false,
      stock: -1,
    });
    setProductCoupons([]);
    setShowCouponSection(false);
    setError('');
    setShowProductModal(true);
  };

  const openEditModal = async (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description || '',
      price: product.price.toString(),
      currency: product.currency || 'USD',
      category: product.category || 'node',
      image_url: product.image_url || '',
      features: product.features || [],
      is_active: product.is_active,
      is_featured: product.is_featured || false,
      stock: product.stock || -1,
    });
    setError('');
    setShowCouponSection(false);
    setShowProductModal(true);
    
    // Fetch coupons for this product
    await fetchProductCoupons(product.id);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (name) => {
    setProductForm({
      ...productForm,
      name,
      slug: editingProduct ? productForm.slug : generateSlug(name)
    });
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setProductForm({
        ...productForm,
        features: [...productForm.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setProductForm({
      ...productForm,
      features: productForm.features.filter((_, i) => i !== index)
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
      };

      if (editingProduct) {
        // Update existing product
        await axios.put(`${API}/admin/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await axios.post(`${API}/admin/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product created successfully');
      }

      setShowProductModal(false);
      fetchProducts();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/products/${deleteProduct.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteProduct(null);
      fetchProducts();
      fetchStats();
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Failed to delete product');
    }
  };

  // Coupon handlers
  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      usage_limit: '-1',
      usage_per_user: '1',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const openEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      usage_limit: (coupon.usage_limit || -1).toString(),
      usage_per_user: (coupon.usage_per_user || 1).toString(),
      start_date: coupon.start_date?.split('T')[0] || '',
      end_date: coupon.end_date?.split('T')[0] || '',
      is_active: coupon.is_active,
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...couponForm,
        code: couponForm.code || null,
        discount_value: parseFloat(couponForm.discount_value),
        usage_limit: parseInt(couponForm.usage_limit) || -1,
        usage_per_user: parseInt(couponForm.usage_per_user) || 1,
        start_date: couponForm.start_date ? `${couponForm.start_date}T00:00:00Z` : null,
        end_date: couponForm.end_date ? `${couponForm.end_date}T23:59:59Z` : null,
        applicable_products: [editingProduct.id], // Tie coupon to this product
      };

      if (editingCoupon) {
        await axios.put(`${API}/admin/coupons/${editingCoupon.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon updated successfully');
      } else {
        await axios.post(`${API}/admin/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon created successfully');
      }

      resetCouponForm();
      await fetchProductCoupons(editingProduct.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteCoupon || !editingProduct) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/coupons/${deleteCoupon.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteCoupon(null);
      await fetchProductCoupons(editingProduct.id);
      toast.success('Coupon deleted successfully');
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      toast.error('Failed to delete coupon');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(price);
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
            <Package className="w-7 h-7 text-cyan-400" />
            Product Management
          </h1>
          <p className="text-slate-400 mt-1">Manage your products, pricing, and discount coupons</p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Products</p>
                <p className="text-xl font-bold text-white">{stats.total_products}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Products</p>
                <p className="text-xl font-bold text-white">{stats.active_products}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Top Seller</p>
                <p className="text-xl font-bold text-white truncate">
                  {stats.top_products_by_revenue?.[0]?.product_name || 'N/A'}
                </p>
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Product</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Category</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Price</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Sales</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Status</th>
                <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.slug}</p>
                      </div>
                      {product.is_featured && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-white/10 text-slate-300 border-0">
                      {categories.find(c => c.value === product.category)?.label || product.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300">{product.sales_count || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.is_active ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Active</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-0">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-400"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="bg-[#0F1420] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingProduct ? 'Update product details, pricing, and manage coupons' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Product Name *
                </label>
                <Input
                  required
                  value={productForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-white/5 border-white/10"
                  placeholder="Optio CloudNode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Slug *
                </label>
                <Input
                  required
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="optio-cloudnode"
                  disabled={!!editingProduct}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Short Description
              </label>
              <Input
                value={productForm.short_description}
                onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
                className="bg-white/5 border-white/10"
                placeholder="Brief tagline for the product"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Description *
              </label>
              <Textarea
                required
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-white/5 border-white/10 min-h-[100px]"
                placeholder="Detailed product description..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="bg-white/5 border-white/10 pl-9"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Currency
                </label>
                <Select
                  value={productForm.currency}
                  onValueChange={(val) => setProductForm({ ...productForm, currency: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <Select
                  value={productForm.category}
                  onValueChange={(val) => setProductForm({ ...productForm, category: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="bg-white/5 border-white/10"
                  placeholder="Add a feature..."
                />
                <Button type="button" onClick={addFeature} variant="outline" className="border-white/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {productForm.features.map((feature, i) => (
                  <Badge key={i} className="bg-white/10 text-slate-300 border-0 pr-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="ml-2 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.is_active}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, is_active: checked })}
                />
                <label className="text-sm text-slate-300">Active</label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.is_featured}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, is_featured: checked })}
                />
                <label className="text-sm text-slate-300">Featured</label>
              </div>
            </div>

            {/* Coupon Section - Only show when editing */}
            {editingProduct && (
              <Collapsible
                open={showCouponSection}
                onOpenChange={setShowCouponSection}
                className="border border-white/10 rounded-lg overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Product Coupons</p>
                      <p className="text-xs text-slate-400">
                        {productCoupons.length} coupon{productCoupons.length !== 1 ? 's' : ''} active
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showCouponSection ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-white/10">
                  <div className="p-4 space-y-4">
                    {/* Existing Coupons */}
                    {loadingCoupons ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                      </div>
                    ) : productCoupons.length > 0 ? (
                      <div className="space-y-2">
                        {productCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded font-mono text-sm">
                                  {coupon.code}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyCode(coupon.code)}
                                  className="text-slate-500 hover:text-white transition-colors"
                                >
                                  {copied === coupon.code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <Badge className={`border-0 ${
                                coupon.discount_type === 'percentage' 
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {formatDiscount(coupon)}
                              </Badge>
                              {!coupon.is_active || isExpired(coupon) ? (
                                <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                                  {isExpired(coupon) ? 'Expired' : 'Inactive'}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Active</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                onClick={() => openEditCoupon(coupon)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                                onClick={() => setDeleteCoupon(coupon)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-2">No coupons for this product yet</p>
                    )}

                    {/* Coupon Form */}
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-400" />
                        {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Coupon Code
                          </label>
                          <Input
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                            className="bg-white/5 border-white/10 h-9 text-sm font-mono"
                            placeholder="AUTO-GENERATED"
                            disabled={!!editingCoupon}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Name *
                          </label>
                          <Input
                            required
                            value={couponForm.name}
                            onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                            placeholder="Launch Discount"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Discount Type *
                          </label>
                          <Select
                            value={couponForm.discount_type}
                            onValueChange={(val) => setCouponForm({ ...couponForm, discount_type: val })}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10">
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Discount Value *
                          </label>
                          <div className="relative">
                            {couponForm.discount_type === 'percentage' ? (
                              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            )}
                            <Input
                              required
                              type="number"
                              step="0.01"
                              min="0"
                              max={couponForm.discount_type === 'percentage' ? '100' : undefined}
                              value={couponForm.discount_value}
                              onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                              className={`bg-white/5 border-white/10 h-9 text-sm ${couponForm.discount_type === 'fixed' ? 'pl-8' : ''}`}
                              placeholder={couponForm.discount_type === 'percentage' ? '20' : '500'}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Usage Limit
                          </label>
                          <Input
                            type="number"
                            value={couponForm.usage_limit}
                            onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                            placeholder="-1 = unlimited"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Uses Per Customer
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={couponForm.usage_per_user}
                            onChange={(e) => setCouponForm({ ...couponForm, usage_per_user: e.target.value })}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={couponForm.start_date}
                            onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            End Date
                          </label>
                          <Input
                            type="date"
                            value={couponForm.end_date}
                            onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={couponForm.is_active}
                            onCheckedChange={(checked) => setCouponForm({ ...couponForm, is_active: checked })}
                          />
                          <label className="text-sm text-slate-300">Active</label>
                        </div>

                        <div className="flex items-center gap-2">
                          {editingCoupon && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={resetCouponForm}
                              className="text-slate-400"
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            type="button"
                            onClick={handleSaveCoupon}
                            size="sm"
                            disabled={saving || !couponForm.name || !couponForm.discount_value}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                {editingCoupon ? 'Update' : 'Create'} Coupon
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowProductModal(false)}
                className="text-slate-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent className="bg-[#0F1420] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete &ldquo;{deleteProduct?.name}&rdquo;? 
              {deleteProduct?.sales_count > 0 
                ? ' This product has sales and will be deactivated instead of deleted.'
                : ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Coupon Confirmation */}
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
