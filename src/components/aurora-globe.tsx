
"use client";

import React, { useRef, useEffect, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { City } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AuroraGlobeProps {
  cities: City[];
  selectedCity: City | null;
  onCitySelect: (city: City | null) => void;
  time: number;
  dataSource: 'nasa' | 'combined';
  scenario: { traffic: number; industry: number; rain: number };
}

const AuroraGlobe: React.FC<AuroraGlobeProps> = ({ cities, onCitySelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const clickableObjects = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 50;
    controls.enablePan = false;

    // Earth Globe
    const sphereGeometry = new THREE.SphereGeometry(10, 64, 64);
    
    // Realistic Earth Material
    const textureLoader = new THREE.TextureLoader();
    const earthTextureUrl = PlaceHolderImages.find(img => img.id === 'earth-texture')?.imageUrl;
    
    const earthMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load(earthTextureUrl || ''),
        metalness: 0.2,
        roughness: 0.7,
    });
    
    const earth = new THREE.Mesh(sphereGeometry, earthMaterial);
    scene.add(earth);
    
    // Outer wireframe sphere for accent
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00B2FF,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const wireframeEarth = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    wireframeEarth.scale.set(1.001, 1.001, 1.001);
    earth.add(wireframeEarth);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(15, 10, 5);
    scene.add(directionalLight);
    
    // Starfield
    const starVertices = [];
    for (let i = 0; i < 2000; i++) {
        const x = THREE.MathUtils.randFloatSpread(1000);
        const y = THREE.MathUtils.randFloatSpread(1000);
        const z = THREE.MathUtils.randFloatSpread(1000);
        starVertices.push(x, y, z);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0x555555, size: 0.3, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // City Markers
    clickableObjects.current = [];
    cities.forEach(city => {
      const lat = city.coords.lat * (Math.PI / 180);
      const lon = -city.coords.lng * (Math.PI / 180);
      const radius = 10.1;
      const x = radius * Math.cos(lat) * Math.sin(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.cos(lon);

      const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00B2FF });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, z);
      
      const glowSize = 0.3;
      const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00B2FF, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      marker.add(glow);

      marker.userData = { city };
      earth.add(marker);
      clickableObjects.current.push(marker);
    });

    // Raycaster for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects.current, true);

        if (intersects.length > 0) {
            let clickedObject = intersects[0].object;
            while (clickedObject.parent && !clickedObject.userData.city) {
                clickedObject = clickedObject.parent as THREE.Mesh;
            }
            if (clickedObject.userData.city) {
                onCitySelect(clickedObject.userData.city);
                
                // Animate zoom to India
                const indiaCoords = { lat: 20.5937, lng: 78.9629 };
                const targetPosition = new THREE.Vector3().setFromSphericalCoords(18, 
                    (90 - indiaCoords.lat) * (Math.PI / 180),
                    (indiaCoords.lng + 90) * (Math.PI / 180)
                );
                // quick implementation for zoom - a more robust one would use a tweening library
                camera.position.lerp(targetPosition, 0.5);
            }
        }
    };
    currentMount.addEventListener('click', onClick);

    // Resize handler
    const onResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      earth.rotation.y += 0.0005;
      stars.rotation.y += 0.0001;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      currentMount.removeEventListener('click', onClick);
      if (renderer.domElement.parentElement === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if(Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [cities, onCitySelect]);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};

export default memo(AuroraGlobe);
