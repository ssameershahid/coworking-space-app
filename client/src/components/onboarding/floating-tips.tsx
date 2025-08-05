import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, Coffee, Users, Calendar, Star } from "lucide-react";

const tips = [
  {
    id: "coffee-tip",
    icon: Coffee,
    title: "Pro Tip: Daily Specials!",
    description: "Check out our daily specials in the café menu - they're always something delicious and budget-friendly!",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    id: "community-tip",
    icon: Users,
    title: "Building Connections",
    description: "Update your profile with your skills and interests to help other members find common ground with you.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "booking-tip",
    icon: Calendar,
    title: "Smart Booking",
    description: "Book meeting rooms in advance! Popular time slots fill up quickly, especially during peak hours.",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    id: "credits-tip",
    icon: Star,
    title: "Credit Management",
    description: "Your credits refresh monthly! Use them for meeting rooms and special café items throughout the month.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

interface FloatingTipsProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function FloatingTips({ isVisible, onDismiss }: FloatingTipsProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const showTimer = setTimeout(() => {
        setShowTip(true);
      }, 5000); // Show first tip after 5 seconds

      return () => clearTimeout(showTimer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (showTip) {
      const cycleTimer = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 8000); // Show each tip for 8 seconds

      return () => clearInterval(cycleTimer);
    }
  }, [showTip]);

  const handleDismiss = () => {
    setShowTip(false);
    onDismiss();
  };

  if (!isVisible || !showTip) return null;

  const tip = tips[currentTip];
  const IconComponent = tip.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="fixed bottom-6 right-6 z-40 max-w-sm"
      >
        <Card className={`shadow-lg ${tip.borderColor} border-2 ${tip.bgColor}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`p-2 rounded-full ${tip.bgColor} border ${tip.borderColor}`}
              >
                <IconComponent className={`w-5 h-5 ${tip.color}`} />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.h4
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-semibold text-gray-900 mb-1"
                >
                  {tip.title}
                </motion.h4>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-gray-600 leading-relaxed"
                >
                  {tip.description}
                </motion.p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress indicator */}
            <div className="flex space-x-1 mt-3">
              {tips.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1 rounded-full flex-1 ${
                    index === currentTip ? tip.color.replace('text-', 'bg-') : 'bg-gray-200'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index === currentTip ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}