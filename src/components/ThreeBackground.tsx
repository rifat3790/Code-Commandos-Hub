'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  layoutTheme?: string;
  animationStyle?: string;
}

export default function ThreeBackground({ 
  layoutTheme = 'default', 
  animationStyle = 'default' 
}: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const checkPreference = () => {
      setIsEnabled(localStorage.getItem('3d_mode') !== 'false');
    };
    checkPreference();
    window.addEventListener('3d_mode_changed', checkPreference);
    return () => window.removeEventListener('3d_mode_changed', checkPreference);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent to see CSS background gradient

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 4, 18);
    camera.lookAt(0, 1.5, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Color Palette based on layoutTheme
    let primaryColor = 0x00C950; // Neon Green
    let secondaryColor = 0x005020; // Dark Green

    if (layoutTheme === 'aurora') {
      primaryColor = 0x6366F1; // Indigo
      secondaryColor = 0xA855F7; // Purple
    } else if (layoutTheme === 'gold') {
      primaryColor = 0xF59E0B; // Gold
      secondaryColor = 0x78350F; // Bronze/Gold
    } else if (layoutTheme === 'slate') {
      primaryColor = 0x94A3B8; // Slate/Silver
      secondaryColor = 0x334155; // Steel
    } else if (layoutTheme === 'cyber') {
      primaryColor = 0x10B981; // Cyber Emerald
      secondaryColor = 0x06B6D4; // Cyan Glow
    }

    // 5. Ambient Grid Helper (Conditional on Style)
    let gridHelper: THREE.GridHelper | null = null;
    const hasGrid = ['default', 'lava', 'glitch'].includes(animationStyle);

    if (hasGrid) {
      gridHelper = new THREE.GridHelper(60, 30, primaryColor, secondaryColor);
      gridHelper.position.y = -2.5;
      if (gridHelper.material instanceof THREE.Material) {
        gridHelper.material.opacity = animationStyle === 'glitch' ? 0.08 : 0.15;
        gridHelper.material.transparent = true;
      }
      scene.add(gridHelper);
    }

    // 6. Floating 3D Geometries
    const geometries = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.8, 0.25, 8, 16),
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.TorusKnotGeometry(0.5, 0.18, 24, 4),
      new THREE.ConeGeometry(0.7, 1.3, 4),
    ];

    const materials = [
      new THREE.MeshBasicMaterial({ color: primaryColor, wireframe: true, transparent: true, opacity: 0.35 }),
      new THREE.MeshBasicMaterial({ color: secondaryColor, wireframe: true, transparent: true, opacity: 0.25 }),
    ];

    const floatingObjects: THREE.Mesh[] = [];
    const objectCount = ['matrix', 'gold'].includes(animationStyle) ? 4 : (animationStyle === 'nebula' ? 14 : 10);

    for (let i = 0; i < objectCount; i++) {
      const geom = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geom, mat);
      
      mesh.position.set(
        (Math.random() - 0.5) * 28,
        Math.random() * 8 + 0.5,
        (Math.random() - 0.5) * 18
      );

      const scale = Math.random() * 0.5 + 0.35;
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);
      floatingObjects.push(mesh);
    }

    // 7. Particle Systems based on Style
    let particleCount = 80;
    if (['ocean', 'matrix', 'cyber'].includes(animationStyle)) particleCount = 180;
    if (animationStyle === 'aurora') particleCount = 150;

    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number, y: number, z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      if (animationStyle === 'ocean') {
        const cols = Math.floor(Math.sqrt(particleCount));
        const r = Math.floor(i / cols);
        const c = i % cols;
        particlePositions[i * 3] = (r - cols / 2) * 3.5;
        particlePositions[i * 3 + 1] = 0;
        particlePositions[i * 3 + 2] = (c - cols / 2) * 3.5;
      } else if (animationStyle === 'aurora') {
        // Spiral vortex layout
        const angle = i * 0.15;
        const radius = i * 0.08 + Math.random() * 1.5;
        particlePositions[i * 3] = Math.cos(angle) * radius;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4 + 1;
        particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      } else if (animationStyle === 'gold') {
        // Spherical shell layout
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 7 + (Math.random() - 0.5) * 0.8;
        particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 2;
        particlePositions[i * 3 + 2] = r * Math.cos(phi);
      } else if (animationStyle === 'slate') {
        // Plexus bounded layout
        particlePositions[i * 3] = (Math.random() - 0.5) * 24;
        particlePositions[i * 3 + 1] = Math.random() * 6 - 0.5;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
        particleVelocities.push({
          x: (Math.random() - 0.5) * 1.2,
          y: (Math.random() - 0.5) * 0.8,
          z: (Math.random() - 0.5) * 1.2
        });
      } else if (animationStyle === 'cyber') {
        // Tunnel starfield zooming
        particlePositions[i * 3] = (Math.random() - 0.5) * 20;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        particlePositions[i * 3 + 2] = Math.random() * 50 - 30; // Z coordinates
      } else if (animationStyle === 'matrix') {
        // Fall rain
        particlePositions[i * 3] = (Math.random() - 0.5) * 36;
        particlePositions[i * 3 + 1] = Math.random() * 20 - 5;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
      } else {
        // Standard random distribution
        particlePositions[i * 3] = (Math.random() - 0.5) * 44;
        particlePositions[i * 3 + 1] = Math.random() * 12 + 1;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 32;
      }
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: primaryColor,
      size: ['matrix', 'ocean', 'cyber'].includes(animationStyle) ? 0.12 : 0.08,
      transparent: true,
      opacity: animationStyle === 'matrix' ? 0.75 : 0.45,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Nebula Pink/Secondary Starfield
    let particles2: THREE.Points | null = null;
    let particleGeometry2: THREE.BufferGeometry | null = null;
    let particleMaterial2: THREE.PointsMaterial | null = null;

    if (animationStyle === 'nebula') {
      const particleCount2 = 80;
      particleGeometry2 = new THREE.BufferGeometry();
      const particlePositions2 = new Float32Array(particleCount2 * 3);
      for (let i = 0; i < particleCount2; i++) {
        particlePositions2[i * 3] = (Math.random() - 0.5) * 38;
        particlePositions2[i * 3 + 1] = Math.random() * 10 + 1;
        particlePositions2[i * 3 + 2] = (Math.random() - 0.5) * 28;
      }
      particleGeometry2.setAttribute('position', new THREE.BufferAttribute(particlePositions2, 3));
      particleMaterial2 = new THREE.PointsMaterial({
        color: secondaryColor,
        size: 0.12,
        transparent: true,
        opacity: 0.55,
      });
      particles2 = new THREE.Points(particleGeometry2, particleMaterial2);
      scene.add(particles2);
    }

    // Plexus Network LineSegments
    let plexusLines: THREE.LineSegments | null = null;
    let plexusLineGeometry: THREE.BufferGeometry | null = null;
    let plexusLineMaterial: THREE.LineBasicMaterial | null = null;
    const maxConnections = 120;

    if (animationStyle === 'slate') {
      plexusLineGeometry = new THREE.BufferGeometry();
      const plexusLinePositions = new Float32Array(maxConnections * 2 * 3);
      plexusLineGeometry.setAttribute('position', new THREE.BufferAttribute(plexusLinePositions, 3));
      plexusLineMaterial = new THREE.LineBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.2,
      });
      plexusLines = new THREE.LineSegments(plexusLineGeometry, plexusLineMaterial);
      scene.add(plexusLines);
    }

    // Big central sphere geometry for "gold" style
    let centralSphere: THREE.Mesh | null = null;
    let centralSphereGeometry: THREE.IcosahedronGeometry | null = null;
    let centralSphereMaterial: THREE.MeshBasicMaterial | null = null;

    if (animationStyle === 'gold') {
      centralSphereGeometry = new THREE.IcosahedronGeometry(3.5, 2);
      centralSphereMaterial = new THREE.MeshBasicMaterial({
        color: primaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.28
      });
      centralSphere = new THREE.Mesh(centralSphereGeometry, centralSphereMaterial);
      centralSphere.position.set(0, 2, 0);
      scene.add(centralSphere);
    }

    // Cylindrical wireframe tunnel for "cyber" style
    let tunnel: THREE.Mesh | null = null;
    let tunnelGeometry: THREE.CylinderGeometry | null = null;
    let tunnelMaterial: THREE.MeshBasicMaterial | null = null;

    if (animationStyle === 'cyber') {
      tunnelGeometry = new THREE.CylinderGeometry(5.5, 5.5, 50, 10, 10, true);
      tunnelMaterial = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.rotation.x = Math.PI / 2;
      tunnel.position.set(0, 0, -10);
      scene.add(tunnel);
    }

    // 8. Animation Loop
    let lastTime = 0;
    let isIntersecting = true;

    const animate = (time: number) => {
      if (!isIntersecting || document.hidden) {
        animationFrameIdRef.current = null;
        return;
      }

      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      // Rotate floor grid if exists
      if (gridHelper) {
        gridHelper.rotation.y += (animationStyle === 'glitch' ? 0.008 : 0.015) * delta;
      }

      // Rotate/Oscillate special central entities
      if (centralSphere) {
        centralSphere.rotation.x += 0.04 * delta;
        centralSphere.rotation.y += 0.07 * delta;
        const scalePulse = Math.sin(time * 0.001) * 0.08 + 1.0;
        centralSphere.scale.set(scalePulse, scalePulse, scalePulse);
      }

      if (tunnel) {
        tunnel.rotation.y += 0.05 * delta;
      }

      // Animate floating objects
      floatingObjects.forEach((obj, idx) => {
        obj.rotation.x += (0.08 + (idx % 3) * 0.04) * delta;
        obj.rotation.y += (0.12 + (idx % 2) * 0.03) * delta;
        
        // Float/Wave positioning
        obj.position.y += Math.sin(time * 0.001 + idx) * 0.002;

        if (animationStyle === 'lava') {
          // Breathing scale
          const pulse = Math.sin(time * 0.0015 + idx) * 0.15 + 1.0;
          obj.scale.set(pulse, pulse, pulse);
        }

        if (animationStyle === 'glitch') {
          // Digital glitch trigger
          if (Math.random() < 0.004) {
            obj.position.x += (Math.random() - 0.5) * 1.8;
            obj.rotation.z += (Math.random() - 0.5) * 0.7;
            setTimeout(() => {
              obj.position.x -= (Math.random() - 0.5) * 1.8;
            }, 55);
          }
        }
      });

      // Animate particle systems depending on selected style
      const positions = particleGeometry.attributes.position.array as Float32Array;

      if (animationStyle === 'ocean') {
        for (let i = 0; i < particleCount; i++) {
          const px = positions[i * 3];
          const pz = positions[i * 3 + 2];
          positions[i * 3 + 1] = Math.sin(px * 0.14 + time * 0.0009) * Math.cos(pz * 0.14 + time * 0.0009) * 1.5;
        }
      } else if (animationStyle === 'matrix') {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] -= 4.2 * delta; // Fall speed
          if (positions[i * 3 + 1] < -6) {
            positions[i * 3 + 1] = 14; // Reset to top
            positions[i * 3] = (Math.random() - 0.5) * 36;
          }
        }
      } else if (animationStyle === 'lava') {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += 1.4 * delta; // Rising embers
          positions[i * 3] += Math.sin(time * 0.0008 + i) * 0.008;
          if (positions[i * 3 + 1] > 14) {
            positions[i * 3 + 1] = -2;
            positions[i * 3] = (Math.random() - 0.5) * 36;
          }
        }
      } else if (animationStyle === 'cyber') {
        // Warp Tunnel flying stars
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 2] += 16.0 * delta; // move towards screen
          if (positions[i * 3 + 2] > 20) {
            positions[i * 3 + 2] = -30; // reset far away
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
          }
        }
      } else if (animationStyle === 'aurora') {
        // Orbiting spiral particles
        for (let i = 0; i < particleCount; i++) {
          const px = positions[i * 3];
          const pz = positions[i * 3 + 2];
          const currentAngle = Math.atan2(pz, px);
          const currentRadius = Math.sqrt(px*px + pz*pz);
          const speed = 0.4 / (currentRadius + 0.5);
          
          const newAngle = currentAngle + speed * delta * 15;
          positions[i * 3] = Math.cos(newAngle) * currentRadius;
          positions[i * 3 + 2] = Math.sin(newAngle) * currentRadius;
          positions[i * 3 + 1] += Math.sin(time * 0.001 + i) * 0.001;
        }
      } else if (animationStyle === 'slate') {
        // Plexus nodes drift and bounce
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += particleVelocities[i].x * delta * 1.5;
          positions[i * 3 + 1] += particleVelocities[i].y * delta * 1.2;
          positions[i * 3 + 2] += particleVelocities[i].z * delta * 1.5;

          if (Math.abs(positions[i * 3]) > 14) particleVelocities[i].x *= -1;
          if (positions[i * 3 + 1] > 6.5 || positions[i * 3 + 1] < -1.5) particleVelocities[i].y *= -1;
          if (Math.abs(positions[i * 3 + 2]) > 10) particleVelocities[i].z *= -1;
        }

        // Draw connections lines
        if (plexusLines && plexusLineGeometry) {
          const linePos = plexusLineGeometry.attributes.position.array as Float32Array;
          linePos.fill(0);
          let connCount = 0;

          for (let i = 0; i < particleCount; i++) {
            const x1 = positions[i * 3];
            const y1 = positions[i * 3 + 1];
            const z1 = positions[i * 3 + 2];

            for (let j = i + 1; j < particleCount; j++) {
              const x2 = positions[j * 3];
              const y2 = positions[j * 3 + 1];
              const z2 = positions[j * 3 + 2];

              const dist = Math.sqrt((x1 - x2)**2 + (y1 - y2)**2 + (z1 - z2)**2);
              if (dist < 5.0 && connCount < maxConnections) {
                linePos[connCount * 6] = x1;
                linePos[connCount * 6 + 1] = y1;
                linePos[connCount * 6 + 2] = z1;
                linePos[connCount * 6 + 3] = x2;
                linePos[connCount * 6 + 4] = y2;
                linePos[connCount * 6 + 5] = z2;
                connCount++;
              }
            }
          }
          plexusLineGeometry.attributes.position.needsUpdate = true;
          plexusLineGeometry.setDrawRange(0, connCount * 2);
        }
      } else {
        // Standard shimmer stars
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(time * 0.002 + i) * 0.0012;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Animate secondary starfield for nebula
      if (particles2 && particleGeometry2) {
        const positions2 = particleGeometry2.attributes.position.array as Float32Array;
        for (let i = 0; i < 80; i++) {
          positions2[i * 3] += Math.sin(time * 0.0005 + i) * 0.002;
          positions2[i * 3 + 1] += Math.cos(time * 0.0005 + i) * 0.002;
        }
        particleGeometry2.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    // 9. Visibility change & intersection observer optimization
    const handleVisibilityChange = () => {
      if (!document.hidden && isIntersecting) {
        if (!animationFrameIdRef.current) {
          lastTime = performance.now();
          animationFrameIdRef.current = requestAnimationFrame(animate);
        }
      } else {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          handleVisibilityChange();
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // 10. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Start animation
    animationFrameIdRef.current = requestAnimationFrame(animate);

    // 11. Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      // Dispose Geometries and Materials
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (particleGeometry2) particleGeometry2.dispose();
      if (particleMaterial2) particleMaterial2.dispose();
      if (plexusLineGeometry) plexusLineGeometry.dispose();
      if (plexusLineMaterial) plexusLineMaterial.dispose();
      if (centralSphereGeometry) centralSphereGeometry.dispose();
      if (centralSphereMaterial) centralSphereMaterial.dispose();
      if (tunnelGeometry) tunnelGeometry.dispose();
      if (tunnelMaterial) tunnelMaterial.dispose();

      // Remove canvas
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [layoutTheme, animationStyle, isEnabled]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
