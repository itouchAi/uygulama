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
          // Black = Show the X-ray layer. Transparent = Hide it (showing the dress underneath).
          WebkitMaskImage: `radial-gradient(150px circle at ${position.x}px ${position.y}px, black 30%, transparent 100%)`,
          maskImage: `radial-gradient(150px circle at ${position.x}px ${position.y}px, black 30%, transparent 100%)`,
        }}
      />

      {/* UI Overlay */}
      <div className="absolute top-6 p-6 pointer-events-none z-10 w-full">
        <div className="flex justify-between items-start w-full gap-4">
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white drop-shadow-md border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded">X-RAY LENS ACTIVE</span>
        </div>
      </div>
      
      {/* Dynamic Cursor Ring */}
      <motion.div 
        className="absolute pointer-events-none border border-white/60 rounded-full flex items-center justify-center mix-blend-overlay z-20 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        animate={{
            x: position.x - 75,
            y: position.y - 75,
            opacity: opacity,
            scale: opacity === 1 ? 1 : 0.8
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
        style={{ width: 150, height: 150 }}
      >
          <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
      </motion.div>
    </div>
  );
}
