import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Coins, Trophy, Users, Flame, Gift, ArrowRight, ArrowLeft,
  Sparkles, Target, CheckCircle2, X, Rocket, Star, Zap,
  Share2, Crown, Medal, TrendingUp, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Optio! 🎉',
    subtitle: 'Let\'s show you how to earn OPT Points',
    content: (
      <div className="text-center py-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
          <Coins className="w-12 h-12 text-white" />
        </div>
        <p className="text-slate-300 max-w-sm mx-auto">
          OPT Points are your rewards for being an active part of the Optio ecosystem. 
          The more you contribute, the more you earn!
        </p>
      </div>
    ),
    icon: Coins,
    color: 'cyan'
  },
  {
    id: 'earning',
    title: 'How to Earn Points',
    subtitle: 'Multiple ways to grow your balance',
    content: (
      <div className="space-y-3 py-4">
        {[
          { icon: Flame, label: 'Daily Login', points: '25 pts/day', color: '#EF4444', desc: 'Log in every day' },
          { icon: Users, label: 'Refer Friends', points: '500 pts', color: '#EC4899', desc: 'Each node operator signup' },
          { icon: Share2, label: 'Share Referral Link', points: '100 pts', color: '#6366F1', desc: 'First share bonus' },
          { icon: Gift, label: 'Install Apps', points: '300 pts', color: '#F59E0B', desc: 'Each app installed' },
          { icon: TrendingUp, label: 'Drive Signups', points: '2-50 pts', color: '#10B981', desc: 'Per app user signup' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <Badge className="shrink-0 border-0 text-xs" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
              +{item.points}
            </Badge>
          </motion.div>
        ))}
      </div>
    ),
    icon: Zap,
    color: 'emerald'
  },
  {
    id: 'streaks',
    title: 'Streak Bonuses',
    subtitle: 'Consistency is rewarded!',
    content: (
      <div className="py-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Flame className="w-8 h-8 text-orange-400" />
          <p className="text-slate-300">Log in daily to maintain your streak</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { days: 7, points: 100 },
            { days: 30, points: 300 },
            { days: 90, points: 750 },
            { days: 365, points: 2000 },
          ].map((milestone, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20 text-center"
            >
              <p className="text-white font-bold text-lg">{milestone.days} Days</p>
              <Badge className="bg-orange-500/20 text-orange-400 border-0 mt-1">
                +{milestone.points} pts
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    icon: Flame,
    color: 'orange'
  },
  {
    id: 'tiers',
    title: 'Tier System',
    subtitle: 'Level up as you earn more',
    content: (
      <div className="py-4">
        <div className="space-y-2">
          {[
            { name: 'Starter', points: '0', icon: Star, gradient: 'from-slate-400 to-slate-600' },
            { name: 'Builder', points: '1K', icon: Zap, gradient: 'from-emerald-400 to-emerald-600' },
            { name: 'Contributor', points: '5K', icon: Medal, gradient: 'from-blue-400 to-blue-600' },
            { name: 'Champion', points: '25K', icon: Crown, gradient: 'from-purple-400 to-purple-600' },
            { name: 'Legend', points: '100K', icon: Trophy, gradient: 'from-amber-400 to-orange-500' },
          ].map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.gradient} flex items-center justify-center`}>
                <tier.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{tier.name}</p>
              </div>
              <span className="text-xs text-slate-400">{tier.points}+ pts</span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    icon: Crown,
    color: 'purple'
  },
  {
    id: 'getstarted',
    title: 'You\'re All Set!',
    subtitle: 'Start earning OPT Points today',
    content: (
      <div className="text-center py-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <p className="text-slate-300 max-w-sm mx-auto mb-4">
          You've earned <span className="text-cyan-400 font-bold">+200 OPT</span> just for completing this tutorial!
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Daily Login: +25</Badge>
          <Badge className="bg-purple-500/20 text-purple-400 border-0">Referrals: +500</Badge>
          <Badge className="bg-amber-500/20 text-amber-400 border-0">Install Apps: +300</Badge>
        </div>
      </div>
    ),
    icon: Rocket,
    color: 'emerald'
  },
];

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    onComplete?.();
    onClose();
  };

  const handleLearnMore = () => {
    handleComplete();
    navigate('/dashboard/how-to-earn');
  };

  const step = steps[currentStep];
  const colorClasses = {
    cyan: 'from-cyan-500 to-blue-500',
    emerald: 'from-emerald-500 to-cyan-500',
    orange: 'from-orange-500 to-red-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[#0f111a] border-white/10">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colorClasses[step.color]} p-6 relative`}>
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <step.icon className="w-6 h-6 text-white" />
            <span className="text-white/80 text-sm">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <h2 className="text-xl font-bold text-white">{step.title}</h2>
          <p className="text-white/80 text-sm mt-1">{step.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {step.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep 
                  ? 'w-6 bg-cyan-500' 
                  : i < currentStep 
                    ? 'bg-cyan-500/50' 
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep === steps.length - 1 && (
              <Button
                variant="outline"
                onClick={handleLearnMore}
                className="border-white/10 text-slate-300 hover:bg-white/10"
              >
                Learn More
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`bg-gradient-to-r ${colorClasses[step.color]} text-white`}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <Rocket className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
