import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const BouncyCharacter = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={1}>
      <group>
        {/* Body */}
        <Sphere ref={meshRef} args={[0.8, 32, 32]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#7c3aed"
            roughness={0.1}
            metalness={0.3}
            distort={0.2}
            speed={2}
          />
        </Sphere>
        {/* Head */}
        <Sphere args={[0.5, 32, 32]} position={[0, 1.1, 0]}>
          <MeshDistortMaterial
            color="#a78bfa"
            roughness={0.1}
            metalness={0.3}
            distort={0.15}
            speed={2}
          />
        </Sphere>
        {/* Left Eye */}
        <Sphere args={[0.1, 16, 16]} position={[-0.15, 1.2, 0.4]}>
          <meshStandardMaterial color="#1e1b4b" />
        </Sphere>
        {/* Right Eye */}
        <Sphere args={[0.1, 16, 16]} position={[0.15, 1.2, 0.4]}>
          <meshStandardMaterial color="#1e1b4b" />
        </Sphere>
        {/* Smile */}
        <Sphere args={[0.06, 16, 16]} position={[0, 1.0, 0.45]}>
          <meshStandardMaterial color="#f472b6" />
        </Sphere>
      </group>
    </Float>
  );
};

const FloatingStars = () => (
  <>
    {[...Array(8)].map((_, i) => (
      <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh position={[
          Math.sin(i * 0.8) * 3,
          Math.cos(i * 0.6) * 2,
          -1 - i * 0.3
        ]}>
          <octahedronGeometry args={[0.15]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    ))}
  </>
);

const Scene3D = ({ className = '' }: { className?: string }) => (
  <div className={`w-full h-full ${className}`}>
    <Canvas camera={{ position: [0, 0.5, 4], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-3, 3, 3]} intensity={0.5} color="#a78bfa" />
      <pointLight position={[3, -2, 2]} intensity={0.3} color="#f472b6" />
      <BouncyCharacter />
      <FloatingStars />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
    </Canvas>
  </div>
);

export default Scene3D;
