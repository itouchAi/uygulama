import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';

const cards = [
  { id: 1, src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop", title: "Frame Alpha" },
  { id: 2, src: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2574&auto=format&fit=crop", title: "Frame Beta" },
  { id: 3, src: "https://images.unsplash.com/photo-1603539947678-ebf111de8050?q=80&w=2670&auto=format&fit=crop", title: "Frame Gamma" },
  { id: 4, src: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2574&auto=format&fit=crop", title: "Frame Delta" },
  { id: 5, src: "https://images.unsplash.com/photo-1614850715649-1d0106293bd1?q=80&w=2564&auto=format&fit=crop", title: "Frame Epsilon" },
];

export function FloatingDeck({ onClose }: { onClose: () => void }) {
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Trigger outbound animations before completely unmounting
  const handleReturn = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 1200); // Ensure cards have time to fly out rightwards
  };

  useEffect(() => {
    // Lock background scroll when deck is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-bg/95 flex flex-col pt-12 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6, delay: isExiting ? 0.6 : 0 }} // wrapper fades out last
    >
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
        transition={{ delay: isExiting ? 0 : 0.6, duration: 0.6 }}
        className="absolute top-8 left-8 md:top-12 md:left-12 z-20 pointer-events-none"
      >
         <div className="text-xs uppercase tracking-[0.2em] font-bold text-accent mb-2">Secure Channel</div>
         <div className="text-2xl md:text-3xl font-display font-bold tracking-tighter">DATA FRAMES</div>
      </motion.div>

      {/* Blur Overlay when a card is expanded */}
      <AnimatePresence>
        {activeCardId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md cursor-pointer"
            onClick={() => setActiveCardId(null)}
          />
        )}
      </AnimatePresence>

      {/* Main Area: The Drawer Deck */}
      <div className="flex-1 flex items-center justify-center w-full max-w-[100vw] h-full px-[5vw]">
        <div className="flex flex-row items-center justify-center w-full h-full max-w-7xl -space-x-12 sm:-space-x-20 md:-space-x-28 lg:-space-x-32 pb-16">
          {cards.map((card, idx) => {
            const isExpanded = activeCardId === card.id;
            
            return (
              // The structural flex child spacer
              <div 
                key={card.id} 
                className="relative w-[60vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] aspect-video flex-shrink-0"
                style={{ zIndex: isExpanded ? 200 : idx + 10 }}
              >
                {/* The animated card node. Uses 'layout' to flawlessly jump between the flex container and fixed center! */}
                <motion.div
                  layout
                  initial={{ x: "-100vw", opacity: 0, rotateZ: Math.random() * -10 - 5 }}
                  animate={
                    isExiting 
                      ? { x: "100vw", opacity: 0, rotateZ: 0, y: 0 } // Fly back outward to the right
                      : { 
                          x: 0, 
                          opacity: 1, 
                          rotateZ: 0,
                          y: isExpanded ? 0 : [0, -10, 0] // Subtle float only when in deck
                        }
                  }
                  transition={{ 
                    layout: { type: "spring", stiffness: 180, damping: 20 },
                    x: { type: "spring", damping: 18, stiffness: 80, delay: isExiting ? (cards.length - idx) * 0.1 : idx * 0.15 },
                    opacity: { duration: 0.6, delay: isExiting ? (cards.length - idx) * 0.1 : idx * 0.15 },
                    rotateZ: { type: "spring", damping: 15, stiffness: 100, delay: idx * 0.15 + 0.2 },
                    y: { duration: 4, repeat: isExpanded ? 0 : Infinity, ease: "easeInOut", delay: idx * 0.3 + 1 } 
                  }}
                  className={`${isExpanded ? 'fixed inset-0 m-auto w-[92vw] md:w-[80vw] lg:w-[65vw] max-w-6xl aspect-video cursor-default drop-shadow-2xl' : 'w-full h-full cursor-pointer'}`}
                  style={{ perspective: 3000 }}
                  whileHover={!isExpanded && !isExiting ? { 
                    y: -40, // Pulls up like a file from a drawer
                    scale: 1.05,
                    transition: { duration: 0.3, type: "spring", stiffness: 300 } 
                  } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpanded && !isExiting) setActiveCardId(card.id);
                  }}
                >
                  <motion.div
                    className="w-full h-full relative"
                    animate={{ rotateY: isExpanded ? -180 : 0 }}
                    transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 20 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front thumbnail view */}
                    <div 
                      className={`absolute inset-0 w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/20 bg-zinc-900 group ${!isExpanded ? 'shadow-[-10px_0_30px_rgba(0,0,0,0.4)]' : ''}`}
                      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    >
                      <img src={card.src} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex items-end p-6 md:p-8">
                        <span className="font-bold tracking-[0.2em] uppercase text-white drop-shadow-md border-l-2 border-accent pl-3 text-sm md:text-lg">{card.title}</span>
                      </div>
                    </div>

                    {/* Back side details view */}
                    <div 
                      className="absolute inset-0 w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border-2 border-accent bg-[#0a0a0a] shadow-[0_0_80px_rgba(196,255,97,0.15)] flex flex-col p-6 md:p-14 pointer-events-auto"
                      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(-180deg)" }}
                      onClick={(e) => e.stopPropagation()} // Prevent card details clicks from bubbling to close
                    >
                      {/* Close button on the card */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCardId(null);
                        }}
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-full bg-white/5 hover:bg-white/15 transition-colors text-zinc-400 hover:text-white"
                      >
                        <X size={24} strokeWidth={1.5} />
                      </button>

                      <div className="flex flex-col border-b border-white/10 pb-4 mb-6 mt-4 md:mt-0">
                        <span className="text-[10px] md:text-xs font-mono text-zinc-500 tracking-widest uppercase mb-1">Data Frame Diagnostics</span>
                        <h3 className="text-accent font-display font-bold uppercase tracking-widest text-2xl md:text-4xl">{card.title}</h3>
                      </div>
                      
                      <p className="text-xs sm:text-sm md:text-xl text-text-muted font-medium leading-relaxed max-w-3xl">
                        [SYSTEM_LOG] Initializing granular waveform analysis for active node <span className="text-white">{card.title}</span>. 
                        This spatial transformation isolates the subject for focused diagnostic evaluation and neural synchronicity tracking.
                      </p>

                      <div className="mt-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 bg-white/5 p-4 md:p-6 rounded-xl border border-white/10">
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest">Network Status</div>
                          <div className="font-mono text-accent text-xs md:text-base font-bold flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                            ACTIVE.993
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest">Resonance</div>
                          <div className="font-mono text-white text-xs md:text-base">432.0 Hz</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest">Latency Focus</div>
                          <div className="font-mono text-white text-xs md:text-base">12.4ms</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest">Hash ID</div>
                          <div className="font-mono text-white text-xs md:text-base">#{card.id}12A-FX</div>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer Area with Return Button */}
      <motion.div 
        className="p-8 pb-12 flex justify-center shrink-0 relative z-20 pointer-events-none"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 30 : 0 }}
        transition={{ delay: isExiting ? 0 : 0.8, duration: 0.5 }}
      >
        <button 
          onClick={handleReturn}
          className="pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black hover:bg-accent transition-all duration-300 font-bold text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(196,255,97,0.1)] hover:shadow-[0_0_40px_rgba(196,255,97,0.3)] hover:scale-105 transform active:scale-95"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>Return</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
