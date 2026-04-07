"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

function OrbitalCluster({ pointer }: { pointer: { x: number; y: number } }) {
  const group = useRef<Group>(null);
  const positions = new Float32Array(
    Array.from({ length: 900 }, (_, index) => {
      const axis = index % 3;
      const shell = Math.floor(index / 3);
      const radius = 1.2 + (shell % 40) * 0.08;
      const angle = shell * 0.37;

      if (axis === 0) return Math.cos(angle) * radius;
      if (axis === 1) return Math.sin(angle * 1.2) * radius * 0.45;
      return Math.sin(angle) * radius;
    }),
  );

  useFrame((state) => {
    if (!group.current) return;

    group.current.rotation.y = state.clock.elapsedTime * 0.12 + pointer.x * 0.4;
    group.current.rotation.x = pointer.y * 0.12;
  });

  return (
    <group ref={group}>
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color="#f3d46b"
            emissive="#e9bb30"
            emissiveIntensity={0.35}
            wireframe
          />
        </mesh>
      </Float>
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial transparent size={0.08} color="#37c7b7" sizeAttenuation depthWrite={false} />
      </Points>
    </group>
  );
}

export function HeroScene() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function updatePointer(event: PointerEvent) {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * -2,
      });
    }

    window.addEventListener("pointermove", updatePointer);
    return () => window.removeEventListener("pointermove", updatePointer);
  }, []);

  return (
    <div className="absolute inset-0 opacity-80">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 42 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 5, 4]} intensity={1.2} color="#f3d46b" />
        <directionalLight position={[-4, -2, 3]} intensity={1} color="#37c7b7" />
        <OrbitalCluster pointer={pointer} />
      </Canvas>
    </div>
  );
}
