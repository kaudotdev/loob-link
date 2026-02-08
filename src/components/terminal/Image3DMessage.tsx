'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Image3DMessageProps {
  frontImage: string;
  backImage: string;
  caption?: string;
  aspectRatio?: number; // width/height ratio for the card (default: 0.75 = 3:4)
}

export function Image3DMessage({ frontImage, backImage, caption, aspectRatio = 0.75 }: Image3DMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    card: THREE.Mesh | null;
    animationId: number | null;
  } | null>(null);

  // Initialize 3D scene when expanded
  useEffect(() => {
    if (!isExpanded || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
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

    // Card geometry - using aspectRatio for proper proportions
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
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ 
          map: frontTexture,
          metalness: 0.1,
          roughness: 0.5
        }),
        new THREE.MeshStandardMaterial({ 
          map: backTexture,
          metalness: 0.1,
          roughness: 0.5
        }),
      ];

      card = new THREE.Mesh(geometry, materials);
      scene.add(card);
      sceneRef.current!.card = card;
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error loading textures:', err);
      setError('Erro ao carregar modelo 3D');
      setIsLoading(false);
    });

    // Mouse/Touch interaction
    let isDragging = false;
    let previousPosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    
    // Zoom control
    let zoom = 5; // Initial camera z position
    let targetZoom = 5;
    const minZoom = 2;
    const maxZoom = 10;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousPosition = { x: e.clientX, y: e.clientY };
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !card) return;

      const deltaX = e.clientX - previousPosition.x;
      const deltaY = e.clientY - previousPosition.y;

      targetRotation.y += deltaX * 0.01;
      targetRotation.x += deltaY * 0.01;
      targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));

      previousPosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      renderer.domElement.releasePointerCapture(e.pointerId);
    };

    // Zoom with mouse wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.002;
      targetZoom += e.deltaY * zoomSpeed;
      targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
    };

    // Touch pinch-to-zoom
    let touchDistance = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch gesture
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
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
      touchDistance = 0;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      sceneRef.current!.animationId = animationId;

      if (card) {
        rotation.x += (targetRotation.x - rotation.x) * 0.1;
        rotation.y += (targetRotation.y - rotation.y) * 0.1;

        if (!isDragging) {
          targetRotation.y += 0.002;
        }

        card.rotation.x = rotation.x;
        card.rotation.y = rotation.y;
      }

      // Apply zoom smoothly
      zoom += (targetZoom - zoom) * 0.1;
      camera.position.z = zoom;

      renderer.render(scene, camera);
    };

    sceneRef.current = { scene, camera, renderer, card, animationId: null };
    animate();

    // Cleanup
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      renderer.dispose();
    };
  }, [isExpanded, frontImage, backImage]);

  if (!isExpanded) {
    // Minimized state - show thumbnail
    return (
      <div className="inline-block">
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative block overflow-hidden rounded border-2 border-cyan-500 hover:border-cyan-300 transition-all transform hover:scale-105 active:scale-95"
          style={{ width: '200px', height: '150px' }}
        >
          <img
            src={frontImage}
            alt={caption || 'Imagem 3D'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23222" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dominant-baseline="middle"%3E📷 Erro%3C/text%3E%3C/svg%3E';
            }}
          />
          
          {/* Overlay with 3D icon */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-pulse">🎴</div>
              <div className="text-cyan-300 text-sm font-mono">Clique para ver em 3D</div>
            </div>
          </div>

          {/* Corner indicator */}
          <div className="absolute top-2 right-2 bg-cyan-500 text-black px-2 py-1 rounded text-xs font-bold">
            3D
          </div>
        </button>
        
        {caption && (
          <div className="mt-2 text-xs text-gray-400 font-mono max-w-[200px]">
            {caption}
          </div>
        )}
      </div>
    );
  }

  // Expanded state - show as popup/modal
  return (
    <>
      {/* Minimized thumbnail in the chat */}
      <div className="inline-block">
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative block overflow-hidden rounded border-2 border-cyan-500 hover:border-cyan-300 transition-all transform hover:scale-105 active:scale-95"
          style={{ width: '200px', height: '150px' }}
        >
          <img
            src={frontImage}
            alt={caption || 'Imagem 3D'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23222" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dominant-baseline="middle"%3E📷 Erro%3C/text%3E%3C/svg%3E';
            }}
          />
          
          {/* Overlay with 3D icon */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-pulse">🎴</div>
              <div className="text-cyan-300 text-sm font-mono">Clique para ver em 3D</div>
            </div>
          </div>

          {/* Corner indicator */}
          <div className="absolute top-2 right-2 bg-cyan-500 text-black px-2 py-1 rounded text-xs font-bold">
            3D
          </div>
        </button>
        
        {caption && (
          <div className="mt-2 text-xs text-gray-400 font-mono max-w-[200px]">
            {caption}
          </div>
        )}
      </div>

      {/* Modal Popup */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setIsExpanded(false)}
        >
          {/* Modal Content */}
          <div 
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 bg-black bg-opacity-50 backdrop-blur-sm border border-cyan-800 rounded-t-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 text-base font-mono">🎴 VISUALIZADOR 3D</span>
                {isLoading && (
                  <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white hover:bg-red-600 px-3 py-1 rounded border border-gray-600 hover:border-red-500 transition-all text-sm font-mono"
              >
                ✕ Fechar
              </button>
            </div>

            {caption && (
              <div className="mb-3 px-4 py-2 bg-black bg-opacity-50 backdrop-blur-sm border border-cyan-900 rounded text-sm text-gray-300 font-mono">
                {caption}
              </div>
            )}

            {/* 3D Container */}
            <div className="relative">
              <div 
                ref={containerRef}
                className="w-full rounded-lg overflow-hidden border-2 border-cyan-700 shadow-2xl shadow-cyan-900/50"
                style={{ 
                  height: '600px',
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                  touchAction: 'none'
                }}
              />

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-cyan-400 font-mono text-base">Carregando modelo 3D...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded-lg">
                  <div className="text-center text-red-400 font-mono">
                    <span className="text-4xl mb-3 block">⚠</span>
                    <p className="text-base">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {!isLoading && !error && (
              <div className="mt-3 text-center bg-black bg-opacity-50 backdrop-blur-sm border border-cyan-900 rounded-b-lg px-4 py-2">
                <p className="text-xs text-gray-400 font-mono">
                  🖱 Arraste para rotacionar • 🔍 Scroll para zoom • 📱 Pinch para zoom • 🔄 Auto-rotação ativa • 🖼 Clique fora para fechar
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
