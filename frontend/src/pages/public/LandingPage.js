import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Cloud, Server, Zap, Shield, DollarSign, Globe, Users,
  ChevronRight, Check, Star, ArrowRight, Play, Cpu,
  TrendingUp, Lock, Rocket, Award, Clock, Gift,
  CheckCircle2, Loader2, BarChart3, Layers, Tag, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const API = process.env.REACT_APP_BACKEND_URL;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 }
};

// Feature cards data
const features = [
  {
    icon: DollarSign,
    title: 'Passive Income',
    description: 'Earn recurring rewards by hosting apps and workloads on your CloudNode. No active management required.',
    color: '#10B981'
  },
  {
    icon: Shield,
    title: 'Lifetime License',
    description: 'One-time purchase with no monthly fees. Your CloudNode license never expires.',
    color: '#6366F1'
  },
  {
    icon: Zap,
    title: 'Zero Technical Skills',
    description: 'Fully automated setup and operation. If you can browse the web, you can run a CloudNode.',
    color: '#F59E0B'
  },
  {
    icon: Globe,
    title: 'Global Network',
    description: 'Join thousands of independent operators powering the decentralized cloud revolution.',
    color: '#EC4899'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Dashboard',
    description: 'Monitor earnings, performance, and network stats from an intuitive control panel.',
    color: '#06B6D4'
  },
  {
    icon: Lock,
    title: 'Blockchain Secured',
    description: 'Built on Optio blockchain for transparent, immutable record of your contributions and rewards.',
    color: '#8B5CF6'
  },
];

// Stats
const stats = [
  { value: '10,000+', label: 'Active Nodes' },
  { value: '$2.5M+', label: 'Paid to Operators' },
  { value: '99.9%', label: 'Network Uptime' },
  { value: '50+', label: 'Countries' },
];

// How it works steps
const howItWorks = [
  {
    step: 1,
    title: 'Purchase Your CloudNode',
    description: 'Complete your purchase securely with Stripe. No crypto required.',
    icon: Gift
  },
  {
    step: 2,
    title: 'Instant License Activation',
    description: 'Your lifetime license is issued immediately. Access your dashboard right away.',
    icon: Zap
  },
  {
    step: 3,
    title: 'Start Earning',
    description: 'Your node begins hosting apps automatically. Watch your earnings grow daily.',
    icon: TrendingUp
  },
];

