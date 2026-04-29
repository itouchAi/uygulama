import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export function OpticalLensCard({ bottomImage = '/color.png' }: { bottomImage?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // THREE.js Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High-res for crisp glass
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const texBase = loader.load('/depth.png', (t) => {
        if (t.image && t.image.width) {
            material.uniforms.uImageResolution.value.set(t.image.width, t.image.height);
        }
    });
    const texReveal = loader.load(bottomImage);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        tBase: { value: texBase },
        tReveal: { value: texReveal },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector4(container.clientWidth, container.clientHeight, 1, 1) },
        uImageResolution: { value: new THREE.Vector2(0, 0) },
        uRadius: { value: 0.0 } // Starts at 0, grows on hover
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tBase;
        uniform sampler2D tReveal;
        uniform vec2 uMouse;
        uniform vec4 uResolution;
        uniform vec2 uImageResolution;
        uniform float uRadius;
        
        varying vec2 vUv;

        // Helper to convert normalized UVs to Object-Fit: Cover UVs 
        vec2 getCoverUv(vec2 inputUv) {
            if (uImageResolution.x <= 0.0) return inputUv; // Fallback
            float imageAspect = uImageResolution.x / uImageResolution.y;
            float screenAspect = uResolution.x / uResolution.y;
            vec2 scale = vec2(1.0);
            if (screenAspect < imageAspect) {
                scale.x = screenAspect / imageAspect;
            } else {
                scale.y = imageAspect / screenAspect;
            }
            return (inputUv - 0.5) * scale + 0.5;
        }

        void main() {
          vec2 uv = vUv;
          vec2 mouse = uMouse;

          // Aspect ratio correction so the lens is a perfect circle, not squeezed
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 p = (uv - mouse) * aspect;
          float dist = length(p);

          // Base background image (Depth/X-Ray)
          vec4 baseColor = texture2D(tBase, getCoverUv(uv));

          // If the radius is completely zero, just draw the base early to save GPU
          if (uRadius < 0.001) {
              gl_FragColor = baseColor;
              return;
          }

          if (dist < uRadius) {
              // 1. Calculate realistic 3D Hemisphere Normal for the glass orb
              float z = sqrt(uRadius * uRadius - dist * dist);
              vec3 normal = normalize(vec3(p.x, p.y, z));
              
              // 2. Fisheye Magnification (Refraction)
              float magnification = 0.5; 
              vec2 distortedUv = mouse + (uv - mouse) * (1.0 - z * magnification);
              
              // Sample using the cover projection
              vec4 revealColor = texture2D(tReveal, getCoverUv(distortedUv));
              
              // 3. Chromatic Aberration near the glass edges
              float edgeDistortion = smoothstep(uRadius * 0.6, uRadius, dist) * 0.015;
              float r = texture2D(tReveal, getCoverUv(distortedUv + vec2(edgeDistortion, 0.0))).r;
              float b = texture2D(tReveal, getCoverUv(distortedUv - vec2(edgeDistortion, 0.0))).b;
              revealColor.r = mix(revealColor.r, r, 0.7);
              revealColor.b = mix(revealColor.b, b, 0.7);
              
              // 4. Specular Highlight (The white light reflection on top of the glass)
              // Fake directional light coming from top-left
              vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.5));
              float spec = pow(max(dot(normal, lightDir), 0.0), 32.0); // 32 is shininess
              
              // 5. Shadow Rim (Darkens the absolute outer edge of the sphere for 3D depth)
              float rim = smoothstep(uRadius * 0.85, uRadius, dist) * 0.4; 
              
              // Apply lighting logic to the pixel
              revealColor.rgb += vec3(spec * 0.65); // Add glare
              revealColor.rgb -= vec3(rim);         // Subtract edge shadow
              
              // 6. Smooth Anti-aliased Edge Blending
              // Fades the jagged pixel edge between the glass and the base image
              float edgeAlpha = smoothstep(uRadius, uRadius - 0.002, dist);
              gl_FragColor = mix(baseColor, revealColor, edgeAlpha);
          } else {
              // Pixel is outside the glass orb
              gl_FragColor = baseColor;
          }
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;
    // Max radius of the glass orb relative to screen height
    // Reduced by ~20% based on user feedback
    const TARGET_RADIUS = 0.22; 
    let currentTargetRadius = 0;
    
    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      material.uniforms.uResolution.value.set(container.clientWidth, container.clientHeight, 1, 1);
    };
    window.addEventListener('resize', onResize);

    const render = () => {
      // Smoothly animate the radius popping in and out like a bubble
      material.uniforms.uRadius.value += (currentTargetRadius - material.uniforms.uRadius.value) * 0.1;
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - ((e.clientY - rect.top) / rect.height); // WebGL Y is bottom-to-top
      material.uniforms.uMouse.value.set(x, y);
    };

    const onMouseEnter = () => { 
        currentTargetRadius = TARGET_RADIUS; 
        setIsHovered(true);
    };
    const onMouseLeave = () => { 
        currentTargetRadius = 0; 
        setIsHovered(false);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

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
      className="absolute inset-0 w-full h-full cursor-none z-0"
    >
      {/* Sci-Fi HUD for the Lens Mode */}
      <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between z-10 transition-opacity duration-500">
          <div className="flex justify-between items-start w-full">
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-100 bg-black/40 backdrop-blur-md px-3 py-1 rounded shadow-lg border border-white/10">EXP_06</span>
            
            <span className={`text-[10px] font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded shadow-lg transition-all duration-300 ${
                isHovered ? 'bg-white text-zinc-900 border border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black/60 text-white border border-white/20'
            }`}>
              {isHovered ? 'LENS DEPLOYED' : 'STANDBY'}
            </span>
        </div>
        
        <div className="flex justify-between items-end w-full">
          <div className="text-3xl md:text-5xl font-display font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay">
            OPTICAL<br/>LENS
          </div>
          <div className="flex flex-col items-end gap-1 text-zinc-300 font-mono text-[9px] md:text-[10px] uppercase drop-shadow-md">
            <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">WEBGL SHADER</span>
            <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">FISHEYE MAGNIFICATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
