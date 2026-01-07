import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BLUE_DOT = new THREE.Color(0x2563eb);

export function DottedSurface({ className = '', ...props }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    containerRef.current.appendChild(renderer.domElement);

    const positions = [];
    const colors = [];
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix += 1) {
      for (let iy = 0; iy < AMOUNTY; iy += 1) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        colors.push(BLUE_DOT.r, BLUE_DOT.g, BLUE_DOT.b);
      }
    }

    const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3),
    );

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId;
    const waveHeight = 50;
    const waveSpeed = 0.1;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const currentPositions = positionAttribute.array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix += 1) {
        for (let iy = 0; iy < AMOUNTY; iy += 1) {
          const index = i * 3;
          currentPositions[index + 1] =
            Math.sin((ix + count) * 0.3) * waveHeight +
            Math.sin((iy + count) * 0.5) * waveHeight;
          i += 1;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      count += waveSpeed;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      animationId,
    };

    return () => {
      window.removeEventListener('resize', handleResize);

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);

        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((materialInstance) => materialInstance.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        sceneRef.current.renderer.dispose();

        if (containerRef.current && sceneRef.current.renderer.domElement) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`dotted-surface ${className}`.trim()}
      {...props}
    />
  );
}
