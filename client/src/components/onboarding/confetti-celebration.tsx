import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
}

interface ConfettiCelebrationProps {
  trigger: boolean;
  duration?: number;
}

const colors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA726", "#AB47BC", 
  "#66BB6A", "#EF5350", "#26A69A", "#42A5F5", "#FFCA28"
];

export default function ConfettiCelebration({ 
  trigger, 
  duration = 3000 
}: ConfettiCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      generateConfetti();
      
      const timer = setTimeout(() => {
        setIsActive(false);
        setConfetti([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  const generateConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    const pieceCount = 50;

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      });
    }

    setConfetti(pieces);
  };

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              initial={{
                x: piece.x,
                y: piece.y,
                rotate: piece.rotation,
                opacity: 1,
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: piece.rotation + 720,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: "easeOut",
              }}
              style={{
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}