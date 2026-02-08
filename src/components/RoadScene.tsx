import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoadSceneProps {
    intensity: number;
}

// Animated Grid Floor with faint white lines moving TOWARD camera
function GridFloor({ intensity }: { intensity: number }) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const shaderData = useMemo(() => ({
        uniforms: {
            uTime: { value: 0 },
        },
        vertexShader: `
      varying vec2 vUv;
      varying float vZ;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vZ = worldPos.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vZ;
      
      void main() {
        vec2 uv = vUv;
        // Increase numbers to make grid smaller (100.0 and 40.0)
        uv.y = fract(uv.y * 100.0 + uTime);
        uv.x = fract(uv.x * 40.0);
        
        float lineX = smoothstep(0.015, 0.0, abs(uv.x - 0.5));
        float lineY = smoothstep(0.015, 0.0, abs(uv.y - 0.5));
        float grid = max(lineX, lineY);
        
        // Fade out with distance
        float fade = 1.0 - smoothstep(0.0, 0.6, vUv.y);
        
        // Faint white color
        vec3 color = vec3(1.0, 1.0, 1.0) * grid * fade * 0.5;
        gl_FragColor = vec4(color, grid * fade * 0.5    );
      }
    `,
    }), []);

    useFrame((_, delta) => {
        if (materialRef.current) {
            // Base speed matches bar speed (15 units/sec)
            // Scale with intensity: 1.0x at intensity 1, up to 1.5x at intensity 10
            const speedMultiplier = 1.0 + (intensity / 10) * 0.5;
            const gridSpeed = 15 * speedMultiplier;
            materialRef.current.uniforms.uTime.value += delta * gridSpeed;
        }
    });

    // Position Ground at y=0
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
            <planeGeometry args={[80, 80, 1, 1]} />
            <shaderMaterial
                ref={materialRef}
                attach="material"
                args={[shaderData]}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// Single moving bar that travels toward the camera and rises from ground
interface MovingBarProps {
    initialZ: number;
    side: 'left' | 'right';
    intensity: number;
    speed: number;
}

function MovingBar({ initialZ, side, intensity, speed }: MovingBarProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const zRef = useRef(initialZ);
    // Random phase offset so bars don't all bounce in sync
    const phaseOffset = useRef(Math.random() * Math.PI * 2);
    const timeRef = useRef(0);

    // Constants
    const roadWidth = 5; // Reduced from 8 to 5 to center bars more
    const startZ = -50; // Spawn far away
    const endZ = 10;    // Pass camera

    // Color based on intensity
    const getColor = (level: number): THREE.Color => {
        if (level <= 3) return new THREE.Color('#22d3ee'); // Cyan
        if (level <= 7) return new THREE.Color('#f59e0b'); // Amber
        return new THREE.Color('#ef4444'); // Red
    };

    const getEmissiveIntensity = (level: number): number => {
        return 0.8 + (level / 10) * 2;
    };

    useFrame((_, delta) => {
        if (meshRef.current) {
            // Update time for bounce animation
            timeRef.current += delta;

            // Move toward camera
            zRef.current += delta * speed;

            // Reset when past camera
            if (zRef.current > endZ) {
                zRef.current = startZ;
            }

            meshRef.current.position.z = zRef.current;

            // Base height from intensity
            const baseHeight = 1.5 + intensity * 0.8;

            // Bouncing animation - INCREASED for visibility
            // Higher intensity = more bounce amplitude and faster frequency
            const bounceAmplitude = 0.3 + (intensity / 10) * 0.8; // 0.3 to 1.1
            const bounceFrequency = 4 + (intensity / 10) * 4; // 4Hz to 8Hz
            const bounce = Math.sin(timeRef.current * bounceFrequency + phaseOffset.current) * bounceAmplitude;

            // "Rise from the ground" animation for spawn
            const appearDistance = 30; // Distance over which they grow
            const growthProgress = THREE.MathUtils.clamp(
                (zRef.current - startZ) / appearDistance,
                0,
                1
            );

            // Apply scale
            // Use easeOutQuad for nice pop-up effect
            const scale = growthProgress * (2 - growthProgress);

            // Combine base height with bounce effect
            const finalHeight = (baseHeight + bounce) * scale;

            meshRef.current.scale.y = Math.max(0.01, finalHeight);
            // Keep bottom anchored to ground (y=0)
            meshRef.current.position.y = finalHeight / 2;
        }
    });

    const color = getColor(intensity);
    const xPos = side === 'left' ? -roadWidth : roadWidth;

    return (
        <mesh ref={meshRef} position={[xPos, 0, initialZ]}>
            {/* Cylinder for softer, rounded appearance */}
            <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={getEmissiveIntensity(intensity)}
                toneMapped={false}
            />
        </mesh>
    );
}

// Collection of moving bars on both sides
interface MovingBarsProps {
    intensity: number;
}

