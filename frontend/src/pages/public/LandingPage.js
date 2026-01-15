import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Cloud, Server, Zap, Shield, DollarSign, Globe, Users,
  ChevronRight, Check, Star, ArrowRight, Play, Cpu,
  TrendingUp, Lock, Rocket, Award, Clock, Gift,
  CheckCircle2, Loader2, BarChart3, Layers, Tag, X,
  CreditCard, AlertCircle
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
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

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

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#64748b',
      },
      iconColor: '#22d3ee',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

// Payment Form Component
function PaymentForm({ product, purchaseForm, appliedCoupon, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Step 1: Create PaymentIntent
      const intentResponse = await axios.post(`${API}/api/purchase/create-payment-intent`, {
        product_id: product.id,
        email: purchaseForm.email,
        name: purchaseForm.name,
        referral_code: purchaseForm.referralCode || null,
        coupon_code: appliedCoupon?.coupon?.code || null
      });

      const { client_secret, order_id, total_first_payment } = intentResponse.data;
      setPaymentDetails({ order_id, amount: total_first_payment });

      // Step 2: Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: purchaseForm.name,
            email: purchaseForm.email,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Step 3: Confirm with backend
        const confirmResponse = await axios.post(`${API}/api/purchase/confirm-payment`, {
          payment_intent_id: paymentIntent.id,
          order_id: order_id
        });

        onSuccess(confirmResponse.data);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const licenseAmount = appliedCoupon ? appliedCoupon.final_price : product.price;
  const monthlyFee = product.monthly_fee || 0;
  const totalDueToday = licenseAmount + monthlyFee;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
          Card Details
        </label>
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{product.name}</p>
            <p className="text-xs text-slate-500">Lifetime License</p>
          </div>
          <p className={`font-bold ${appliedCoupon ? 'text-slate-400 line-through text-base' : 'text-white text-lg'}`}>
            {formatPrice(product.price)}
          </p>
        </div>
        
        {appliedCoupon && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-400">Discount ({appliedCoupon.coupon.code})</span>
            <span className="text-emerald-400">-{formatPrice(appliedCoupon.discount_amount)}</span>
          </div>
        )}
        
        {monthlyFee > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-slate-300">First month service</span>
              <p className="text-xs text-slate-500">Then {formatPrice(monthlyFee)}/month</p>
            </div>
            <span className="text-white">{formatPrice(monthlyFee)}</span>
          </div>
        )}
        
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-white font-medium">Total Due Today</span>
          <span className="text-2xl font-bold text-white">{formatPrice(totalDueToday)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-6 hover:from-cyan-600 hover:to-blue-600"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Pay {formatPrice(totalDueToday)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe. Your card details never touch our servers.</span>
      </div>
    </form>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState('details'); // 'details' | 'payment' | 'success' | 'setPassword'
  const [purchaseForm, setPurchaseForm] = useState({
    name: '',
    email: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [purchaseResult, setPurchaseResult] = useState(null);
  
  // Password creation states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchProduct();
    fetchStripeConfig();
    
    // Check if we should open purchase modal from query param
    if (searchParams.get('purchase') === 'true') {
      setShowPurchaseModal(true);
    }
    
    // Listen for custom event from header "Get Started" button
    const handleOpenPurchaseModal = () => {
      setShowPurchaseModal(true);
    };
    
    window.addEventListener('openPurchaseModal', handleOpenPurchaseModal);
    
    return () => {
      window.removeEventListener('openPurchaseModal', handleOpenPurchaseModal);
    };
  }, [searchParams]);

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

  const fetchStripeConfig = async () => {
    try {
      const response = await axios.get(`${API}/api/purchase/config`);
      const stripe = await loadStripe(response.data.publishable_key);
      setStripePromise(stripe);
    } catch (err) {
      console.error('Failed to load Stripe config:', err);
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

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    if (!purchaseForm.name || !purchaseForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    setPurchaseStep('payment');
  };

  const handlePaymentSuccess = (result) => {
    setPurchaseResult(result);
    // If new user, go to password creation step
    if (result.is_new_user) {
      setPurchaseStep('setPassword');
    } else {
      // Existing user - go straight to dashboard
      localStorage.setItem('token', result.token);
      setPurchaseStep('success');
    }
    toast.success('Payment successful!');
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setSettingPassword(true);
    
    try {
      await axios.put(
        `${API}/api/auth/change-password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${purchaseResult.token}` } }
      );
      
      // Store token and auto-login - navigate directly to dashboard
      localStorage.setItem('token', purchaseResult.token);
      toast.success('Account created! Redirecting to dashboard...');
      
      // Auto-redirect to dashboard after password is set
      navigate('/dashboard');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  const handleCloseModal = () => {
    // If in password step or success step with a purchase, redirect to dashboard
    if ((purchaseStep === 'setPassword' || purchaseStep === 'success') && purchaseResult) {
      localStorage.setItem('token', purchaseResult.token);
      navigate('/dashboard');
      return;
    }
    
    setShowPurchaseModal(false);
    setPurchaseStep('details');
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
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
                <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                  <div className="text-left">
                    <p className="text-sm text-slate-400">License (one-time)</p>
                    <p className="text-3xl font-bold text-white">{formatPrice(product.price)}</p>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div className="text-left">
                    <p className="text-sm text-slate-400">Monthly service</p>
                    <p className="text-2xl font-bold text-cyan-400">{formatPrice(product.monthly_fee)}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  First payment: {formatPrice(product.price + (product.monthly_fee || 0))} (includes first month)
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5">
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
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-slate-500 mt-2">{stat.label}</p>
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
              Why Own a CloudNode?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Join the next generation of cloud infrastructure and earn passive income while contributing to a decentralized future.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From purchase to earning, the entire process takes just minutes
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
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-[#0B0F1A] flex items-center justify-center">
                        <Icon className="w-10 h-10 text-cyan-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
                        {step.step}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

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
      <Dialog open={showPurchaseModal} onOpenChange={handleCloseModal}>
        <DialogContent className="text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {purchaseStep === 'success' ? 'Welcome to Optio!' : 
               purchaseStep === 'setPassword' ? 'Create Your Password' : 
               'Purchase CloudNode'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {purchaseStep === 'details' && 'Enter your details to continue'}
              {purchaseStep === 'payment' && 'Complete your secure payment'}
              {purchaseStep === 'setPassword' && 'Set a password for your new account'}
              {purchaseStep === 'success' && 'Your CloudNode is ready!'}
            </DialogDescription>
          </DialogHeader>

          {/* Step: Details */}
          {purchaseStep === 'details' && (
            <form onSubmit={handleContinueToPayment} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Full Name *
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
                  Email Address *
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
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">Lifetime License</p>
                    </div>
                    <p className={`font-bold ${appliedCoupon ? 'text-slate-400 line-through text-base' : 'text-white text-lg'}`}>
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-400">Discount ({appliedCoupon.coupon.code})</span>
                      <span className="text-emerald-400">-{formatPrice(appliedCoupon.discount_amount)}</span>
                    </div>
                  )}
                  
                  {product.monthly_fee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate-300">First month service</span>
                        <p className="text-xs text-slate-500">Then {formatPrice(product.monthly_fee)}/month</p>
                      </div>
                      <span className="text-white">{formatPrice(product.monthly_fee)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white font-medium">Total Due Today</span>
                    <span className="text-2xl font-bold text-white">
                      {formatPrice(
                        (appliedCoupon ? appliedCoupon.final_price : product.price) + 
                        (product.monthly_fee || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-6 hover:from-cyan-600 hover:to-blue-600"
              >
                Continue to Payment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          )}

          {/* Step: Payment */}
          {purchaseStep === 'payment' && product && stripePromise && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPurchaseStep('details')}
                className="mb-4 text-slate-400 hover:text-white -ml-2"
              >
                <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                Back to details
              </Button>
              
              <Elements stripe={stripePromise}>
                <PaymentForm
                  product={product}
                  purchaseForm={purchaseForm}
                  appliedCoupon={appliedCoupon}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setPurchaseStep('details')}
                />
              </Elements>
            </div>
          )}

          {/* Step: Set Password (for new users) */}
          {purchaseStep === 'setPassword' && purchaseResult && (
            <form onSubmit={handleSetPassword} className="mt-4 space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-slate-400 text-sm">Payment successful! Now create your password.</p>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Create Password *
                </label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter password (min 8 characters)"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Confirm your password"
                  minLength={8}
                />
              </div>

              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Your email</span>
                  <span className="text-white">{purchaseResult.user?.email}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={settingPassword}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-6 hover:from-cyan-600 hover:to-blue-600"
              >
                {settingPassword ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account & Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step: Success */}
          {purchaseStep === 'success' && purchaseResult && (
            <div className="mt-4 space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">You're All Set!</h3>
                <p className="text-slate-400 text-sm">Your CloudNode license has been activated.</p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">License Key</span>
                  <span className="text-cyan-400 font-mono text-sm">{purchaseResult.license?.license_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Email</span>
                  <span className="text-white text-sm">{purchaseResult.user?.email}</span>
                </div>
              </div>

              <p className="text-sm text-slate-400 text-center">
                A confirmation email has been sent to your address.
              </p>

              <Button
                onClick={handleCloseModal}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-6"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
