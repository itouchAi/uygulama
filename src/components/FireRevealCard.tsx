import { useRef, useEffect, useState } from 'react';

interface Emitter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  scale: number;
  wiggle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
}

export function FireRevealCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const emittersRef = useRef<Emitter[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const topImage = '/depth.png';
  const bottomImage = '/color.png';

  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) => {
    const ir = img.width / img.height;
    const cr = cw / ch;
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
    if (ir > cr) {
      sWidth = img.height * cr;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / cr;
      sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cw, ch);
  };

  const resetCanvases = () => {
    const maskCanvas = maskCanvasRef.current;
    const fireCanvas = fireCanvasRef.current;
    const maskCtx = maskCanvas?.getContext('2d', { willReadFrequently: true });
    const fireCtx = fireCanvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!maskCanvas || !maskCtx || !fireCanvas || !fireCtx || !img) return;

    // Reset Fire Canvas
    fireCtx.clearRect(0, 0, fireCanvas.width, fireCanvas.height);
    
    // Reset Mask Canvas (The Paper)
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.shadowBlur = 0;
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    drawImageCover(maskCtx, img, maskCanvas.width, maskCanvas.height);
    
    emittersRef.current = [];
    particlesRef.current = [];
  };

  useEffect(() => {
    const maskCanvas = maskCanvasRef.current;
    const fireCanvas = fireCanvasRef.current;
    const container = containerRef.current;
    if (!maskCanvas || !fireCanvas || !container) return;

    const handleResize = () => {
      maskCanvas.width = container.clientWidth;
      maskCanvas.height = container.clientHeight;
      fireCanvas.width = container.clientWidth;
      fireCanvas.height = container.clientHeight;
      if (imageRef.current) resetCanvases();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const img = new Image();
    img.src = topImage;
    img.onload = () => {
      imageRef.current = img;
      handleResize();
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const renderFrame = () => {
    const maskCanvas = maskCanvasRef.current;
    const fireCanvas = fireCanvasRef.current;
    const maskCtx = maskCanvas?.getContext('2d');
    const fireCtx = fireCanvas?.getContext('2d');
    if (!maskCtx || !fireCtx || !maskCanvas || !fireCanvas) return;

    // We MUST clear the fire canvas every frame since the flames move and die
    fireCtx.clearRect(0, 0, fireCanvas.width, fireCanvas.height);

    const emitters = emittersRef.current;
    const particles = particlesRef.current;

    // Process Emitters (The burning front moving upwards)
    for (let i = emitters.length - 1; i >= 0; i--) {
        const e = emitters[i];
        if (e.life > 0) {
            // Wavy organic upward movement
            e.x += e.vx + Math.sin(e.life / 10 + e.wiggle) * 1.5;
            e.y += e.vy;
            e.life--;

            // Spawn Fire Particles at the emitter's location
            const spawnCount = Math.floor(Math.random() * 3) + 2;
            for(let j=0; j<spawnCount; j++) {
                particles.push({
                    x: e.x + (Math.random() - 0.5) * 20 * e.scale,
                    y: e.y + (Math.random() - 0.5) * 20 * e.scale,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5 - 1, // Drift slowly up
                    life: 1.0,  // 1.0 to 0.0
                    decay: 1.0 / (Math.random() * 20 + 15), // How fast it dies
                    size: (Math.random() * 25 + 10) * e.scale,
                });
            }
        } else {
            emitters.splice(i, 1);
        }
    }

    // Process & Draw Particles
    fireCtx.globalCompositeOperation = 'screen';

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life > 0) {
            // 1. Paint the Charred Edge (Brown/Black burn mark on the paper)
            maskCtx.globalCompositeOperation = 'source-over';
            maskCtx.fillStyle = `rgba(20, 5, 0, ${0.08 * p.life})`;
            maskCtx.beginPath();
            maskCtx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
            maskCtx.fill();

            // 2. Erase the Paper (Reveal bottom image)
            // Using a soft accumulating destination-out
            maskCtx.globalCompositeOperation = 'destination-out';
            maskCtx.fillStyle = `rgba(0, 0, 0, ${0.2 * p.life})`;
            maskCtx.beginPath();
            maskCtx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
            maskCtx.fill();

            // 3. Draw the Glowing Flame
            const r = 255;
            // Transition from yellow to deep red as it dies
            const g = Math.floor(100 + 155 * p.life);
            const b = Math.floor(50 * p.life);
            
            // Radial gradient for soft organic flames
            const grad = fireCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(0.1, p.size * p.life));
            grad.addColorStop(0, `rgba(${r},${g},${b}, ${p.life * 0.8})`);
            grad.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
            
            fireCtx.fillStyle = grad;
            fireCtx.beginPath();
            fireCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            fireCtx.fill();
        } else {
            particles.splice(i, 1);
        }
    }

    // If there is still active simulation going on, keep the loop running
    if (emitters.length > 0 || particles.length > 0) {
       animationRef.current = requestAnimationFrame(renderFrame);
    } else {
       animationRef.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Randomize the power and spread of this specific click's fire
    const powerScale = Math.random() * 0.6 + 0.6; // 0.6x to 1.2x size
    const numFlames = Math.floor(Math.random() * 3) + 3; // 3 to 5 upward crawling flames

    for (let i = 0; i < numFlames; i++) {
        // Spread them outwards but moving up
        const sideSpread = (Math.random() - 0.5) * 4;
        
        emittersRef.current.push({
            x,
            y,
            vx: sideSpread,
            vy: -(Math.random() * 2 + 2) * powerScale, // Upward speed
            life: Math.random() * 60 + 50, // How many frames it burns upward
            scale: powerScale * (Math.random() * 0.4 + 0.8),
            wiggle: Math.random() * 100 // Seed for wave offset
        });
    }

    // Start engine if asleep
    if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(renderFrame);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    resetCanvases();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-900 cursor-crosshair group"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Bottom Revealed Image (Color) */}
      <img 
        src={bottomImage} 
        alt="Revealed" 
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
      />
      
      {/* Mask Canvas: Holds the slowly burning paper layer */}
      <canvas 
        ref={maskCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ touchAction: 'none' }} 
      />

      {/* Fire Canvas: Top glowing flame effects */}
      <canvas 
        ref={fireCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-[0_0_8px_rgba(255,100,0,0.5)]"
        style={{ touchAction: 'none', mixBlendMode: 'screen' }} 
      />

      {/* HUD Info */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-end z-10">
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-5xl font-display font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay">
            COMBUSTION<br/>PROTO
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-200 font-mono text-[9px] md:text-[10px] uppercase drop-shadow-md">
             <span className={`bg-black/90 px-2 py-0.5 rounded backdrop-blur-sm border transition-colors ${isHovered ? 'border-[#ff5500] text-[#ffaa00] shadow-[0_0_15px_rgba(255,80,0,0.4)]' : 'border-white/20'}`}>
                 CLICK TO IGNITE
             </span>
             <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-zinc-500 opacity-60">LEAVE TO EXTINGUISH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