function MovingBars({ intensity }: MovingBarsProps) {
    // Create bar pairs at different initial positions
    const barConfigs = useMemo(() => {
        const configs: { initialZ: number; side: 'left' | 'right' }[] = [];
        const spacing = 8;
        const numBars = 12;

        for (let i = 0; i < numBars; i++) {
            const z = -50 + i * spacing;
            configs.push({ initialZ: z, side: 'left' });
            configs.push({ initialZ: z, side: 'right' });
        }
        return configs;
    }, []);

    // Base speed 15 units/sec, scales with intensity: 1.0x to 1.5x
    const speedMultiplier = 1.0 + (intensity / 10) * 0.5;
    const speed = 15 * speedMultiplier;

    return (
        <>
            {barConfigs.map((config, i) => (
                <MovingBar
                    key={i}
                    initialZ={config.initialZ}
                    side={config.side}
                    intensity={intensity}
                    speed={speed}
                />
            ))}
        </>
    );
}

// Recovery zone particle field - gentle floating particles at low intensity
function RecoveryParticles({ intensity }: { intensity: number }) {
    const pointsRef = useRef<THREE.Points>(null);
    const particleCount = 150;

    // Create circular texture for particles
    const particleTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;

        // Draw a circle
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        return new THREE.CanvasTexture(canvas);
    }, []);

    // Create particle geometry with positions
    const particleGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Spread particles around the scene
            positions[i3] = (Math.random() - 0.5) * 40;     // x: -20 to 20
            positions[i3 + 1] = Math.random() * 15;          // y: 0 to 15
            positions[i3 + 2] = (Math.random() - 0.5) * 60; // z: -30 to 30
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geometry;
    }, []);

    // Particle velocities for gentle drift
    const velocities = useMemo(() => {
        const vels = [];
        for (let i = 0; i < particleCount; i++) {
            vels.push({
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.2,
            });
        }
        return vels;
    }, []);

    useFrame((_, delta) => {
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

            // Gentle floating animation
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;

                // Apply velocity
                positions[i3] += velocities[i].x * delta * 2;
                positions[i3 + 1] += velocities[i].y * delta * 2;
                positions[i3 + 2] += velocities[i].z * delta * 2;

                // Wrap around boundaries
                if (positions[i3] > 20) positions[i3] = -20;
                if (positions[i3] < -20) positions[i3] = 20;
                if (positions[i3 + 1] > 15) positions[i3 + 1] = 0;
                if (positions[i3 + 1] < 0) positions[i3 + 1] = 15;
                if (positions[i3 + 2] > 30) positions[i3 + 2] = -30;
                if (positions[i3 + 2] < -30) positions[i3 + 2] = 30;
            }

            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    // Only show particles at low intensity (1-3)
    // Fade out as intensity increases
    const opacity = intensity <= 3
        ? THREE.MathUtils.mapLinear(intensity, 1, 3, 0.6, 0)
        : 0;

    if (opacity <= 0) return null;

    return (
        <points ref={pointsRef} geometry={particleGeometry}>
            <pointsMaterial
                size={0.2}
                color="#4dd0e1"
                map={particleTexture}
                transparent
                opacity={opacity}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

// Main Scene component
function Scene({ intensity }: { intensity: number }) {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 10, 0]} intensity={0.5} />
            <pointLight position={[0, 2, 5]} intensity={0.5} color="#ffffff" />

            {/* Fog matches background */}
            <fog attach="fog" args={['#050510', 10, 50]} />

            {/* Grid floor */}
            <GridFloor intensity={intensity} />

            {/* Recovery particles - only visible at low intensity */}
            <RecoveryParticles intensity={intensity} />

            {/* Moving intensity bars */}
            <MovingBars intensity={intensity} />
        </>
    );
}

// Exported component with Canvas
export const RoadScene: React.FC<RoadSceneProps> = ({ intensity }) => {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                // Rotation X: 0.05 radians (~3 degrees) looks UP slightly, 
                // which pushes the horizon/vanishing point DOWN to the center.
                camera={{
                    position: [0, 3, 10],
                    rotation: [0.05, 0, 0],
                    fov: 75,
                    near: 0.1,
                    far: 100
                }}
                style={{ background: '#050510' }}
            >
                <Scene intensity={intensity} />
            </Canvas>

            {/* Intensity number overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span
                    className="text-white font-bold text-9xl drop-shadow-lg"
                    style={{
                        textShadow: intensity <= 3
                            ? '0 0 40px rgba(34, 211, 238, 0.8)'
                            : intensity <= 7
                                ? '0 0 40px rgba(245, 158, 11, 0.8)'
                                : '0 0 40px rgba(239, 68, 68, 0.8)'
                    }}
                >
                    {intensity > 0 ? intensity : ''}
                </span>
            </div>
        </div>
    );
};

export default RoadScene;
