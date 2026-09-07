"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";

function PawModel() {
  const toes: [number, number, number][] = [
    [-0.42, 0.4, -0.02],
    [-0.14, 0.52, 0.04],
    [0.14, 0.52, 0.04],
    [0.42, 0.4, -0.02],
  ];
  return (
    <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.2}>
      <group>
        {/* main pad */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.55, 48, 48]} />
          <MeshDistortMaterial
            color="#10B981"
            distort={0.28}
            speed={1.4}
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
        {/* four toes */}
        {toes.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <MeshDistortMaterial
              color="#059669"
              distort={0.18}
              speed={1.1}
              roughness={0.4}
              metalness={0.02}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

export function PawEmblem() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduced) {
    return (
      <div className="relative h-40 w-40 rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 lg:h-48 lg:w-48" />
    );
  }

  return (
    <div className="relative h-40 w-40 lg:h-48 lg:w-48" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} />
        <pointLight position={[-3, -2, 3]} intensity={0.4} color="#F59E0B" />
        <Suspense fallback={null}>
          <PawModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
