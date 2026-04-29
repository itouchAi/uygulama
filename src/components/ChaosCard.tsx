import { useState, useRef } from 'react';
import { BrushRevealCard } from './BrushRevealCard';
import { LiquidGlitchCard } from './LiquidGlitchCard';
import { PaintDripRevealCard } from './PaintDripRevealCard';
import { PaperTearCard } from './PaperTearCard';
import { OpticalLensCard } from './OpticalLensCard';
import { FireRevealCard } from './FireRevealCard';
import { IceShatterCard } from './IceShatterCard';
import { XRayRevealCard } from './XRayRevealCard';

const EFFECTS = [
  BrushRevealCard,
  LiquidGlitchCard,
  PaintDripRevealCard,
  PaperTearCard,
  OpticalLensCard,
  FireRevealCard,
  IceShatterCard,
  XRayRevealCard
];

export function ChaosCard({ bottomImage = '/color.png' }: { bottomImage?: string }) {
  const [effectIndex, setEffectIndex] = useState(0); 
  const [fade, setFade] = useState(false);
  const clickCountRef = useRef(0);

  const swapRandom = () => {
    setFade(true);
    setTimeout(() => {
        let next = Math.floor(Math.random() * EFFECTS.length);
        while(next === effectIndex) next = Math.floor(Math.random() * EFFECTS.length);
        setEffectIndex(next);
        setFade(false);
    }, 400); // 400ms crossfade
  };

  const handleClickDelaySwap = () => {
      clickCountRef.current += 1;
      const current = clickCountRef.current;
      setTimeout(() => {
          // Only swap if no other clicks happened within this window
          if (clickCountRef.current === current) {
              swapRandom();
          }
      }, 1500); // 1.5s after clicking, it randomizes
  };

  const ActiveComponent = EFFECTS[effectIndex];

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-zinc-900 group" 
      onClick={handleClickDelaySwap}
    >
       <div className={`w-full h-full transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
         <ActiveComponent bottomImage={bottomImage} />
       </div>
       
       <div className="absolute top-4 right-4 z-[50] opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={(e) => { e.stopPropagation(); swapRandom(); }}
           className="bg-black/60 hover:bg-white hover:text-black text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold tracking-widest shadow-xl transition-all flex items-center gap-2 group/btn"
         >
             <span className="group-hover/btn:rotate-180 transition-transform duration-500">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </span>
             <span>SHUFFLE OR CLICK AREA</span>
         </button>
       </div>
    </div>
  );
}
