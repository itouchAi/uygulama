import { useRef, useEffect, useState } from 'react';

interface Splat {
  x: number;
  y: number;
  mainRadius: number;
  drops: Drop[];
}

interface Drop {
  x: number;
  originY: number;
  currentY: number;
  targetY: number;
  radius: number;
  speed: number;
}

export function PaintDripRevealCard({ bottomImage = '/color.png' }: { bottomImage?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const splattersRef = useRef<Splat[]>([]);
  const animationRef = useRef<number | null>(null);

  const topImage = '/depth.png';

  // Perfectly aligns canvas drawing with CSS object-fit: cover
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

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw the fully opaque Depth image
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    drawImageCover(ctx, img, canvas.width, canvas.height);

    // 2. Punch holes where the paint splatters are
    ctx.globalCompositeOperation = 'destination-out';
    // Soft blurred edges give it a liquid/paint feel
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'black';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.strokeStyle = 'rgba(0,0,0,1)';

    splattersRef.current.forEach(splat => {
      // Draw main impact blob
      ctx.beginPath();
      ctx.arc(splat.x, splat.y, splat.mainRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw drips
      splat.drops.forEach(drop => {
        // Animate drips passing down
        if (drop.currentY < drop.targetY) {
          drop.currentY += drop.speed;
        }

        // Draw start origin of drip
        ctx.beginPath();
        ctx.arc(drop.x, drop.originY, drop.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw the drip trail
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.originY);
        ctx.lineTo(drop.x, drop.currentY);
        ctx.lineWidth = drop.radius * 2;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
    });

    animationRef.current = requestAnimationFrame(renderCanvas);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (imageRef.current && splattersRef.current.length === 0) {
          // Initial static draw if no splatters active
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.globalCompositeOperation = 'source-over';
              ctx.shadowBlur = 0;
              drawImageCover(ctx, imageRef.current, canvas.width, canvas.height);
          }
      }
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

  const createSplatter = (x: number, y: number) => {
    const drops: Drop[] = [];
    
    // Calculate a random scale for this specific splatter (0.3 "small" to 1.0 "normal/max")
    const scale = Math.random() * 0.7 + 0.3;
    
    const numDrops = Math.floor(Math.random() * 8) + 5; // 5 to 12 drops per click

    for (let i = 0; i < numDrops; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Apply scale to the spread distance
        const dist = Math.random() * 50 * scale; 
        const dropX = x + Math.cos(angle) * dist;
        const dropY = y + Math.sin(angle) * dist;
        
        // Size gets smaller the further it is from center, and scaled overall
        const maxRadius = 12 * scale;
        const radius = Math.max(1.5, (Math.random() * maxRadius) * (1 - dist / (70 * scale)));
        
        // Thicker bubbles drip slower, thin ones drip faster
        const speed = Math.random() * 3 + 1.5; 
        const dripLength = (Math.random() * 150 + 40) * (scale + 0.2); // Smaller splatters drip slightly less

        drops.push({
            x: dropX,
            originY: dropY,
            currentY: dropY,
            targetY: dropY + dripLength,
            radius,
            speed
        });
    }

    splattersRef.current.push({
        x,
        y,
        // Apply scale to the central impact blob
        mainRadius: (Math.random() * 10 + 20) * scale, 
        drops
    });

    // Ensure loop is running
    if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(renderCanvas);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    createSplatter(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Erase all splatters and immediately draw fresh cover
    splattersRef.current = [];
    
    if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && imageRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
        drawImageCover(ctx, imageRef.current, canvas.width, canvas.height);
    }
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
      {/* Bottom Revealed Layer */}
      <img 
        src={bottomImage} 
        alt="Revealed" 
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
      />
      
      {/* Top Masked Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ touchAction: 'none' }} 
      />

      {/* HUD Info */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-end z-10">
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-5xl font-display font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter opacity-90 transition-opacity">
            FLUID<br/>SPLATTER
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-200 font-mono text-[9px] md:text-[10px] uppercase drop-shadow-md">
             <span className={`bg-black/80 px-2 py-0.5 rounded backdrop-blur-sm border ${isHovered ? 'border-accent text-accent' : 'border-white/10'} transition-colors`}>
                 CLICK TO SPLATTER
             </span>
             <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-zinc-500 opacity-60">LEAVE TO RESET</span>
          </div>
        </div>
      </div>
    </div>
  );
}
