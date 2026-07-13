'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeInteractiveShapeProps {
  layout?: string;
}

export default function ThreeInteractiveShape({ layout = 'default' }: ThreeInteractiveShapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    // Check if 3D mode is globally enabled
    const isThreeDEnabled = localStorage.getItem('3d_mode') !== 'false';
    if (!isThreeDEnabled) return;

    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera setup
    const size = 300; // Fixed size for the interactive element
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 8;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Set color theme
    let colorVal = 0x00C950; // Neon Green
    if (layout === 'aurora') {
      colorVal = 0x818CF8; // Purple/indigo
    } else if (layout === 'gold') {
      colorVal = 0xF59E0B; // Gold
    } else if (layout === 'slate') {
      colorVal = 0x94A3B8; // Slate
    }

    // 5. Create double nested geometric wireframes for complexity
    const outerGeom = new THREE.IcosahedronGeometry(2, 1);
    const innerGeom = new THREE.OctahedronGeometry(1.2, 0);

    const outerMat = new THREE.MeshBasicMaterial({
      color: colorVal,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });

    const innerMat = new THREE.MeshBasicMaterial({
      color: colorVal,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });

    const outerMesh = new THREE.Mesh(outerGeom, outerMat);
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);

    scene.add(outerMesh);
    scene.add(innerMesh);

    // 6. Mouse movement tracking
    const handleMouseMove = (event: MouseEvent) => {
      // Get normalized mouse position relative to window center (-1 to 1)
      mouseRef.current.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Animation Loop
    let lastTime = 0;
    let isIntersecting = true;

    const animate = (time: number) => {
      if (!isIntersecting || document.hidden) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      // Smoothly lerp mouse positions for fluid movement
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 4 * delta;
      mouse.y += (mouse.targetY - mouse.y) * 4 * delta;

      // Base rotation
      outerMesh.rotation.y += 0.2 * delta;
      outerMesh.rotation.x += 0.1 * delta;
      innerMesh.rotation.y -= 0.3 * delta;
      innerMesh.rotation.z += 0.15 * delta;

      // Tilt based on mouse position
      outerMesh.rotation.x = mouse.y * 0.8;
      outerMesh.rotation.y = mouse.x * 0.8;
      
      innerMesh.rotation.x = -mouse.y * 0.6;
      innerMesh.rotation.y = -mouse.x * 0.6;

      // Pulsing effect
      const scale = 1 + Math.sin(time * 0.0015) * 0.05;
      outerMesh.scale.set(scale, scale, scale);
      innerMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    // 8. Observer to pause when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // Start animation loop
    animationFrameIdRef.current = requestAnimationFrame(animate);

    // 9. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      // Dispose resources
      outerGeom.dispose();
      innerGeom.dispose();
      outerMat.dispose();
      innerMat.dispose();

      // Remove Canvas element
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [layout]);

  return (
    <div 
      ref={containerRef} 
      className="w-[280px] h-[280px] flex items-center justify-center pointer-events-none select-none relative"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
