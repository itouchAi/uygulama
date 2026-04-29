import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export function LiquidGlitchCard({ bottomImage = '/color.png' }: { bottomImage?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // THREE.js Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    // Depth image as the base, Color image as the revealed image
    const tex1 = loader.load('/depth.png', (t) => {
       material.uniforms.uImageResolution.value.set(t.image.width, t.image.height);
    });
    const tex2 = loader.load(bottomImage);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        tDiffuse1: { value: tex1 },
        tDiffuse2: { value: tex2 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector4(container.clientWidth, container.clientHeight, 1, 1) },
        uImageResolution: { value: new THREE.Vector2(0, 0) },
        uVelocity: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform sampler2D tDiffuse1;
        uniform sampler2D tDiffuse2;
        uniform vec2 uMouse;
        uniform vec4 uResolution;
        uniform vec2 uImageResolution;
        uniform float uVelocity;

        varying vec2 vUv;

        void main() {
          // Calculate object-fit: cover equivalent UVs
          vec2 uv = vUv;
          if (uImageResolution.x > 0.0) {
              float imageAspect = uImageResolution.x / uImageResolution.y;
              float screenAspect = uResolution.x / uResolution.y;
              
              vec2 scale = vec2(1.0);
              if (screenAspect < imageAspect) {
                  scale.x = screenAspect / imageAspect;
              } else {
                  scale.y = imageAspect / screenAspect;
              }
              uv = (uv - 0.5) * scale + 0.5;
          }
          
          // Distance from mouse cursor (Using un-scaled vUv for accurate spatial physics interaction)
          float dist = distance(vUv, uMouse);
          
          // 1. Calculate a dynamic water wave / ripple effect based on mouse distance and time
          float wave = sin(dist * 40.0 - uTime * 15.0);
          
          // 2. Calculate Intensity
          // - High intensity in the exact middle of the transition (RGB burst!)
          // - Dynamic intensity when hovered, decaying to 0 when mouse stops (uVelocity)
          float transitionBurst = sin(uProgress * 3.14159265) * 0.15; 
          float continuousHover = uVelocity * 0.08 * uProgress; 
          float intensity = transitionBurst + continuousHover;
          
          // 3. RGB Chromatic Aberration logic (Separating red, green, blue channels in different directions)
          float glitchR = wave * intensity;
          float glitchG = wave * -intensity * 0.8;
          float glitchB = wave * intensity * 0.5;

          // 4. Displace the UV coordinates mapping for each color
          vec2 uvR = uv + vec2(glitchR, glitchR);
          vec2 uvG = uv + vec2(glitchG, -glitchG); // slightly different axis for green
          vec2 uvB = uv + vec2(-glitchB, glitchB);

          // 5. Sample the FIRST image (with displaced RGB)
          float r1 = texture2D(tDiffuse1, uvR).r;
          float g1 = texture2D(tDiffuse1, uvG).g;
          float b1 = texture2D(tDiffuse1, uvB).b;
          vec4 color1 = vec4(r1, g1, b1, 1.0);

          // 6. Sample the SECOND image (with displaced RGB)
          float r2 = texture2D(tDiffuse2, uvR).r;
          float g2 = texture2D(tDiffuse2, uvG).g;
          float b2 = texture2D(tDiffuse2, uvB).b;
          vec4 color2 = vec4(r2, g2, b2, 1.0);

          // 7. Blend the two images smoothly based on hover progress
          vec4 finalColor = mix(color1, color2, uProgress);

          gl_FragColor = finalColor;
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;
    let targetProgress = 0;
    let targetVelocity = 0;
    let lastMouse = { x: 0.5, y: 0.5 };
    
    // Resize bounds
    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      material.uniforms.uResolution.value.set(container.clientWidth, container.clientHeight, 1, 1);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    const render = (time: number) => {
      material.uniforms.uTime.value = time * 0.001;
      // Smooth lerp (interpolation) towards 1 when hovered, and 0 when unhovered
      material.uniforms.uProgress.value += (targetProgress - material.uniforms.uProgress.value) * 0.08;
      
      // Decay velocity exponentially when mouse stops
      targetVelocity *= 0.90;
      material.uniforms.uVelocity.value += (targetVelocity - material.uniforms.uVelocity.value) * 0.15;
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render(0);

    // Mouse Interactions (Feed data to Shader)
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Normalize mouse coords to 0.0 -> 1.0 for UV mapping
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - ((e.clientY - rect.top) / rect.height); // WebGL Y is inverted!
      
      // Calculate mouse speed for dynamic ripple intensity
      const dx = x - lastMouse.x;
      const dy = y - lastMouse.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      targetVelocity = Math.min(targetVelocity + speed * 15.0, 1.0);
      lastMouse = { x, y };

      material.uniforms.uMouse.value.set(x, y);
    };

    const onMouseEnter = () => { 
        targetProgress = 1.0; 
        setIsHovered(true);
    };
    const onMouseLeave = () => { 
        targetProgress = 0.0; 
        setIsHovered(false);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [bottomImage]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-crosshair z-0"
    >
      {/* Modern Sci-Fi Overlay HUD */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between z-10">
          <div className="flex justify-between items-start w-full">
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-100 bg-black/40 backdrop-blur-md px-3 py-1 rounded shadow-lg border border-white/10 transition-colors duration-500">EXP_03</span>
            
            <span className={`text-[10px] font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded shadow-lg transition-all duration-300 ${
                isHovered ? 'bg-accent text-zinc-900 border border-accent shadow-[0_0_15px_rgba(200,250,5,0.6)]' : 'bg-black/60 text-white border border-white/20'
            }`}>
              {isHovered ? 'GLITCH INJECTED' : 'AWAITING HOVER'}
            </span>
        </div>
        
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-4xl font-display font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay opacity-90">
            LIQUID<br/>GLITCH
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-300 font-mono text-[10px] uppercase drop-shadow-md">
            <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">WEBGL SHADER</span>
            <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">CHROMATIC ABERRATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
