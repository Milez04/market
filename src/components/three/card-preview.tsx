"use client";

import { Environment, Float, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import type { Mesh } from "three";
import { MeshPhysicalMaterial } from "three";
import type { CardFinish, DesignerElement } from "@/types/card";
import { createCardTexture } from "@/components/three/card-texture";

function finishMaterial(finish: CardFinish, map: ReturnType<typeof createCardTexture>) {
  return new MeshPhysicalMaterial({
    map: map ?? undefined,
    metalness: finish === "foil" ? 0.64 : 0.08,
    roughness: finish === "matte" ? 0.82 : finish === "spot-uv" ? 0.24 : 0.38,
    clearcoat: finish === "spot-uv" ? 1 : 0.45,
    clearcoatRoughness: finish === "spot-uv" ? 0.12 : 0.35,
    reflectivity: finish === "foil" ? 0.85 : 0.45,
    transmission: 0,
    thickness: 0.04,
  });
}

function CardMesh({
  elements,
  side,
  finish,
  cardColor,
  autoRotate = true,
}: {
  elements: DesignerElement[];
  side: "front" | "back";
  finish: CardFinish;
  cardColor: string;
  autoRotate?: boolean;
}) {
  const ref = useRef<Mesh>(null);
  const texture = useMemo(() => createCardTexture(elements, side, finish, cardColor), [elements, side, finish, cardColor]);
  const material = useMemo(() => finishMaterial(finish, texture), [finish, texture]);

  useFrame((state) => {
    if (!ref.current || !autoRotate) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.24;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });

  return (
    <Float speed={1.25} rotationIntensity={0.12} floatIntensity={0.35}>
      <group>
        <RoundedBox ref={ref} args={[4.15, 2.42, 0.08]} radius={0.12} smoothness={14} material={material} />
        {finish === "emboss" && (
          <RoundedBox args={[1.15, 0.32, 0.096]} radius={0.05} smoothness={8} position={[-1.06, 0.54, 0.012]}>
            <meshPhysicalMaterial color="#ffffff" roughness={0.48} metalness={0.1} transparent opacity={0.34} />
          </RoundedBox>
        )}
      </group>
    </Float>
  );
}

export function CardPreview3D({
  elements,
  side = "front",
  finish = "foil",
  cardColor = "#0b1120",
  className = "",
  label = "Live 3D print preview",
}: {
  elements: DesignerElement[];
  side?: "front" | "back";
  finish?: CardFinish;
  cardColor?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-lg border bg-black ${className}`}>
      <Canvas camera={{ position: [0, 0, 5.2], fov: 42 }} dpr={[1, 1.8]} gl={{ antialias: true }}>
        <color attach="background" args={["#07080d"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={2.6} />
        <spotLight position={[-3, 3, 4]} intensity={2.2} angle={0.5} penumbra={0.7} />
        <Suspense fallback={<Html center className="text-sm text-white">Rendering preview</Html>}>
          <CardMesh elements={elements} side={side} finish={finish} cardColor={cardColor} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={3.4} maxDistance={7.2} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur">
        {label}
      </div>
    </div>
  );
}
