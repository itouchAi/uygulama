import { useRef, useState } from "react";
import { motion } from "motion/react";

interface XRayRevealCardProps {
  topImage: string;
  bottomImage: string;
}

export function XRayRevealCard({ topImage, bottomImage }: XRayRevealCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="relative w-full h-full bg-zinc-900 border border-zinc-800 overflow-hidden cursor-crosshair group"
    >
      {/* BASE LAYER: The "Cover" Image (e.g., Dress) */}
      {/* This sits at the back and is always completely visible */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${topImage})` }}
      />

      {/* X-RAY LAYER: The "Revealed" Image (e.g., Underwear) */}
      {/* This sits on top. We apply a spotlight mask to it so it's ONLY visible where the mouse is. */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        animate={{ opacity: opacity }}
        transition={{ duration: 0.3 }}
        style={{ 
          backgroundImage: `url(${bottomImage})`,
          // Smooth gaussian-like fade: strong at the core, quickly softening, then slowly fading to transparent
          WebkitMaskImage: `radial-gradient(100px circle at ${position.x}px ${position.y}px, black 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.2) 70%, transparent 100%)`,
          maskImage: `radial-gradient(100px circle at ${position.x}px ${position.y}px, black 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.2) 70%, transparent 100%)`,
        }}
      />

      {/* Premium UI Overlay Frame */}
      <div className="absolute inset-0 p-8 pointer-events-none flex flex-col justify-end z-10">
        {/* Bottom Footer / Title */}
        <div className="w-full flex justify-between items-end">
          <div className="text-4xl md:text-5xl font-display font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter">
            X-RAY<br/>SCANNER
          </div>
          <div className="text-xs font-mono text-zinc-300 drop-shadow-md text-right">
             <span>HOVER TO REVEAL</span><br/>
             <span className="opacity-50 text-[10px]">SCAN IN PROGRESS</span>
          </div>
        </div>
      </div>
      
      {/* Dynamic Cursor Point */}
      <motion.div 
        className="absolute pointer-events-none flex items-center justify-center mix-blend-overlay z-20"
        animate={{
            x: position.x - 45,
            y: position.y - 45,
            opacity: opacity,
            scale: opacity === 1 ? 1 : 0.8
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
        style={{ width: 90, height: 90 }}
      >
          <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90 shadow-[0_0_10px_rgba(255,255,255,1)]" />
      </motion.div>
    </div>
  );
}
