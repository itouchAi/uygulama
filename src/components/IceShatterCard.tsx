import { useRef, useEffect, useState } from 'react';

interface Point { x: number; y: number }
interface Polygon { points: Point[]; level: number; id: number }
interface FallingPoly {
    points: Point[];
    originalCx: number;
    originalCy: number;
    cx: number;
    cy: number;
    vx: number;
    vy: number;
    rot: number;
    vrot: number;
}

function getCentroid(pts: Point[]) {
    let cx = 0, cy = 0;
    for (let p of pts) { cx += p.x; cy += p.y; }
    return { x: cx / pts.length, y: cy / pts.length };
}

function distance(p1: Point, p2: Point) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function pointInPolygon(point: Point, vs: Point[]) {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function IceShatterCard({ bottomImage = '/color.png' }: { bottomImage?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frozenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const activePolys = useRef<Polygon[]>([]);
  const fallingPolys = useRef<FallingPoly[]>([]);
  const animationRef = useRef<number | null>(null);
  const polyIdCounter = useRef(1);

  const topImage = '/depth.png';
  const MAX_LEVEL = 2; // Level 0 -> 1 -> 2 (falls)
  const HIT_RADIUS = 100;

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

  const setupFrozenCanvas = (cw: number, ch: number) => {
      if (!frozenCanvasRef.current) {
          frozenCanvasRef.current = document.createElement('canvas');
      }
      frozenCanvasRef.current.width = cw;
      frozenCanvasRef.current.height = ch;
      const fCtx = frozenCanvasRef.current.getContext('2d');
      if (fCtx && imageRef.current) {
          drawImageCover(fCtx, imageRef.current, cw, ch);
          // Frost tint to make it look like solid ice
          fCtx.fillStyle = 'rgba(240, 250, 255, 0.35)'; // Whiteish-blue tint
          fCtx.fillRect(0, 0, cw, ch);
      }
  };

  const resetCanvases = () => {
    const maskCanvas = maskCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    const maskCtx = maskCanvas?.getContext('2d');
    const pCtx = particleCanvas?.getContext('2d');
    
    if (!maskCanvas || !maskCtx || !particleCanvas || !pCtx || !frozenCanvasRef.current) return;

    // Reset Particle Canvas
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Draw initial unbroken ice
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.shadowBlur = 0;
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.drawImage(frozenCanvasRef.current, 0, 0);
    
    activePolys.current = [{
        points: [
            {x: 0, y: 0}, 
            {x: maskCanvas.width, y: 0}, 
            {x: maskCanvas.width, y: maskCanvas.height}, 
            {x: 0, y: maskCanvas.height}
        ],
        level: 0,
        id: 0
    }];
    fallingPolys.current = [];
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  };

  useEffect(() => {
    const maskCanvas = maskCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    const container = containerRef.current;
    if (!maskCanvas || !particleCanvas || !container) return;

    const handleResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      maskCanvas.width = cw;
      maskCanvas.height = ch;
      particleCanvas.width = cw;
      particleCanvas.height = ch;
      if (imageRef.current) {
          setupFrozenCanvas(cw, ch);
          resetCanvases();
      }
    };

    const img = new Image();
    img.src = topImage;
    img.onload = () => {
      imageRef.current = img;
      handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const renderParticles = () => {
    const canvas = particleCanvasRef.current;
    const pCtx = canvas?.getContext('2d');
    const frozenCanvas = frozenCanvasRef.current;
    if (!pCtx || !canvas || !frozenCanvas) return;

    pCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    const h = canvas.height;
    const polys = fallingPolys.current;
    
    for (let i = polys.length - 1; i >= 0; i--) {
        const fp = polys[i];
        
        // Physics logic: Gravity and rotation
        fp.vy += 0.8;
        fp.cx += fp.vx;
        fp.cy += fp.vy;
        fp.rot += fp.vrot;

        // Draw rotated polygon
        pCtx.save();
        pCtx.translate(fp.cx, fp.cy);
        pCtx.rotate(fp.rot);
        pCtx.translate(-fp.originalCx, -fp.originalCy);
        
        // Clip to polygon shape
        pCtx.beginPath();
        pCtx.moveTo(fp.points[0].x, fp.points[0].y);
        for(let j=1; j<fp.points.length; j++) pCtx.lineTo(fp.points[j].x, fp.points[j].y);
        pCtx.closePath();
        pCtx.clip();
        
        // Draw the frozen texture inside the clip
        pCtx.drawImage(frozenCanvas, 0, 0);
        
        // Draw a sparkly glass rim
        pCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        pCtx.lineWidth = 1.5;
        pCtx.stroke();
        
        pCtx.restore();

        // Remove if off screen
        if (fp.cy - 300 > h) {
            polys.splice(i, 1);
        }
    }

    if (polys.length > 0) {
       animationRef.current = requestAnimationFrame(renderParticles);
    } else {
       animationRef.current = null;
    }
  };

  const splitPolygon = (poly: Polygon, center: Point) => {
    const newP: Polygon[] = [];
    const pts = poly.points;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const v1 = pts[i];
        const v2 = pts[(i + 1) % n];
        
        // Add a jittered midpoint on the edge to make more organic glass shards 
        const t = 0.35 + Math.random() * 0.3; // 0.35 to 0.65
        const m = {
            x: v1.x + (v2.x - v1.x) * t,
            y: v1.y + (v2.y - v1.y) * t
        };
        
        newP.push({ points: [center, v1, m], level: poly.level + 1, id: polyIdCounter.current++ });
        newP.push({ points: [center, m, v2], level: poly.level + 1, id: polyIdCounter.current++ });
    }
    return newP;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas?.getContext('2d');
    if (!maskCanvas || !maskCtx) return;
    
    const rect = maskCanvas.getBoundingClientRect();
    const mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const nextActive: Polygon[] = [];
    const polysToSplit: Polygon[] = [];
    const polysToFall: Polygon[] = [];

    // Find affected polygons (direct hit or within blast radius)
    for (const p of activePolys.current) {
        if (pointInPolygon(mouse, p.points) || distance(getCentroid(p.points), mouse) < HIT_RADIUS) {
            if (p.level < MAX_LEVEL) {
                polysToSplit.push(p);
            } else {
                polysToFall.push(p);
            }
        } else {
            nextActive.push(p);
        }
    }

    // Split polygons
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    maskCtx.lineWidth = 1.0;
    maskCtx.shadowColor = 'rgba(200, 240, 255, 0.5)';
    maskCtx.shadowBlur = 5;

    for (const p of polysToSplit) {
        // Use the exact mouse point if it's inside, otherwise use centroid to avoid crossing lines outside
        let centerPoint = mouse;
        if (!pointInPolygon(mouse, p.points)) {
            centerPoint = getCentroid(p.points);
            // Move slightly towards mouse for organic feel
            centerPoint.x += (mouse.x - centerPoint.x) * 0.15;
            centerPoint.y += (mouse.y - centerPoint.y) * 0.15;
            if(!pointInPolygon(centerPoint, p.points)) centerPoint = getCentroid(p.points); // Fallback
        }

        const newPolys = splitPolygon(p, centerPoint);
        nextActive.push(...newPolys);
        
        // Draw the fresh cracks directly onto the mask canvas
        maskCtx.beginPath();
        for (const np of newPolys) {
            // We just need to draw lines from the center to the edge vertices
            maskCtx.moveTo(centerPoint.x, centerPoint.y);
            maskCtx.lineTo(np.points[1].x, np.points[1].y);
            maskCtx.lineTo(np.points[2].x, np.points[2].y);
        }
        maskCtx.stroke();
    }
    maskCtx.shadowBlur = 0; // Turn off glow for the punch-out operation

    // Make pieces fall
    if (polysToFall.length > 0) {
        maskCtx.globalCompositeOperation = 'destination-out';
        maskCtx.fillStyle = 'black'; // Erase

        for (const p of polysToFall) {
            // Punch a hole in the ice to show the image beneath
            maskCtx.beginPath();
            maskCtx.moveTo(p.points[0].x, p.points[0].y);
            for(let i=1; i<p.points.length; i++) maskCtx.lineTo(p.points[i].x, p.points[i].y);
            maskCtx.closePath();
            maskCtx.fill();
            
            // Spawn a physics particle
            const cxcy = getCentroid(p.points);
            fallingPolys.current.push({
                points: p.points,
                originalCx: cxcy.x,
                originalCy: cxcy.y,
                cx: cxcy.x,
                cy: cxcy.y,
                vx: (Math.random() - 0.5) * 6 + (cxcy.x - mouse.x) * 0.04, // Pop outwards
                vy: (Math.random() - 0.5) * 6 + (cxcy.y - mouse.y) * 0.04 - 3, // Pop upwards strongly
                rot: 0,
                vrot: (Math.random() - 0.5) * 0.3
            });
        }
        
        // Ensure particle physics engine is running
        if (!animationRef.current) {
            animationRef.current = requestAnimationFrame(renderParticles);
        }
    }

    activePolys.current = nextActive;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    resetCanvases(); // Instantly freeze back over
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
      {/* Layer 0: The Underneath Image */}
      <img 
        src={bottomImage} 
        alt="Revealed" 
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
      />
      
      {/* Layer 1: The Mask containing unbroken ice + cracks + holes */}
      <canvas 
        ref={maskCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        style={{ touchAction: 'none' }} 
      />

      {/* Layer 2: The Falling Glass Particles */}
      <canvas 
        ref={particleCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
        style={{ touchAction: 'none' }} 
      />

      {/* HUD Info */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-end z-10">
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-5xl font-display font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay">
            SHATTER<br/>POINT
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-200 font-mono text-[9px] md:text-[10px] uppercase drop-shadow-md">
             <span className={`bg-black/80 px-2 py-0.5 rounded backdrop-blur-sm border transition-colors ${isHovered ? 'border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,200,255,0.4)]' : 'border-white/20'}`}>
                 CLICK TO SHATTER
             </span>
             <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-zinc-500 opacity-60">LEAVE TO FREEZE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
