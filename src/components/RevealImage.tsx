import { motion } from 'motion/react';

interface RevealImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  delay?: number;
}

export function RevealImage({ src, alt, className = "", containerClassName = "", delay = 0 }: RevealImageProps) {
  return (
    <motion.div
      className={`relative overflow-hidden ${containerClassName}`}
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <motion.img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover origin-center ${className}`}
        initial={{ scale: 1.2 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: delay + 0.1 }}
      />
    </motion.div>
  );
}
