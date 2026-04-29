import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { KineticText } from './components/KineticText';
import { RevealImage } from './components/RevealImage';
import { FloatingDeck } from './components/FloatingDeck';
import { ParallaxCard } from './components/ParallaxCard';
import { DepthMapCard } from './components/DepthMapCard';
import { SpotlightCard } from './components/SpotlightCard';
import { XRayRevealCard } from './components/XRayRevealCard';
import { BrushRevealCard } from './components/BrushRevealCard';
import { LiquidGlitchCard } from './components/LiquidGlitchCard';
import { PaintDripRevealCard } from './components/PaintDripRevealCard';
import { PaperTearCard } from './components/PaperTearCard';
import { OpticalLensCard } from './components/OpticalLensCard';
import { FireRevealCard } from './components/FireRevealCard';
import { IceShatterCard } from './components/IceShatterCard';
import { ChaosCard } from './components/ChaosCard';

export default function App() {
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [revealImageSrc, setRevealImageSrc] = useState('/color.png');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRevealImageSrc(url);
    }
  };
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax transform for hero background
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div ref={containerRef} className="font-sans antialiased bg-bg text-text-primary selection:bg-accent selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center mix-blend-difference text-white">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-xl font-bold tracking-tighter italic"
        >
          STUDIO.AI
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="hidden md:flex gap-6 text-sm font-medium bento-card py-2 px-6"
        >
          <span className="text-white hover:text-accent cursor-pointer transition-colors">INTERFACE</span>
          <span className="text-text-muted hover:text-white cursor-pointer transition-colors">WAVEFORM</span>
          <span className="text-text-muted hover:text-white cursor-pointer transition-colors">SYNTHESIS</span>
        </motion.div>
        <motion.button 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex items-center gap-2 uppercase text-xs font-bold tracking-wider hover:text-accent transition-colors"
        >
          <Menu size={20} strokeWidth={2} />
          <span>Menu</span>
        </motion.button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col p-4 md:p-6 mt-20">
        <div className="flex-1 bento-card bg-zinc-900/30 w-full overflow-hidden relative group">
          <motion.div 
            style={{ y: yBg }} 
            className="absolute inset-0 z-0 pointer-events-none h-[120%]"
          >
             <video 
               autoPlay 
               loop 
               muted 
               playsInline 
               className="w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
             >
               {/* Local video sourced from public folder */}
               <source src="/arkaplan.mp4" type="video/mp4" />
             </video>
          </motion.div>
          
          <div className="z-10 relative h-full flex flex-col justify-end p-4 md:p-8">
            <div className="mb-4 overflow-hidden">
              <motion.div
                 initial={{ opacity: 0, x: -50 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 1, delay: 0.5 }}
                 className="flex items-center gap-4 text-xs uppercase tracking-[0.15em] mb-4 text-text-muted font-bold"
              >
                 <span><div className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block mr-2"></div>Core Processing</span>
              </motion.div>
            </div>
            
            <KineticText 
              text="ADVANCED" 
              className="font-display font-bold text-[12vw] leading-[0.8] tracking-tighter" 
              delay={0.2}
            />
            <div className="flex flex-wrap items-end gap-x-[3vw]">
              <div className="font-display font-bold text-[12vw] leading-[0.8] tracking-tighter text-accent underline underline-offset-[1vw]">
                KINETIC
              </div>
              <KineticText 
                text="SYNTHESIS." 
                className="font-display font-bold text-[12vw] leading-[0.8] tracking-tighter" 
                delay={0.4}
              />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 gap-8">
              <p className="text-text-muted max-w-sm text-sm leading-relaxed">
                Next generation visual engine designed for high-fidelity interactive experiences and motion mapping.
              </p>
              <div 
                onClick={() => setIsEngineInitialized(true)}
                className="px-6 py-3 bg-accent text-black rounded-full font-bold text-xs tracking-widest cursor-pointer hover:bg-white transition-colors"
               >
                INITIALIZE ENGINE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section - Bento Grid */}
      <section className="w-full px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          
          {/* Main Statement */}
          <div className="bento-card md:col-span-4 flex flex-col justify-center bg-zinc-900/30">
            <KineticText 
              text="CRAFTING EXPERIENCES" 
              className="font-display text-4xl md:text-5xl leading-[1] font-bold tracking-tight mb-2"
            />
            <div className="text-accent text-3xl md:text-4xl font-bold tracking-tight mb-8">THROUGH MOVEMENT.</div>
            
            <div className="flex flex-col gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="border-t border-border pt-4"
              >
                <h3 className="bento-label">The Process</h3>
                <p className="text-sm font-medium text-text-muted leading-relaxed">
                  We focus on the intersection between minimal design and fluid motion. Every transition is an intentional decision.
                </p>
              </motion.div>
            </div>
          </div>

          {/* AI Depth Map Parallax Card */}
          <div className="bento-card md:col-span-4 p-0 overflow-hidden relative aspect-[3/4] md:aspect-[4/5] bg-zinc-900 border border-zinc-800">
             <DepthMapCard 
               imageSrc={revealImageSrc}
               depthMapSrc="/depth.png"
               className="w-full h-full rounded-[30px] block"
             />
             
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none rounded-[30px]" />
             
            <div className="absolute inset-0 flex flex-col p-6 justify-end pointer-events-none rounded-[30px] z-50 text-white">
              <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase drop-shadow-md text-accent mb-2">NEURAL DISPLACEMENT</span>
              <div className="max-w-md drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                <p className="text-white/80 font-medium text-xs leading-relaxed">
                  WebGL + AI Depth Map Parsing
                </p>
              </div>
            </div>
          </div>

          {/* Parallax Card Space */}
          <div className="bento-card md:col-span-4 p-0 overflow-hidden relative aspect-[3/4] md:aspect-[4/5]">
             {/* 2.5D Parallax Demo Box */}
             <ParallaxCard 
               bgSrc="/arkaplan.jpg"
               fgSrc="/karakter.png"
               className="absolute inset-0 w-full h-full rounded-[30px] block"
             />
             
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none rounded-[30px]" />
             
            <div className="absolute inset-0 flex flex-col p-6 justify-end pointer-events-none rounded-[30px] z-50 text-white">
              <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase drop-shadow-md text-accent mb-2">DEPTH SENSOR</span>
              <div className="max-w-md drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                <p className="text-white/80 font-medium text-xs leading-relaxed">
                  Interactive 2.5D Projection Framework
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Experimental Features Section */}
      <section className="w-full px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          
          {/* Slot 1: X-Ray Reveal (Scanner) */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header - Fixed height to guarantee spacing */}
            <div className="h-8 flex justify-end items-center px-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ opacity: [1, 0.4, 1] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">
                  X-RAY LENS ACTIVE
                </span>
              </div>
            </div>
            
            {/* Image Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border bg-zinc-900 pointer-events-auto">
              <XRayRevealCard 
                topImage="/depth.png" 
                bottomImage={revealImageSrc} 
              />
            </div>
            
            {/* Invisible Bottom Spacer to perfectly equalize top & bottom padding around the inner image block */}
            <div className="h-8 flex-shrink-0 w-full" />
          </div>

          {/* Slot 2: Watercolor / Eraser Reveal */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_02</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">DIGITAL CANVAS</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden">
               <BrushRevealCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: DRAG</span>
                <span>ENGINE: CANVAS_2D</span>
            </div>
          </div>

          {/* Slot 3: WebGL Liquid Glitch */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_03</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">SURFACE TENSION</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border bg-black">
               <LiquidGlitchCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: HOVER</span>
                <span>RENDER: WEBGL</span>
            </div>
          </div>
          
        </div>
      </section>

      {/* Row 2: Secondary Experiments */}
      <section className="w-full px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          
          {/* Slot 4: Paint Drip / Ink Splatter Reveal */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_04</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">ACID INK</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border">
               <PaintDripRevealCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: CLICK</span>
                <span>PHYSICS: GRAVITY</span>
            </div>
          </div>

          {/* Slot 5: Paper Tear Reveal */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_05</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">RIP KINETICS</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border">
               <PaperTearCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: PEEL</span>
                <span>ENGINE: CANVAS_2D</span>
            </div>
          </div>

          {/* Slot 6: Optical Refraction Lens */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_06</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">REFRACTION</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border">
               <OpticalLensCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: HOVER</span>
                <span>ENGINE: WEBGL</span>
            </div>
          </div>
          
        </div>
      </section>

      {/* Row 3: Tertiary Experiments */}
      <section className="w-full px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          
          {/* Slot 7: Fire Reveal */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_07</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">COMBUSTION</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border">
               <FireRevealCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: CLICK</span>
                <span>ENGINE: CANVAS_2D</span>
            </div>
          </div>

          {/* Slot 8: Ice Shatter */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_08</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-500">CRYSTAL FRACTURE</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border">
               <IceShatterCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: CLICK</span>
                <span>ENGINE: CANVAS_2D</span>
            </div>
          </div>

          {/* Slot 9: Chaos Mode */}
          <div className="bento-card p-3 flex flex-col relative h-[450px]">
            {/* Top Header */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0">
               <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">EXP_09</span>
               <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-accent animate-pulse">CHAOS ENGINE</span>
            </div>
            
            {/* Component Container */}
            <div className="relative w-full flex-grow rounded-[16px] overflow-hidden border border-border outline outline-1 outline-accent/30 shadow-[0_0_20px_rgba(200,250,5,0.1)]">
               <ChaosCard bottomImage={revealImageSrc} />
            </div>

            {/* Bottom Footer Info */}
            <div className="h-8 flex justify-between items-center px-3 flex-shrink-0 text-zinc-600 font-mono text-[10px] uppercase">
                <span>INTERACT: DYNAMIC</span>
                <span className="text-accent">ROULETTE</span>
            </div>
          </div>
          
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="w-full py-16 px-4 md:px-6 relative overflow-hidden">
        <div className="bento-card w-full h-full p-12 md:p-24 flex flex-col items-center justify-center text-center bg-zinc-900/40 relative">
          
          {/* Animated Waveform Decoration */}
          <div className="absolute top-12 flex gap-1 items-end h-16 opacity-30">
             <div className="w-1.5 h-6 bg-border"></div>
             <div className="w-1.5 h-10 bg-accent"></div>
             <div className="w-1.5 h-14 bg-accent"></div>
             <div className="w-1.5 h-16 bg-white"></div>
             <div className="w-1.5 h-12 bg-border"></div>
             <div className="w-1.5 h-8 bg-zinc-700"></div>
             <div className="w-1.5 h-14 bg-accent"></div>
             <div className="w-1.5 h-4 bg-border"></div>
          </div>

          <KineticText 
              text="START A" 
              className="font-display font-bold text-[10vw] leading-[0.9] tracking-tighter uppercase mt-12"
          />
          <KineticText 
              text="PROJECT" 
              className="font-display font-bold text-[10vw] leading-[0.9] tracking-tighter uppercase text-accent"
          />

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
          <motion.button 
             onClick={() => fileInputRef.current?.click()}
             initial={{ scale: 0.8, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
             viewport={{ once: true }}
             className="mt-12 px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest cursor-pointer hover:bg-accent transition-colors duration-300 inline-block"
          >
            LET'S TALK
          </motion.button>

          <div className="mt-24 w-full flex flex-col md:flex-row justify-between items-center text-text-muted text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase border-t border-border pt-8">
            <p>© 2026 KINETIC STUDIO</p>
            <div className="flex gap-6 mt-6 md:mt-0">
              <a href="#" className="hover:text-accent transition-colors">INSTAGRAM</a>
              <a href="#" className="hover:text-accent transition-colors">TWITTER</a>
              <a href="#" className="hover:text-accent transition-colors">DRIBBBLE</a>
            </div>
            <div className="hidden lg:block">
              [NETWORK_MESH_V2]
            </div>
          </div>

        </div>
      </footer>

      <AnimatePresence>
        {isEngineInitialized && <FloatingDeck onClose={() => setIsEngineInitialized(false)} />}
      </AnimatePresence>
    </div>
  );
}

