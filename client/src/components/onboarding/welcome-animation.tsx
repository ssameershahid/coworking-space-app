import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Coffee, Users, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface WelcomeAnimationProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to CalmKaaj! 🎉",
    description: "Your new coworking space awaits",
    icon: Sparkles,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "cafe",
    title: "Grab a Coffee ☕",
    description: "Order from our delicious café menu",
    icon: Coffee,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    id: "community",
    title: "Meet Your Community 👥",
    description: "Connect with fellow coworkers",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "rooms",
    title: "Book Meeting Rooms 📅",
    description: "Reserve spaces for your meetings",
    icon: Calendar,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
];

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Auto-advance steps
    if (currentStep < onboardingSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  const currentStepData = onboardingSteps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md mx-4"
          >
            <Card className="overflow-hidden border-0 shadow-2xl">
              <CardContent className="p-0">
                {/* Animated Background */}
                <motion.div
                  className="relative h-64 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 overflow-hidden"
                  initial={{ backgroundPosition: "0% 50%" }}
                  animate={{ backgroundPosition: "100% 50%" }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  {/* Floating Elements */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-4 h-4 bg-white/20 rounded-full"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${30 + (i % 2) * 40}%`,
                        }}
                        animate={{
                          y: [-10, 10, -10],
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 3 + i * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Main Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      key={currentStep}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.8 }}
                      className={`w-20 h-20 rounded-full ${currentStepData.bgColor} flex items-center justify-center shadow-lg`}
                    >
                      <IconComponent className={`w-10 h-10 ${currentStepData.color}`} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content */}
                <div className="p-8 text-center">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {user?.first_name && currentStep === 0 
                        ? `Welcome ${user.first_name}! 🎉`
                        : currentStepData.title
                      }
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {currentStepData.description}
                    </p>
                  </motion.div>

                  {/* Progress Indicators */}
                  <div className="flex justify-center space-x-2 mb-6">
                    {onboardingSteps.map((_, index) => (
                      <motion.div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index <= currentStep ? "bg-green-500" : "bg-gray-300"
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: index <= currentStep ? 1.2 : 1 }}
                        transition={{ delay: index * 0.1 }}
                      />
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleComplete}
                      className="flex-1"
                    >
                      Skip Tour
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      {currentStep === onboardingSteps.length - 1 ? (
                        <>
                          Get Started
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Fun Fact */}
                  {currentStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-4 text-xs text-gray-500"
                    >
                      ✨ Fun fact: You're about to join an amazing community!
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}