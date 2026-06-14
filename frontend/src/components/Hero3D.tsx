"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MeshDistortMaterial,
  MeshTransmissionMaterial,
  PointMaterial,
  Line,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

// ── Helpers ──────────────────────────────────────────────────────────────

/** Generate N random points on a sphere at radius r */
function spherePoints(n: number, r: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pts.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ),
    );
  }
  return pts;
}

// ── Orbiting Animal Node ────────────────────────────────────────────────

function AnimalNode({
  position,
  floatOffset,
}: {
  position: THREE.Vector3;
  floatOffset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() + floatOffset;
    meshRef.current.position.y += Math.sin(t * 0.6) * 0.0008;
    meshRef.current.position.x += Math.cos(t * 0.5 + floatOffset) * 0.0006;
    meshRef.current.rotation.z += 0.008;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.08, 0]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transmission={0.85}
        roughness={0}
        clearcoat={1}
        metalness={0}
        thickness={0.5}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

// ── Constellation Lines ─────────────────────────────────────────────────

function Constellation({
  nodes,
}: {
  nodes: THREE.Vector3[];
}) {
  const center = new THREE.Vector3(0, 0, 0);

  // Connect each node to the center + some nearest neighbors
  const segments = useMemo(() => {
    const segs: number[] = [];
    const add = (a: THREE.Vector3, b: THREE.Vector3) => {
      segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };

    nodes.forEach((n) => {
      // To center
      add(n, center);
      // To 1–2 nearest neighbours (by insertion order proximity)
      const nearest = nodes
        .map((other, idx) => ({ dist: n.distanceTo(other), idx }))
        .filter((o) => o.dist > 0.3 && o.dist < 2.5)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);
      nearest.forEach(({ idx }) => add(n, nodes[idx]));
    });

    return new Float32Array(segs);
  }, [nodes]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={segments.length / 3}
          array={segments}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#a5b4fc" transparent opacity={0.25} />
    </lineSegments>
  );
}

// ── Glow Particles ──────────────────────────────────────────────────────

function Starfield({ count = 120 }) {
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 5;
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
    }
    return p;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.03}
        color="#a5b4fc"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ── Orbital Ring ────────────────────────────────────────────────────────

function OrbitalRing({ radius = 2.2, tilt = 0 }) {
  const points = useMemo(() => {
    const p: number[] = [];
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      p.push(
        radius * Math.cos(theta),
        radius * Math.sin(theta) * Math.sin(tilt),
        radius * Math.sin(theta) * Math.cos(tilt),
      );
    }
    return new Float32Array(p);
  }, [radius, tilt]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#818cf8" transparent opacity={0.12} />
    </line>
  );
}

// ── Glass Animal Silhouette Nodes ───────────────────────────────────────
// We use Text glyphs rendered as glass spheres with symbol hints

function SilhouetteNode({
  position,
  symbol,
  floatOffset,
}: {
  position: THREE.Vector3;
  symbol: string;
  floatOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + floatOffset;
    groupRef.current.position.y += Math.sin(t * 0.7 + 1) * 0.0012;
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z += Math.sin(t * 0.3) * 0.003;
  });

  // Glass core
  return (
    <group ref={groupRef} position={position}>
      {/* Glass sphere */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <MeshTransmissionMaterial
          color="#ffffff"
          transmission={0.9}
          roughness={0}
          clearcoat={1}
          metalness={0}
          thickness={0.4}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Symbol text */}
      <Text
        position={[0, 0, 0.12]}
        fontSize={0.08}
        color="#e0e7ff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Regular.woff"
      >
        {symbol}
      </Text>
    </group>
  );
}

// ── Mouse-Following Constellation ──────────────────────────────────────

function ConstellationScene() {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  // 20 orbiting nodes
  const nodes = useMemo(() => spherePoints(20, 2.6), []);

  // 8 silhouette nodes (paw, dog, cat glyphs)
  const silhouetteData = useMemo(() => {
    const symbols = ["🐾", "🐕", "🐈", "🐾", "🐕", "🐈", "🐾", "🐕"];
    return spherePoints(8, 3.2).map((pos, i) => ({
      position: pos,
      symbol: symbols[i % symbols.length],
      floatOffset: i * 1.3,
    }));
  }, []);

  // Mouse tracking
  const { size } = useThree();
  const handlePointerMove = useMemo(
    () => (e: { clientX: number; clientY: number }) => {
      mouse.current.x = (e.clientX / size.width) * 2 - 1;
      mouse.current.y = -(e.clientY / size.height) * 2 + 1;
    },
    [size],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    // Gentle mouse-follow tilt on the whole constellation
    groupRef.current.rotation.x +=
      (mouse.current.y * 0.12 - groupRef.current.rotation.x) * 0.03;
    groupRef.current.rotation.y +=
      (mouse.current.x * 0.15 - groupRef.current.rotation.y) * 0.03;
  });

  return (
    <group ref={groupRef} onPointerMove={handlePointerMove}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} />
      <directionalLight position={[-4, -2, 3]} intensity={0.6} color="#a5b4fc" />

      {/* Orbital rings */}
      <OrbitalRing radius={2.4} tilt={0.3} />
      <OrbitalRing radius={2.8} tilt={0.7} />
      <OrbitalRing radius={3.2} tilt={1.1} />

      {/* Central glass globe */}
      <mesh scale={2.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#ffffff"
          emissive="#e0e7ff"
          emissiveIntensity={0.15}
          distort={0.4}
          speed={1.5}
          roughness={0}
          metalness={0.85}
          transparent={false}
        />
      </mesh>

      {/* Constellation lines */}
      <Constellation nodes={nodes} />

      {/* Animal glass nodes */}
      {nodes.map((pos, i) => (
        <AnimalNode key={`node-${i}`} position={pos} floatOffset={i * 2} />
      ))}

      {/* Silhouette nodes with glass spheres + emoji */}
      {silhouetteData.map((d, i) => (
        <SilhouetteNode
          key={`sil-${i}`}
          position={d.position}
          symbol={d.symbol}
          floatOffset={d.floatOffset}
        />
      ))}

      {/* Starfield */}
      <Starfield count={120} />
    </group>
  );
}

// ── Exported Component ──────────────────────────────────────────────────

/**
 * Premium full-bleed background 3D "Rescue Network" constellation.
 * Central liquid-silver globe surrounded by orbiting glass animal nodes,
 * constellation lines, orbital rings, and a subtle starfield.
 * Gently follows mouse movement.
 */
export function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ConstellationScene />
        </Suspense>
      </Canvas>
    </div>
  );
}