// Testimonials
const testimonials = [
  {
    name: 'Michael R.',
    role: 'Node Operator since 2024',
    content: 'I was skeptical at first, but my CloudNode has been earning consistently for 8 months now. Best investment I\'ve made.',
    avatar: 'M'
  },
  {
    name: 'Sarah K.',
    role: 'Former IT Manager',
    content: 'Finally, a way to participate in cloud infrastructure without being a tech expert. The dashboard makes everything simple.',
    avatar: 'S'
  },
  {
    name: 'David L.',
    role: 'Crypto Enthusiast',
    content: 'Love that I own my license forever. No subscriptions, no surprises. Just passive income from the decentralized cloud.',
    avatar: 'D'
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    name: '',
    email: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [error, setError] = useState('');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/api/products/slug/optio-cloudnode`);
      setProduct(response.data);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !product) return;
    
    setCouponLoading(true);
    setCouponError('');
    
    try {
      const response = await axios.post(`${API}/api/coupons/validate`, {
        code: couponCode.trim().toUpperCase(),
        product_id: product.id,
        email: purchaseForm.email || null
      });
      
      setAppliedCoupon(response.data);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError('');
    setCheckoutLoading(true);

    try {
      const response = await axios.post(`${API}/api/purchase/create-checkout`, {
        product_id: product.id,
        email: purchaseForm.email,
        name: purchaseForm.name,
        referral_code: purchaseForm.referralCode || null,
        coupon_code: appliedCoupon?.coupon?.code || null,
        success_url: `${window.location.origin}/purchase-success`,
        cancel_url: `${window.location.origin}?checkout=cancelled`
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create checkout session');
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-[#0B0F1A] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5">
              <Rocket className="w-3.5 h-3.5 mr-2" />
              Next-Gen Cloud Infrastructure
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white font-['Outfit'] leading-tight mb-6">
              Own a Piece of the
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Decentralized Cloud
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              The Optio CloudNode turns you into a cloud infrastructure owner. 
              Earn passive income by powering the apps of tomorrow—no technical skills required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg px-8 py-6 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25"
                onClick={() => setShowPurchaseModal(true)}
              >
                Get Your CloudNode
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-slate-300 text-lg px-8 py-6 hover:bg-white/5"
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-5 h-5 mr-2" />
                How It Works
              </Button>
            </div>

            {/* Price Tag */}
            {product && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                {/* Sale Badge - Centered Above, Outside Box */}
                {product.is_on_sale && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-5 py-2 text-sm font-semibold shadow-lg shadow-orange-500/30">
                    {product.sale_label || 'On Sale'}
                  </Badge>
                )}
                
                {/* Pricing Box */}
                <div className="flex items-center gap-5 bg-white/5 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Node License</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <p className="text-2xl font-bold text-white">{formatPrice(product.price)}</p>
                      {product.regular_price && product.regular_price > product.price && (
                        <p className="text-sm text-slate-500 line-through">{formatPrice(product.regular_price)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-px h-10 bg-white/10" />
                  
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Monthly Operation</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {product.monthly_fee ? `${formatPrice(product.monthly_fee)}/mo` : 'Free'}
                    </p>
                  </div>
                  
                  <div className="w-px h-10 bg-white/10" />
                  
                  <div className="text-center">
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Lifetime License
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Apps add to monthly cost</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose CloudNode?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to participate in the decentralized cloud economy
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  variants={item}
                  className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-transparent to-cyan-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Get started in minutes. No technical expertise required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Connector Line */}
                  {i < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                  )}

                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center relative">
                      <div className="w-24 h-24 rounded-full bg-[#0B0F1A] flex items-center justify-center">
                        <Icon className="w-10 h-10 text-cyan-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Details Section */}
      {product && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Product Visual */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M30%2030m-28%200a28%2028%200%201%200%2056%200a28%2028%200%201%200%20-56%200%22%20stroke%3D%22rgba(34%2C211%2C238%2C0.1)%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
                  
                  <div className="relative">
                    <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                      <Cloud className="w-24 h-24 text-white" />
                    </div>
                    
                    {/* Floating badges */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-4 -right-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-emerald-400 text-sm font-medium">Active</span>
                    </motion.div>
                    
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -bottom-4 -left-4 bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-purple-400 text-sm font-medium">Earning</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  Featured Product
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  {product.name}
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {product.short_description}
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {product.features?.slice(0, 5).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">One-time investment</p>
                    <p className="text-4xl font-bold text-white">{formatPrice(product.price)}</p>
                  </div>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 hover:from-cyan-600 hover:to-blue-600"
                    onClick={() => setShowPurchaseModal(true)}
                  >
                    Purchase Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trusted by Operators Worldwide
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Join thousands of independent node operators earning passive income
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-white/[0.03] rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-slate-500 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.05)%22%2F%3E%3C%2Fsvg%3E')]" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Join the decentralized cloud revolution. Purchase your CloudNode today 
                and start generating passive income.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg px-10 py-6 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25"
                onClick={() => setShowPurchaseModal(true)}
              >
                Get Your CloudNode Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={(open) => {
        setShowPurchaseModal(open);
        if (!open) {
          // Reset coupon state when modal closes
          setAppliedCoupon(null);
          setCouponCode('');
          setCouponError('');
          setError('');
        }
      }}>
        <DialogContent className="bg-[#0F1420] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Purchase CloudNode</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your details to complete your purchase
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePurchase} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <Input
                type="text"
                required
                value={purchaseForm.name}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={purchaseForm.email}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="john@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Your account will be created with this email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Referral Code (Optional)
              </label>
              <Input
                type="text"
                value={purchaseForm.referralCode}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, referralCode: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter referral code"
              />
            </div>

            {/* Coupon Code Section */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1.5" />
                Coupon Code (Optional)
              </label>
              
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-emerald-400 font-medium text-sm">
                          {appliedCoupon.coupon.code}
                        </span>
                        <span className="text-emerald-400/70 text-xs ml-2">
                          ({appliedCoupon.coupon.discount_type === 'percentage' 
                            ? `${appliedCoupon.coupon.discount_value}% off`
                            : `$${appliedCoupon.coupon.discount_value} off`})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-emerald-400/70 text-xs mt-1">
                    You save {formatPrice(appliedCoupon.discount_amount)}!
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    className="bg-white/5 border-white/10 text-white font-mono"
                    placeholder="Enter code"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:bg-white/10 px-4"
                  >
                    {couponLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              )}
              
              {couponError && (
                <p className="text-red-400 text-xs mt-1.5">{couponError}</p>
              )}
            </div>

            {/* Price Summary */}
            {product && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">Lifetime License</p>
                  </div>
                  <p className={`font-bold ${appliedCoupon ? 'text-slate-400 line-through text-base' : 'text-white text-xl'}`}>
                    {formatPrice(product.price)}
                  </p>
                </div>
                
                {appliedCoupon && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-400">Discount ({appliedCoupon.coupon.code})</span>
                      <span className="text-emerald-400">-{formatPrice(appliedCoupon.discount_amount)}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-xl font-bold text-white">{formatPrice(appliedCoupon.final_price)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={checkoutLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-6 hover:from-cyan-600 hover:to-blue-600"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Checkout...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Secure payment powered by Stripe. You&apos;ll be redirected to complete your purchase.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
