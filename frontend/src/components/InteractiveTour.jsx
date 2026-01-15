import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tourSteps = [
  {
    id: 'dashboard',
    target: '[data-testid="node-health-widget"]',
    title: 'Node Health',
    description: 'Monitor your node\'s performance, uptime, and reliability score here.',
    position: 'bottom'
  },
  {
    id: 'earnings',
    target: '[data-testid="today-usd-widget"]',
    title: 'Today\'s Earnings',
    description: 'Track your daily revenue from app subscriptions in real-time.',
    position: 'bottom'
  },
  {
    id: 'opt-rewards',
    target: '[data-testid="today-opt-widget"]',
    title: 'OPT Rewards',
    description: 'See your OPT points earned from referrals, signups, and daily activities.',
    position: 'bottom'
  },
  {
    id: 'apps',
    target: '[data-testid="installed-apps-widget"]',
    title: 'Installed Apps',
    description: 'View and manage the apps running on your node. Each app generates revenue!',
    position: 'top'
  },
  {
    id: 'promotion',
    target: '[data-testid="promotion-widget"]',
    title: 'Grow Your Rewards',
    description: 'Access promotion tools to earn more OPT by referring operators and driving signups.',
    position: 'top'
  },
];

export default function InteractiveTour({ isActive, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateTargetPosition = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);
      
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setIsVisible(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (isActive) {
      // Small delay to allow DOM to render
      const timeout = setTimeout(updateTargetPosition, 500);
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition);
      
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('resize', updateTargetPosition);
        window.removeEventListener('scroll', updateTargetPosition);
      };
    }
  }, [isActive, currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (!isActive || !isVisible || !targetRect) {
    return null;
  }

  const step = tourSteps[currentStep];
  const padding = 8;
  
  // Calculate tooltip position
  const getTooltipStyle = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    
    let top, left;
    
    if (step.position === 'bottom') {
      top = targetRect.bottom + padding + 12;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    } else if (step.position === 'top') {
      top = targetRect.top - tooltipHeight - padding - 12;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    } else if (step.position === 'right') {
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.right + padding + 12;
    } else {
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.left - tooltipWidth - padding - 12;
    }
    
    // Keep within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
    
    return { top, left, width: tooltipWidth };
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              // Cut out the highlighted element
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${targetRect.left - padding}px 100%, 
                ${targetRect.left - padding}px ${targetRect.top - padding}px, 
                ${targetRect.right + padding}px ${targetRect.top - padding}px, 
                ${targetRect.right + padding}px ${targetRect.bottom + padding}px, 
                ${targetRect.left - padding}px ${targetRect.bottom + padding}px, 
                ${targetRect.left - padding}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
          />

          {/* Highlight Border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[101] pointer-events-none"
            style={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
              border: '2px solid #06b6d4',
              borderRadius: '12px',
              boxShadow: '0 0 0 4px rgba(6, 182, 212, 0.2), 0 0 20px rgba(6, 182, 212, 0.3)'
            }}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: step.position === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed z-[102] bg-[#0f111a] border border-white/10 rounded-xl shadow-2xl"
            style={tooltipStyle}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400">Step {currentStep + 1} of {tourSteps.length}</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-white font-semibold mt-2">{step.title}</h3>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-slate-400 text-sm">{step.description}</p>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-slate-400 hover:text-white h-8"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>

              <div className="flex items-center gap-1">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentStep ? 'bg-cyan-400' : i < currentStep ? 'bg-cyan-400/50' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-8"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tourSteps.length - 1 && <ArrowRight className="w-3 h-3 ml-1" />}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
