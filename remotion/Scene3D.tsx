import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import React from "react";

// ── ROTATING SHAPES ────────────────────────────────────────────────────────

const RotatingTorus: React.FC<{ color: string; frame: number; fps: number }> = ({ color, frame, fps }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 150 }, from: 0, to: 1 });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.012;
      meshRef.current.rotation.y += 0.018;
    }
  });

  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]}>
      <torusGeometry args={[1.8, 0.5, 32, 100]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
};

const RotatingIcosahedron: React.FC<{ color: string; frame: number; fps: number }> = ({ color, frame, fps }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 120 }, from: 0, to: 1 });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.008;
      meshRef.current.rotation.y += 0.015;
      meshRef.current.rotation.z += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]}>
      <icosahedronGeometry args={[1.8, 1]} />
      <meshStandardMaterial
        color={color}
        metalness={0.95}
        roughness={0.05}
        wireframe={false}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

const RotatingOctahedron: React.FC<{ color: string; frame: number; fps: number }> = ({ color, frame, fps }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 100 }, from: 0, to: 1.2 });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.015;
      meshRef.current.rotation.z += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]}>
      <octahedronGeometry args={[1.8]} />
      <meshStandardMaterial
        color={color}
        metalness={1}
        roughness={0.0}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const FloatingRings: React.FC<{ color: string }> = ({ color }) => {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) { ring1.current.rotation.x = t * 0.5; ring1.current.rotation.y = t * 0.3; }
    if (ring2.current) { ring2.current.rotation.x = -t * 0.4; ring2.current.rotation.z = t * 0.6; }
    if (ring3.current) { ring3.current.rotation.y = t * 0.7; ring3.current.rotation.z = -t * 0.3; }
  });

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[2.2, 0.06, 16, 100]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.06, 16, 100]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={ring3} rotation={[0, Math.PI / 3, Math.PI / 4]}>
        <torusGeometry args={[2.2, 0.06, 16, 100]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </>
  );
};

// ── SCENE 3D TYPES ────────────────────────────────────────────────────────
export type Shape3DType = "torus" | "icosahedron" | "octahedron" | "rings";

export const Scene3D: React.FC<{
  shape: Shape3DType;
  color: string;
  width: number;
  height: number;
}> = ({ shape, color, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cameraZ = interpolate(frame, [0, 60], [7, 5.5], { extrapolateRight: "clamp" });

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, cameraZ], fov: 50 }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color={color} />
      <spotLight position={[0, 8, 5]} intensity={3} color={color} angle={0.4} penumbra={0.8} />

      {shape === "torus" && <RotatingTorus color={color} frame={frame} fps={fps} />}
      {shape === "icosahedron" && <RotatingIcosahedron color={color} frame={frame} fps={fps} />}
      {shape === "octahedron" && <RotatingOctahedron color={color} frame={frame} fps={fps} />}
      {shape === "rings" && <FloatingRings color={color} />}
    </ThreeCanvas>
  );
};
