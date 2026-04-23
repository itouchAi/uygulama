import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DepthMapCardProps {
  imageSrc: string;
  depthMapSrc: string;
  className?: string;
  intensity?: number;
}

export function DepthMapCard({ imageSrc, depthMapSrc, className = "", intensity = 0.5 }: DepthMapCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    // Setup Real 3D Scene with Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.z = 4; // Move the camera back manually
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    // Limit pixel ratio for dense geometries to maintain 60fps
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    
    // Convert FOV to radians to calculate correct plane size at Z=0
    const vFov = (camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
    const planeWidth = planeHeight * (width / height);
    
    // Define a highly subdivided 3D plane. 
    // 1.15 Scale acts as a slight zoom so when we rotate, we don't see the background edges
    // 256x256 segments guarantees super smooth vertex displacement.
    const geometry = new THREE.PlaneGeometry(planeWidth * 1.15, planeHeight * 1.15, 256, 256);
    
    const uniforms = {
      uImage: { value: null },
      uDepthMap: { value: null },
      uIntensity: { value: intensity },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform sampler2D uDepthMap;
        uniform float uIntensity;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          
          // Read depth value from texture (0.0 to 1.0)
          vec4 depthColor = texture2D(uDepthMap, uv);
          float depthValue = depthColor.r; 
          
          vec3 newPosition = position;
          // IMPORTANT: Here we PHYSICALLY PUSH vertices forward and backward in 3D space!
          // (depthValue - 0.5) puts structural center at Z=0. Bright pops out, dark sinks in.
          newPosition.z += (depthValue - 0.5) * uIntensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uImage;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(uImage, vUv);
          gl_FragColor = color;
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Load Textures
    Promise.all([
      textureLoader.loadAsync(imageSrc),
      textureLoader.loadAsync(depthMapSrc)
    ]).then(([img, depth]) => {
      // Small logic to ensure crisp interpolation
      img.minFilter = THREE.LinearFilter;
      depth.minFilter = THREE.LinearFilter;
      
      uniforms.uImage.value = img;
      uniforms.uDepthMap.value = depth;
    }).catch(e => console.error("Error loading textures", e));

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Handle Mouse Flow
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      // Note the inverted Y axis logic for standard rotation alignment
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouse.current.targetX = x;
      mouse.current.targetY = y;
    };
    
    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation Render Loop
    let animationFrameId: number;
    const render = () => {
      // Spring lerping for mouse
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

      // DO NOT SHIFT UNIFORM UVS
      // Instead, PHYSICALLY ROTATE THE GENERATED 3D SCULPT
      mesh.rotation.y = mouse.current.x * 0.35; // Pan left/right
      mesh.rotation.x = -mouse.current.y * 0.35; // Tilt up/down
      
      // Slight positional shifting adds to the optical illusion
      mesh.position.x = mouse.current.x * 0.1;
      mesh.position.y = mouse.current.y * 0.1;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [imageSrc, depthMapSrc, intensity]);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      style={{ borderRadius: 'inherit' }}
    />
  );
}
