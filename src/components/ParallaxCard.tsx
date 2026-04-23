import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';

interface ParallaxCardProps {
  bgSrc: string;
  fgSrc: string;
  className?: string;
}

export function ParallaxCard({ bgSrc, fgSrc, className = "" }: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Tilt of the entire scene max 12 degrees for intense gyro feel
  const rotateX = useTransform(smoothY, [-1, 1], [15, -15]);
  const rotateY = useTransform(smoothX, [-1, 1], [-15, 15]);

  // Pure 2D Parallax shifts inside the 3D tilted container
  const bgX = useTransform(smoothX, [-1, 1], ['3%', '-3%']);
  const bgY = useTransform(smoothY, [-1, 1], ['3%', '-3%']);
  
  const fgX = useTransform(smoothX, [-1, 1], ['-5%', '5%']);
  const fgY = useTransform(smoothY, [-1, 1], ['-5%', '5%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Using a slightly smaller denominator to make the edges reachable easier
    const xPos = (e.clientX - centerX) / (rect.width / 2);
    const yPos = (e.clientY - centerY) / (rect.height / 2);
    
    mouseX.set(xPos);
    mouseY.set(yPos);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div 
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
    >
      <motion.div 
        ref={ref}
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative"
      >
        {/* Background Layer: Fully matching size, scaled up 1.2 to hide edges during parallax offset & extreme tilt */}
        <motion.div 
          style={{ x: bgX, y: bgY, z: -10 }}
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        >
          <img 
            src={bgSrc} 
            alt="Background"
            className="w-full h-full object-cover scale-[1.2]" 
          />
        </motion.div>
        
        {/* Foreground Layer: Identical scale, but pushed visually via intense drop-shadow */}
        <motion.div
           style={{ x: fgX, y: fgY, z: 30 }}
           className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <img 
            src={fgSrc} 
            alt="Foreground Character"
            className="w-full h-full object-cover scale-[1.2]"
            style={{ filter: "drop-shadow(20px 40px 40px rgba(0,0,0,0.95)) drop-shadow(0px 10px 15px rgba(0,0,0,0.8))" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
