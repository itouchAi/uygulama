import { useRef, useState, useEffect } from 'react';
import { motion, useSpring } from 'motion/react';

const TEXT = "FLUID";

export function MagneticTypographyCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  // Springs for the cursor blob to smooth out its movement slightly
  const cursorX = useSpring(-100, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(-100, { stiffness: 500, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      // Offset by half the blob size (64px / 2 = 32px) to center it on cursor
      cursorX.set(x - 32);
      cursorY.set(y - 32);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full bg-zinc-900 border border-border rounded-[16px] overflow-hidden cursor-crosshair"
    >
      {/* SVG Gooey Filter Definition with stronger fluid values */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix 
               in="blur" 
               mode="matrix" 
               values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" 
               result="goo" 
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Gooey Layer Container - covers whole card so blob can travel anywhere */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        style={{ filter: 'url(#goo)' }}
      >
        {/* The Text Layout */}
        <div className="flex">
          {TEXT.split('').map((char, index) => (
            <MagneticLetter
              key={index}
              char={char}
              mousePos={mousePos}
              isHovered={isHovered}
              containerRef={containerRef}
            />
          ))}
        </div>

        {/* The Liquid Cursor Blob */}
        {/* This physical blob merges with the text inside the gooey filter */}
        <motion.div
           className="absolute top-0 left-0 w-16 h-16 bg-white rounded-full mix-blend-normal"
           style={{ 
             x: cursorX, 
             y: cursorY, 
             opacity: isHovered ? 1 : 0,
             scale: isHovered ? 1 : 0
           }}
           transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
        />
      </div>
    </div>
  );
}

interface MagneticLetterProps {
  char: string;
  mousePos: { x: number; y: number };
  isHovered: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function MagneticLetter({ char, mousePos, isHovered, containerRef }: MagneticLetterProps) {
  const letterRef = useRef<HTMLSpanElement>(null);
  
  // Stiffness and damping for the text snapping back
  const springX = useSpring(0, { stiffness: 400, damping: 15, mass: 0.5 });
  const springY = useSpring(0, { stiffness: 400, damping: 15, mass: 0.5 });
  const scale = useSpring(1, { stiffness: 400, damping: 15, mass: 0.5 });

  useEffect(() => {
    if (!isHovered || !letterRef.current || !containerRef.current) {
      springX.set(0);
      springY.set(0);
      scale.set(1);
      return;
    }

    const rect = letterRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const charCenterX = (rect.left - containerRect.left) + rect.width / 2;
    const charCenterY = (rect.top - containerRect.top) + rect.height / 2;

    const dx = mousePos.x - charCenterX;
    const dy = mousePos.y - charCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Magnetic pull radius
    const radius = 120;
    
    if (distance < radius) {
      const pullRatio = (radius - distance) / radius;
      // We pull the letters TOWARDS the mouse (positive force) so they stick to the liquid blob
      const pullForce = 45; 
      
      springX.set((dx / distance) * pullRatio * pullForce);
      springY.set((dy / distance) * pullRatio * pullForce);
      scale.set(1 - pullRatio * 0.1); // Slightly constrict like stretched liquid
    } else {
      springX.set(0);
      springY.set(0);
      scale.set(1);
    }
  }, [mousePos, isHovered, springX, springY, scale]);

  return (
    <motion.span
      ref={letterRef}
      style={{ x: springX, y: springY, scale }}
      className="inline-block text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter text-white px-1 select-none origin-center drop-shadow-md"
    >
      {char}
    </motion.span>
  );
}
