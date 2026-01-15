import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Star, TrendingUp, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Tier configurations
const tierConfig = {
  Starter: { color: '#94A3B8', icon: Star },
  Builder: { color: '#22C55E', icon: Zap },
  Contributor: { color: '#3B82F6', icon: TrendingUp },
  Champion: { color: '#A855F7', icon: Trophy },
  Legend: { color: '#F59E0B', icon: Trophy },
};

export default function PointsNotification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [lastPoints, setLastPoints] = useState(null);

  // Poll for points changes
  useEffect(() => {
    if (!user) return;

    const checkPoints = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/activity/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (lastPoints !== null && data.total_points > lastPoints) {
            const pointsEarned = data.total_points - lastPoints;
            addNotification({
              points: pointsEarned,
              total: data.total_points,
              tier: data.tier,
              tierUp: data.tier !== lastPoints?.tier
            });
          }
          
          setLastPoints(data.total_points);
        }
      } catch (error) {
        console.error('Failed to check points:', error);
      }
    };

    // Initial fetch
    checkPoints();

    // Poll every 10 seconds
    const interval = setInterval(checkPoints, 10000);
    
    return () => clearInterval(interval);
  }, [user, lastPoints]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => {
          const TierIcon = tierConfig[notification.tier]?.icon || Star;
          const tierColor = tierConfig[notification.tier]?.color || '#94A3B8';
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="relative bg-gradient-to-r from-[#0f1420] to-[#1a1f2e] border border-emerald-500/30 rounded-xl p-4 shadow-xl shadow-emerald-500/10 min-w-[280px]"
            >
              {/* Close button */}
              <button
                onClick={() => removeNotification(notification.id)}
                className="absolute top-2 right-2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-400">
                      +{notification.points}
                    </span>
                    <span className="text-slate-400 text-sm">points</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <TierIcon className="w-4 h-4" style={{ color: tierColor }} />
                    <span className="text-sm text-slate-400">
                      {notification.total.toLocaleString()} total
                    </span>
                    {notification.tierUp && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        Tier Up!
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress bar animation */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-1 bg-emerald-500 rounded-b-xl"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Hook to manually trigger points notification
export function usePointsNotification() {
  const showPointsEarned = useCallback((points, actionName) => {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('points-earned', {
      detail: { points, actionName }
    }));
  }, []);

  return { showPointsEarned };
}
