import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, Minus } from "lucide-react";

interface CreditAnimationProps {
  currentCredits: number;
  previousCredits?: number;
  showAnimation?: boolean;
  className?: string;
}

interface AnimationItem {
  id: string;
  type: "add" | "subtract";
  amount: number;
  timestamp: number;
}

export function CreditAnimation({ 
  currentCredits, 
  previousCredits, 
  showAnimation = true,
  className = "" 
}: CreditAnimationProps) {
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [displayCredits, setDisplayCredits] = useState(currentCredits);

  useEffect(() => {
    if (previousCredits !== undefined && previousCredits !== currentCredits && showAnimation) {
      const difference = currentCredits - previousCredits;
      const newAnimation: AnimationItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: difference > 0 ? "add" : "subtract",
        amount: Math.abs(difference),
        timestamp: Date.now()
      };

      setAnimations(prev => [...prev, newAnimation]);

      // Animate the credit counter
      let start = previousCredits;
      const duration = 800;
      const startTime = Date.now();

      const animateCounter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (difference * easeOutQuart);
        
        setDisplayCredits(Math.round(current * 10) / 10); // Round to 1 decimal
        
        if (progress < 1) {
          requestAnimationFrame(animateCounter);
        } else {
          setDisplayCredits(currentCredits);
        }
      };

      requestAnimationFrame(animateCounter);

      // Remove animation after it completes
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
      }, 2000);
    } else {
      setDisplayCredits(currentCredits);
    }
  }, [currentCredits, previousCredits, showAnimation]);

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Credit Icon with Pulse */}
      <motion.div
        animate={showAnimation && animations.length > 0 ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Coins className="h-5 w-5 text-amber-500" />
        
        {/* Floating particles */}
        <AnimatePresence>
          {animations.map((anim) => (
            <motion.div
              key={anim.id}
              initial={{ opacity: 1, scale: 0.8, y: 0 }}
              animate={{ 
                opacity: 0, 
                scale: 1.2, 
                y: anim.type === "add" ? -30 : 30,
                x: Math.random() * 20 - 10
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-0 pointer-events-none"
            >
              <div className={`flex items-center gap-1 text-sm font-bold ${
                anim.type === "add" ? "text-green-500" : "text-red-500"
              }`}>
                {anim.type === "add" ? (
                  <Plus className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {anim.amount}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Credit Display with Counter Animation */}
      <motion.span
        key={displayCredits}
        initial={showAnimation && animations.length > 0 ? { scale: 1.1 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`font-semibold text-lg ${
          currentCredits < 0 ? "text-red-600" : "text-gray-700"
        }`}
      >
        {displayCredits % 1 === 0 ? displayCredits : displayCredits.toFixed(1)}
      </motion.span>

      {/* Glow Effect */}
      <AnimatePresence>
        {showAnimation && animations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full bg-amber-200 blur-md -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing credit changes
export function useCreditAnimation(credits: number) {
  const [previousCredits, setPreviousCredits] = useState<number | undefined>(undefined);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (previousCredits !== undefined && previousCredits !== credits) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
    setPreviousCredits(credits);
  }, [credits, previousCredits]);

  return { previousCredits, showAnimation };
}