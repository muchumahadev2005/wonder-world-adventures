import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Sparkles as DreiSparkles } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

// Cute forest-spirit "buddy": round cream body, big eyes, leaf on top, tiny ears.
const ForestSpirit = ({ onTap }: { onTap: () => void }) => {
  const group = useRef<THREE.Group>(null);
  const leftLid = useRef<THREE.Mesh>(null);
  const rightLid = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [jumpT, setJumpT] = useState(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // idle breathing
      const s = 1 + Math.sin(t * 1.6) * 0.025;
      group.current.scale.set(s, s, s);
      // jump
      if (jumpT > 0) {
        const jp = Math.sin((1 - jumpT) * Math.PI) * 0.55;
        group.current.position.y = jp;
        setJumpT(Math.max(0, jumpT - dt * 1.6));
      } else {
        group.current.position.y = THREE.MathUtils.lerp(
          group.current.position.y,
          0,
          0.1,
        );
      }
      // gentle mouse follow via pointer
      const px = (state.pointer.x ?? 0) * 0.35;
      const py = (state.pointer.y ?? 0) * 0.2;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        px,
        0.05,
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        -py,
        0.05,
      );
    }
    // blink every ~3.5s
    const blink = Math.max(0, Math.sin(t * 1.8) > 0.985 ? 0.05 : 1);
    if (leftLid.current && rightLid.current) {
      leftLid.current.scale.y = blink;
      rightLid.current.scale.y = blink;
    }
  });

  const handleClick = () => {
    setJumpT(1);
    onTap();
  };

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
      <group
        ref={group}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        {/* Body */}
        <Sphere args={[0.95, 48, 48]} position={[0, -0.15, 0]}>
          <meshStandardMaterial
            color={hovered ? "#FFE9C7" : "#FFE0B0"}
            roughness={0.6}
            metalness={0.05}
          />
        </Sphere>
        {/* Belly highlight */}
        <Sphere args={[0.55, 32, 32]} position={[0, -0.25, 0.55]}>
          <meshStandardMaterial color="#FFF3DD" roughness={0.7} />
        </Sphere>
        {/* Head (slightly merged) */}
        <Sphere args={[0.7, 48, 48]} position={[0, 0.65, 0]}>
          <meshStandardMaterial color="#FFE9C7" roughness={0.6} />
        </Sphere>
        {/* Ears */}
        <mesh position={[-0.45, 1.15, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.18, 0.42, 16]} />
          <meshStandardMaterial color="#E8B872" roughness={0.7} />
        </mesh>
        <mesh position={[0.45, 1.15, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.18, 0.42, 16]} />
          <meshStandardMaterial color="#E8B872" roughness={0.7} />
        </mesh>
        {/* Inner ears */}
        <mesh position={[-0.45, 1.1, 0.05]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.09, 0.28, 12]} />
          <meshStandardMaterial color="#FFB0C8" roughness={0.7} />
        </mesh>
        <mesh position={[0.45, 1.1, 0.05]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.09, 0.28, 12]} />
          <meshStandardMaterial color="#FFB0C8" roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <Sphere args={[0.13, 24, 24]} position={[-0.22, 0.7, 0.55]}>
          <meshStandardMaterial color="#1B1140" />
        </Sphere>
        <Sphere args={[0.13, 24, 24]} position={[0.22, 0.7, 0.55]}>
          <meshStandardMaterial color="#1B1140" />
        </Sphere>
        {/* Eye shines */}
        <Sphere args={[0.04, 16, 16]} position={[-0.18, 0.76, 0.66]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </Sphere>
        <Sphere args={[0.04, 16, 16]} position={[0.26, 0.76, 0.66]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </Sphere>
        {/* Eyelids (blink) */}
        <mesh ref={leftLid} position={[-0.22, 0.76, 0.6]}>
          <boxGeometry args={[0.3, 0.18, 0.02]} />
          <meshStandardMaterial color="#FFE9C7" />
        </mesh>
        <mesh ref={rightLid} position={[0.22, 0.76, 0.6]}>
          <boxGeometry args={[0.3, 0.18, 0.02]} />
          <meshStandardMaterial color="#FFE9C7" />
        </mesh>
        {/* Cheeks */}
        <Sphere args={[0.09, 16, 16]} position={[-0.42, 0.55, 0.5]}>
          <meshStandardMaterial color="#FF9FBF" transparent opacity={0.7} />
        </Sphere>
        <Sphere args={[0.09, 16, 16]} position={[0.42, 0.55, 0.5]}>
          <meshStandardMaterial color="#FF9FBF" transparent opacity={0.7} />
        </Sphere>
        {/* Smile */}
        <mesh position={[0, 0.45, 0.62]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.09, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#5A2A18" />
        </mesh>
        {/* Leaf on head */}
        <mesh position={[0.05, 1.35, 0]} rotation={[0, 0, 0.5]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#7BBF6A" roughness={0.7} />
        </mesh>
        <mesh position={[0.18, 1.5, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
          <meshStandardMaterial color="#5C8A4E" />
        </mesh>
      </group>
    </Float>
  );
};

const Scene3D = ({
  className = "",
  onTap,
}: {
  className?: string;
  onTap?: () => void;
}) => (
  <div className={`w-full h-full ${className}`}>
    <Canvas camera={{ position: [0, 0.4, 3.6], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#FFE6B8" />
      <pointLight position={[-3, 2, 2]} intensity={0.6} color="#C9A0FF" />
      <pointLight position={[3, -1, 2]} intensity={0.4} color="#FFB6E0" />
      <ForestSpirit onTap={() => onTap?.()} />
      <DreiSparkles
        count={40}
        scale={[4, 3, 2]}
        size={3}
        speed={0.3}
        color="#FFE39A"
      />
    </Canvas>
  </div>
);

export default Scene3D;
