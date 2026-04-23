import { motion } from 'motion/react';

interface KineticTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function KineticText({ text, className = "", delay = 0 }: KineticTextProps) {
  // Split split by space to animate words, or by letters
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: delay * 0.3 },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: -45, // SLight 3D skew
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
        duration: 0.8
      },
    },
  };

  return (
    <motion.div
      className={`flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      {words.map((word, idx) => (
        <span key={idx} className="overflow-hidden inline-block mr-[2vw]">
          <motion.span variants={child} className="inline-block origin-bottom">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}
