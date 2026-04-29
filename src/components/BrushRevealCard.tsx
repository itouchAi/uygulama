import { useRef, useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';

export function BrushRevealCard({ bottomImage = '/color.png' }: { bottomImage?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Brush styling
  const brushSize = 45; // Size of the eraser (halved from 90)
  const cursorX = useSpring(-200, { stiffness: 800, damping: 40 });
  const cursorY = useSpring(-200, { stiffness: 800, damping: 40 });

  const topImage = '/depth.png';

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
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0; // Reset any lingering shadow
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cw, ch);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageCover(ctx, img, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (imageRef.current) resetCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const img = new Image();
    img.src = topImage;
    img.onload = () => {
      imageRef.current = img;
      resetCanvas();
    };

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    setIsDrawing(true);
    lastPosRef.current = coords;
    
    // Position visual cursor immediately
    cursorX.set(coords.x - brushSize / 2);
    cursorY.set(coords.y - brushSize / 2);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      // The secret to "erasing": destination-out
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      
      // Soften the initial stamp
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'black';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // We always want to track the visual ring if drawing
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    if (isDrawing) {
      cursorX.set(coords.x - brushSize / 2);
      cursorY.set(coords.y - brushSize / 2);
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const lastPos = lastPosRef.current;

      if (ctx && lastPos) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(coords.x, coords.y);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        
        // This gives it the "watercolor" soft faded edge
        ctx.shadowBlur = 15; 
        ctx.shadowColor = 'black';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.stroke();
      }
      lastPosRef.current = coords;
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
    // Core requirement: leaving the frame resets the mask
    resetCanvas();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-zinc-900 \${isDrawing ? 'cursor-none' : 'cursor-crosshair'} group`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDragStart={(e) => e.preventDefault()} // Block HTML5 drag on image
    >
      {/* Layer 1: Bottom Image (Revealed Layer / Color) */}
      <img 
        src={bottomImage} 
        alt="Revealed" 
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
      />
      
      {/* Layer 2: Top Image Mask (Erased Layer / Depth) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-[100.5%] h-[100.5%] pointer-events-none select-none"
        style={{ touchAction: 'none' }} 
      />

      {/* Paint Brush Visual Cursor */}
      <motion.div
         className="absolute rounded-full border-2 border-white/60 bg-white/10 backdrop-blur-sm pointer-events-none z-20"
         style={{
           width: brushSize,
           height: brushSize,
           x: cursorX,
           y: cursorY,
           opacity: isDrawing ? 1 : 0,
           scale: isDrawing ? 1 : 0.8
         }}
         transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 } }}
      />

      {/* HUD Header & Footer Info */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-end z-10 transition-opacity duration-300">
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-5xl font-display font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay">
            BRUSH<br/>REVEAL
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-200 font-mono text-[9px] md:text-[10px] uppercase drop-shadow-md">
             <span className="bg-black/80 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10 text-accent">HOLD & DRAG TO ERASE</span>
             <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-zinc-500 opacity-60">LEAVE TO RESET</span>
          </div>
        </div>
      </div>
    </div>
  );
}
