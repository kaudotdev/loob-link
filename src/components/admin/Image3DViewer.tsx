'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface Image3DViewerProps {
  frontImage: string;
  backImage: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export function Image3DViewer({ 
  frontImage, 
  backImage, 
  width = 600, 
  height = 400,
  aspectRatio = 0.75
}: Image3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x00ffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Card geometry - using aspectRatio
    const cardWidth = 3 * aspectRatio;
    const cardHeight = 3;
    const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, 0.1);
    
    // Load textures
    const textureLoader = new THREE.TextureLoader();
    let card: THREE.Mesh | null = null;

    Promise.all([
      textureLoader.loadAsync(frontImage),
      textureLoader.loadAsync(backImage)
    ]).then(([frontTexture, backTexture]) => {
      // Materials for each face of the card
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }), // right
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }), // left
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }), // top
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }), // bottom
        new THREE.MeshStandardMaterial({ 
          map: frontTexture,
          metalness: 0.1,
          roughness: 0.5
        }), // front
        new THREE.MeshStandardMaterial({ 
          map: backTexture,
          metalness: 0.1,
          roughness: 0.5
        }), // back
      ];

      card = new THREE.Mesh(geometry, materials);
      scene.add(card);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error loading textures:', err);
      setError('Erro ao carregar imagens');
      setIsLoading(false);
    });

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };

    // Zoom control
    let zoom = 5;
    let targetZoom = 5;
    const minZoom = 2;
    const maxZoom = 10;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !card) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotation.y += deltaX * 0.01;
      targetRotation.x += deltaY * 0.01;

      // Limit vertical rotation
      targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Zoom with mouse wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.002;
      targetZoom += e.deltaY * zoomSpeed;
      targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
    };

    // Touch support
    let touchDistance = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        };
      } else if (e.touches.length === 2) {
        // Pinch gesture
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging && card) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        targetRotation.y += deltaX * 0.01;
        targetRotation.x += deltaY * 0.01;

        targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));

        previousMousePosition = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        };
      } else if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (touchDistance > 0) {
          const delta = touchDistance - newDistance;
          targetZoom += delta * 0.01;
          targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
        }
        
        touchDistance = newDistance;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      touchDistance = 0;
    };

    // Add event listeners
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // Auto-rotation when not dragging
    let autoRotationSpeed = 0.002;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (card) {
        // Smooth rotation interpolation
        rotation.x += (targetRotation.x - rotation.x) * 0.1;
        rotation.y += (targetRotation.y - rotation.y) * 0.1;

        // Auto-rotate when not dragging
        if (!isDragging) {
          targetRotation.y += autoRotationSpeed;
        }

        card.rotation.x = rotation.x;
        card.rotation.y = rotation.y;
      }

      // Apply zoom smoothly
      zoom += (targetZoom - zoom) * 0.1;
      camera.position.z = zoom;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      renderer.dispose();
    };
  }, [frontImage, backImage, width, height]);

  return (
    <div className="relative inline-block">
      <div 
        ref={containerRef} 
        className="rounded-lg overflow-hidden border-2 border-[var(--admin-border)] shadow-lg"
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-cyan-400 font-mono text-sm">Carregando modelo 3D...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-red-400 font-mono text-sm">
            <span className="text-2xl mb-2 block">⚠</span>
            {error}
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 font-mono">
            🖱 Arraste para rotacionar • 🔍 Scroll para zoom • 📱 Pinch para zoom
          </p>
        </div>
      )}
    </div>
  );
}
