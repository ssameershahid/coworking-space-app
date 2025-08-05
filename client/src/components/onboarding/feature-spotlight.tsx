import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface FeatureSpotlightProps {
  features: Array<{
    id: string;
    title: string;
    description: string;
    targetSelector: string;
    position: "top" | "bottom" | "left" | "right";
  }>;
  isVisible: boolean;
  onComplete: () => void;
}

export default function FeatureSpotlight({ 
  features, 
  isVisible, 
  onComplete 
}: FeatureSpotlightProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getSpotlightPosition = () => {
    const feature = features[currentFeature];
    if (!feature) return { top: 0, left: 0, width: 0, height: 0 };

    const element = document.querySelector(feature.targetSelector);
    if (!element) return { top: 0, left: 0, width: 0, height: 0 };

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    };
  };

  const getTooltipPosition = () => {
    const feature = features[currentFeature];
    const spotlightPos = getSpotlightPosition();
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (feature?.position) {
      case "top":
        return {
          top: spotlightPos.top - tooltipHeight - 16,
          left: spotlightPos.left + (spotlightPos.width / 2) - (tooltipWidth / 2),
        };
      case "bottom":
        return {
          top: spotlightPos.top + spotlightPos.height + 16,
          left: spotlightPos.left + (spotlightPos.width / 2) - (tooltipWidth / 2),
        };
      case "left":
        return {
          top: spotlightPos.top + (spotlightPos.height / 2) - (tooltipHeight / 2),
          left: spotlightPos.left - tooltipWidth - 16,
        };
      case "right":
        return {
          top: spotlightPos.top + (spotlightPos.height / 2) - (tooltipHeight / 2),
          left: spotlightPos.left + spotlightPos.width + 16,
        };
      default:
        return { top: 100, left: 100 };
    }
  };

  if (!features.length || !isVisible) return null;

  const spotlightPos = getSpotlightPosition();
  const tooltipPos = getTooltipPosition();
  const feature = features[currentFeature];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{
              background: `radial-gradient(circle at ${spotlightPos.left + spotlightPos.width/2}px ${spotlightPos.top + spotlightPos.height/2}px, transparent ${Math.max(spotlightPos.width, spotlightPos.height)/2 + 10}px, rgba(0,0,0,0.7) ${Math.max(spotlightPos.width, spotlightPos.height)/2 + 50}px)`,
            }}
          />

          {/* Spotlight Ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="fixed z-50 border-4 border-green-400 rounded-lg shadow-lg"
            style={{
              top: spotlightPos.top,
              left: spotlightPos.left,
              width: spotlightPos.width,
              height: spotlightPos.height,
            }}
          >
            {/* Animated pulse ring */}
            <motion.div
              className="absolute inset-0 border-2 border-green-300 rounded-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3 }}
            className="fixed z-50 w-80"
            style={{
              top: Math.max(16, tooltipPos.top),
              left: Math.max(16, Math.min(window.innerWidth - 336, tooltipPos.left)),
            }}
          >
            <Card className="shadow-2xl border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Progress */}
                <div className="flex justify-center space-x-1 mb-4">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-8 rounded-full transition-colors ${
                        index <= currentFeature ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentFeature === 0}
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <span className="text-xs text-gray-500">
                    {currentFeature + 1} of {features.length}
                  </span>

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="flex items-center bg-green-600 hover:bg-green-700"
                  >
                    {currentFeature === features.length - 1 ? "Finish" : "Next"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}