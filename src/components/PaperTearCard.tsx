import { useRef, useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';

export function PaperTearCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const fiberCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isTearing, setIsTearing] = useState(false);
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const brushesRef = useRef<{ outer: HTMLCanvasElement; inner: HTMLCanvasElement; size: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Mouse visual
  const cursorX = useSpring(-200, { stiffness: 800, damping: 40 });
  const cursorY = useSpring(-200, { stiffness: 800, damping: 40 });

  const topImage = '/depth.png';
  const bottomImage = '/color.png';

  // 1. Generate irregular torn-paper brushes
  const generateBrushes = () => {
    const baseRadius = 35;
    const variance = 20;
    const innerScale = 0.85; // 85% size for the inner cut (creates the white fiber border)
    
    const size = baseRadius * 2 + variance * 2;
    const center = size / 2;
    const points: {x: number, y: number}[] = [];
    
    // Create a highly jagged circular polygon
    for (let i = 0; i < Math.PI * 2; i += 0.15) {
      const r = baseRadius + (Math.random() * variance - variance / 2);
      points.push({ x: Math.cos(i) * r, y: Math.sin(i) * r });
    }

    const createStamp = (scale: number) => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'black';
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(center + p.x * scale, center + p.y * scale);
        else ctx.lineTo(center + p.x * scale, center + p.y * scale);
      });
      ctx.closePath();
      ctx.fill();
      return c;
    };

    return {
      outer: createStamp(1.0),
      inner: createStamp(innerScale),
      size
    };
  };

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
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cw, ch);
  };

  const resetCanvases = () => {
    const topCanvas = topCanvasRef.current;
    const fiberCanvas = fiberCanvasRef.current;
    const topCtx = topCanvas?.getContext('2d');
    const fiberCtx = fiberCanvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!topCanvas || !topCtx || !fiberCanvas || !fiberCtx || !img) return;

    // Reset Top Layer (Image)
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
    drawImageCover(topCtx, img, topCanvas.width, topCanvas.height);

    // Reset Fiber Layer (White Paper Texture)
    fiberCtx.clearRect(0, 0, fiberCanvas.width, fiberCanvas.height);
    fiberCtx.globalCompositeOperation = 'source-over';
    fiberCtx.fillStyle = '#f4f4f5'; // Light zinc color mimicking paper
    fiberCtx.fillRect(0, 0, fiberCanvas.width, fiberCanvas.height);
  };

  useEffect(() => {
    const topCanvas = topCanvasRef.current;
    const fiberCanvas = fiberCanvasRef.current;
    const container = containerRef.current;
    if (!topCanvas || !fiberCanvas || !container) return;

    // Pre-calculate our tearing masks
    brushesRef.current = generateBrushes();

    const handleResize = () => {
      topCanvas.width = container.clientWidth;
      topCanvas.height = container.clientHeight;
      fiberCanvas.width = container.clientWidth;
      fiberCanvas.height = container.clientHeight;
      if (imageRef.current) resetCanvases();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const img = new Image();
    img.src = topImage;
    img.onload = () => {
      imageRef.current = img;
      resetCanvases();
    };

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = topCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };
  };

  const drawTearSegment = (x1: number, y1: number, x2: number, y2: number) => {
    const topCtx = topCanvasRef.current?.getContext('2d');
    const fiberCtx = fiberCanvasRef.current?.getContext('2d');
    const brushes = brushesRef.current;
    if (!topCtx || !fiberCtx || !brushes) return;

    const dist = Math.hypot(x2 - x1, y2 - y1);
    // Stamp densely for a continuous edge
    const steps = Math.ceil(dist / 3); 

    topCtx.globalCompositeOperation = 'destination-out';
    fiberCtx.globalCompositeOperation = 'destination-out';

    for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 1 : i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;

        // Erase top image completely in wide radius
        topCtx.drawImage(brushes.outer, x - brushes.size / 2, y - brushes.size / 2);
        // Erase fiber slightly less, leaving a white ragged border around the tear!
        fiberCtx.drawImage(brushes.inner, x - brushes.size / 2, y - brushes.size / 2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    // Constraint: Tear MUST start from an edge (within 80px of a border)
    const margin = 80;
    const isNearEdge = 
        coords.x < margin || 
        coords.y < margin || 
        coords.x > coords.width - margin || 
        coords.y > coords.height - margin;

    if (!isNearEdge) return; // Ignore clicks in the dead center

    setIsTearing(true);
    
    // Snap the start point perfectly to the nearest border line to fake an incoming tear
    let edgeX = coords.x;
    let edgeY = coords.y;
    const dLeft = coords.x;
    const dRight = coords.width - coords.x;
    const dTop = coords.y;
    const dBottom = coords.height - coords.y;
    const minDist = Math.min(dLeft, dRight, dTop, dBottom);

    if (minDist === dLeft) edgeX = 0;
    else if (minDist === dRight) edgeX = coords.width;
    else if (minDist === dTop) edgeY = 0;
    else if (minDist === dBottom) edgeY = coords.height;

    // Immediately draw the bridge from the border to the click point
    drawTearSegment(edgeX, edgeY, coords.x, coords.y);
    lastPosRef.current = coords;

    cursorX.set(coords.x - 16);
    cursorY.set(coords.y - 16);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    if (isTearing && lastPosRef.current) {
        drawTearSegment(lastPosRef.current.x, lastPosRef.current.y, coords.x, coords.y);
        lastPosRef.current = coords;
        cursorX.set(coords.x - 16);
        cursorY.set(coords.y - 16);
    }
  };

  const handleMouseUp = () => {
    setIsTearing(false);
    lastPosRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsTearing(false);
    lastPosRef.current = null;
    // Leaving frame resets the paper visually seamlessly
    resetCanvases();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-zinc-900 \${isTearing ? 'cursor-none' : 'cursor-crosshair'} group`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Layer 1: Bottom Revealed Image (Color) */}
      <img 
        src={bottomImage} 
        alt="Revealed" 
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
      />
      
      {/* Layer 2: White Paper Fiber Texture (Drop shadows to underlying image) */}
      <canvas 
        ref={fiberCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
        style={{ touchAction: 'none' }} 
      />

      {/* Layer 3: Top Depth Image (Drop shadows to fiber layer) */}
      <canvas 
        ref={topCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        style={{ touchAction: 'none' }} 
      />

      {/* Tearing Cursor Visual */}
      <motion.div
         className="absolute rounded-full border-2 border-white bg-black/30 backdrop-blur-sm pointer-events-none z-20 flex items-center justify-center"
         style={{
           width: 32,
           height: 32,
           x: cursorX,
           y: cursorY,
           opacity: isTearing ? 1 : 0,
           scale: isTearing ? 1 : 0.5
         }}
         transition={{ opacity: { duration: 0.1 }, scale: { duration: 0.1 } }}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
      </motion.div>

      {/* HUD Info */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between z-10 transition-opacity duration-300">
        <div className="flex justify-between items-start w-full opacity-60">
            <span className="text-[10px] font-mono tracking-widest text-zinc-100 bg-black/60 px-2 py-1 rounded mix-blend-overlay">TISSUE TEAR_OS</span>
        </div>
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-5xl font-display font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay">
            PAPER<br/>RIP
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-200 font-mono text-[9px] md:text-[10px] uppercase drop-shadow-md">
             <span className={`bg-black/90 px-2 py-0.5 rounded backdrop-blur-sm border ${isTearing ? 'border-accent text-accent shadow-[0_0_10px_rgba(200,250,5,0.3)]' : 'border-white/20'}`}>
                 DRAG FROM BORDERS
             </span>
             <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-zinc-500 opacity-60">LEAVE TO MEND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
