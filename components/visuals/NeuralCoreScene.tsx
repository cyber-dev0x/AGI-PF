'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Core() {
  const shellRef = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (shellRef.current) {
      shellRef.current.rotation.x = t * 0.12;
      shellRef.current.rotation.y = t * 0.22;
    }
    if (orbRef.current) {
      orbRef.current.rotation.x = t * -0.1;
      orbRef.current.rotation.z = t * 0.18;
      orbRef.current.position.y = Math.sin(t * 1.4) * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.24, 1]} />
        <meshStandardMaterial
          color="#8dfc3a"
          transparent
          opacity={0.12}
          roughness={0.1}
          metalness={0.4}
          wireframe
        />
      </mesh>

      <mesh ref={orbRef}>
        <icosahedronGeometry args={[0.68, 4]} />
        <MeshDistortMaterial
          color="#9eff43"
          roughness={0.12}
          metalness={0.28}
          distort={0.35}
          speed={1.6}
          emissive="#7ade2b"
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.02, 12, 140]} />
        <meshStandardMaterial color="#34dcff" emissive="#34dcff" emissiveIntensity={0.2} transparent opacity={0.7} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0.6, 0.2]}>
        <torusGeometry args={[1.93, 0.016, 12, 140]} />
        <meshStandardMaterial color="#baff6a" emissive="#baff6a" emissiveIntensity={0.2} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function DataStreams() {
  const count = 26;
  const paths = useMemo(() => {
    return Array.from({ length: count }, (_, idx) => {
      const radius = 1.35 + (idx % 3) * 0.44;
      const segments = 40;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i += 1) {
        const p = (i / segments) * Math.PI * 2;
        const wave = Math.sin(p * (idx % 5 + 1)) * 0.12;
        points.push(new THREE.Vector3(Math.cos(p) * radius, wave, Math.sin(p) * radius));
      }
      return points;
    });
  }, []);

  return (
    <group>
      {paths.map((points, idx) => (
        <Line
          key={idx}
          points={points}
          color={idx % 2 === 0 ? '#87f53c' : '#3ddcff'}
          lineWidth={0.5}
          transparent
          opacity={0.34}
        />
      ))}
    </group>
  );
}

function OrbitDots() {
  const dots = useMemo(
    () =>
      Array.from({ length: 34 }, (_, idx) => {
        const ring = idx % 3;
        const r = 1.6 + ring * 0.43;
        const a = (idx / 34) * Math.PI * 2;
        return {
          position: [Math.cos(a) * r, Math.sin(a * 1.7) * 0.22, Math.sin(a) * r] as [number, number, number],
          color: idx % 4 === 0 ? '#35d4ff' : '#b7ff60',
          scale: 0.018 + (idx % 5) * 0.004,
        };
      }),
    [],
  );

  return (
    <group>
      {dots.map((dot, idx) => (
        <Float key={idx} speed={1 + (idx % 7) * 0.08} rotationIntensity={1.3} floatIntensity={1.2}>
          <mesh position={dot.position} scale={dot.scale}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color={dot.color} emissive={dot.color} emissiveIntensity={0.45} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export function NeuralCoreScene() {
  return (
    <div className="neural-scene-wrap" aria-label="3D simulation of Milly runtime core">
      <Canvas camera={{ position: [0, 0.2, 4.6], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#04110a']} />
        <fog attach="fog" args={['#04110a', 4.2, 9]} />

        <ambientLight intensity={0.7} color="#a7ff5f" />
        <pointLight position={[2.4, 2.4, 2]} intensity={2.1} color="#a9ff5a" />
        <pointLight position={[-2.4, -1.5, -2]} intensity={1.5} color="#32d6ff" />

        <Core />
        <DataStreams />
        <OrbitDots />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.9}
          maxPolarAngle={Math.PI * 0.75}
          minPolarAngle={Math.PI * 0.25}
        />
      </Canvas>
    </div>
  );
}
