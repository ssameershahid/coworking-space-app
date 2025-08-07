import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPriceWithCurrency } from "@/lib/format-price";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Bell, Sparkles } from "lucide-react";
import { CafeOrder } from "@/lib/types";

interface FloatingProfileWidgetProps {
  className?: string;
}

export function FloatingProfileWidget({ className = "" }: FloatingProfileWidgetProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const availableCredits = user.credits - user.used_credits;

  // Fetch notification count (using recent orders as example)
  const { data: recentOrders = [] } = useQuery<CafeOrder[]>({
    queryKey: ["/api/cafe/orders"],
    enabled: !!user,
  });

  const notificationCount = recentOrders.filter((order: CafeOrder) => 
    order.status === 'ready' || order.status === 'preparing'
  ).length;

  // Trigger pulse animation when credits change
  useEffect(() => {
    setPulseAnimation(true);
    const timer = setTimeout(() => setPulseAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, [availableCredits]);

  return (
    <motion.div
      className={`fixed top-6 right-6 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1.15, y: 0 }} // 15% bigger
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.25 }} // Additional hover scale
    >
      <div className="relative flex flex-col items-center">
        {/* Avatar with pulse and glow effects */}
        <motion.div 
          className="relative"
          animate={pulseAnimation ? {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Glow effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.6, scale: 1.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full blur-lg -z-10"
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          {/* Avatar */}
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Avatar className="h-16 w-16 ring-4 ring-white shadow-xl">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-lg font-bold">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Notification Badge */}
          {notificationCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
              whileHover={{ scale: 1.2 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              >
                <Badge 
                  variant="destructive" 
                  className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-lg"
                >
                  {notificationCount}
                </Badge>
              </motion.div>
            </motion.div>
          )}

          {/* Sparkle effect on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-1 -right-1"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Credit Display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3"
        >
          <motion.div
            animate={pulseAnimation ? {
              scale: [1, 1.15, 1],
              y: [0, -2, 0]
            } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-2 rounded-full shadow-lg font-bold text-sm ${
              availableCredits >= 0 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : 'bg-gradient-to-r from-red-500 to-orange-600 text-white'
            }`}
          >
            <motion.span
              key={availableCredits}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatPriceWithCurrency(availableCredits)}
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Floating particles */}
        <AnimatePresence>
          {pulseAnimation && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: 1.5, 
                    x: (Math.random() - 0.5) * 100,
                    y: -50 - Math.random() * 50
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.5, 
                    delay: i * 0.2,
                    ease: "easeOut" 
                  }}
                  className="absolute top-8 left-8 w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Breathing animation for the whole widget */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -z-20 rounded-full bg-white/20 backdrop-blur-sm"
        />
      </div>
    </motion.div>
  );
}

export default FloatingProfileWidget;