import { useRef, useState } from "react";
import { motion } from "motion/react";

export function SpotlightCard() {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div 
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="relative w-full h-full bg-zinc-950 overflow-hidden cursor-crosshair group"
    >
      {/* Base Layer (Dark/Inactive state) */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-800">EXP_01</span>
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-800">[LOCKED]</span>
        </div>
        
        <div className="text-4xl md:text-5xl font-display font-bold text-zinc-800/80 tracking-tighter">
          X-RAY<br/>SCANNER
        </div>
        
        <div className="text-xs font-mono text-zinc-800 flex justify-between">
           <span>HOVER TO REVEAL</span>
           <span>SYS_OFFLINE</span>
        </div>
      </div>

      {/* Reveal Layer (Bright/Detailed state revealed by spotlight) */}
      <motion.div 
        animate={{ opacity: opacity }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-accent p-8 flex flex-col justify-between pointer-events-none"
        style={{
          WebkitMaskImage: `radial-gradient(150px circle at ${position.x}px ${position.y}px, black 30%, transparent 100%)`,
          maskImage: `radial-gradient(150px circle at ${position.x}px ${position.y}px, black 30%, transparent 100%)`,
        }}
      >
        <div className="flex justify-between items-start z-10">
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-900 border border-zinc-900 px-2 py-1 rounded bg-zinc-900/10 backdrop-blur-md">EXP_01</span>
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-900 animate-pulse">[UNLOCKED]</span>
        </div>
        
        {/* A decorative grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ 
                 backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', 
                 backgroundSize: '16px 16px'
             }} 
        />
        
        <div className="z-10 text-4xl md:text-5xl font-display font-bold text-zinc-900 tracking-tighter drop-shadow-sm mix-blend-hard-light">
          SYSTEM<br/>BLUEPRINT
        </div>
        
        <div className="z-10 text-xs font-mono text-zinc-900 flex justify-between font-bold mix-blend-color-burn">
           <span>COORD: {Math.round(position.x)}.{Math.round(position.y)}</span>
           <span>DIAGNOSTIC_RUNNING</span>
        </div>

        {/* Additional decorative elements simulating a blueprint */}
        <div className="absolute bottom-16 right-8 w-24 h-24 border border-zinc-900/30 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 border border-zinc-900/40 rounded-full flex items-center justify-center border-dashed animate-[spin_10s_linear_infinite]">
                 <div className="w-8 h-8 bg-zinc-900/20 rounded-full" />
            </div>
        </div>

        {/* Scan line effect inside the revealed area */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-zinc-900/30 blur-[1px] animate-[ping_2s_ease-in-out_infinite]" />
      </motion.div>
    </div>
  );
}
