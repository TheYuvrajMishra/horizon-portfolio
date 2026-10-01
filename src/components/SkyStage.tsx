"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Component,
  type ReactNode,
  type PointerEvent as RPointerEvent,
  type KeyboardEvent as RKeyboardEvent,
} from "react";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "motion/react";
import {
  skyAt,
  sunDirection,
  dayFactor,
  sunAltitude,
  atmosphereName,
  formatTime,
} from "@/lib/skyPalette";

/* ---------------------------------- utils --------------------------------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number): number {
  return (
    vnoise(x, y) * 0.55 +
    vnoise(x * 2.1 + 5.2, y * 2.1 + 1.3) * 0.28 +
    vnoise(x * 4.3 + 9.1, y * 4.3 + 3.7) * 0.17
  );
}

function sstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function islandHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const mask = sstep(15, 8, r);
  if (mask <= 0) return -1.4;
  const hills = fbm(x * 0.09 + 3.1, z * 0.09 + 7.7) * 5.4;
  const peak = 7.6 * Math.exp(-(r * r) / 26);
  return mask * (hills * 0.55 + peak) - 0.25;
}

class StageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <Image
          src="/worlds/dawn-dunes.jpg"
          alt="Desert dunes at dawn — a Yuvraj Mishra environment"
          fill
          className="object-cover"
        />
      );
    }
    return this.props.children;
  }
}

/* -------------------------------- sky dome -------------------------------- */

const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DOME_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunI;
  uniform float uStars;
  uniform float uTime;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -1.0, 1.0);
    float t = pow(clamp(h, 0.0, 1.0), 0.55);
    vec3 col = mix(uHorizon, uTop, t);
    col = mix(col, uHorizon * 0.32, clamp(-h * 3.0, 0.0, 1.0));

    vec3 sunDir = normalize(uSunDir);
    float s = clamp(dot(d, sunDir), 0.0, 1.0);

    // warm the horizon near the sun's azimuth
    vec2 dxz = normalize(d.xz + vec2(1e-5));
    vec2 sxz = normalize(sunDir.xz + vec2(1e-5));
    float az = pow(clamp(dot(dxz, sxz), 0.0, 1.0), 3.0);
    col += uSunColor * az * (1.0 - t) * 0.38 * uSunI;

    // disc + glow
    float disc = smoothstep(0.99935, 0.99975, s);
    float glow = pow(s, 24.0) * 0.5 + pow(s, 350.0) * 0.85;
    col += uSunColor * (disc * 1.7 + glow) * uSunI;

    // stars
    if (uStars > 0.002 && h > 0.02) {
      vec3 cell = floor(d * 230.0);
      float star = step(0.9986, hash3(cell));
      float tw = 0.55 + 0.45 * sin(uTime * 2.1 + hash3(cell.zyx) * 6.2831);
      col += vec3(0.88, 0.93, 1.0) * star * tw * uStars * smoothstep(0.02, 0.3, h);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

function SkyDome({ uniformsRef }: { uniformsRef: React.MutableRefObject<DomeUniforms | null> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color("#46589e") },
      uHorizon: { value: new THREE.Color("#ffae54") },
      uSunDir: { value: new THREE.Vector3(0, 1, 0.4) },
      uSunColor: { value: new THREE.Color("#ffc46e") },
      uSunI: { value: 1.2 },
      uStars: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );
  useEffect(() => {
    uniformsRef.current = uniforms as DomeUniforms;
  }, [uniforms, uniformsRef]);
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[170, 32, 24]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={DOME_VERT}
        fragmentShader={DOME_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

interface DomeUniforms {
  uTop: { value: THREE.Color };
  uHorizon: { value: THREE.Color };
  uSunDir: { value: THREE.Vector3 };
  uSunColor: { value: THREE.Color };
  uSunI: { value: number };
  uStars: { value: number };
  uTime: { value: number };
}

/* --------------------------------- terrain -------------------------------- */

function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(38, 38, 104, 104);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cSand = new THREE.Color("#d9c49a");
    const cGrass = new THREE.Color("#7fa35a");
    const cGrassDeep = new THREE.Color("#5d8148");
    const cRock = new THREE.Color("#8a7f70");
    const cSnow = new THREE.Color("#f2efe6");
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = islandHeight(x, z);
      pos.setY(i, h);
      const slope = Math.abs(islandHeight(x + 0.5, z) - h) * 2;
      const n = fbm(x * 0.4, z * 0.4);
      if (h < 0.55) tmp.copy(cSand);
      else if (h < 2.4) tmp.copy(cGrass).lerp(cGrassDeep, n);
      else if (h < 4.6) tmp.copy(cRock).lerp(cGrassDeep, (1 - sstep(2.4, 4.6, h)) * 0.35);
      else tmp.copy(cSnow);
      if (slope > 0.55 && h > 1.2) tmp.lerp(cRock, 0.65);
      const jitter = 0.94 + n * 0.12;
      colors[i * 3] = tmp.r * jitter;
      colors[i * 3 + 1] = tmp.g * jitter;
      colors[i * 3 + 2] = tmp.b * jitter;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}

/* ------------------------------ scatter: trees ----------------------------- */

function Scatter() {
  const rand = useMemo(() => mulberry32(20261001), []);
  const trees = useMemo(() => {
    const pts: { x: number; z: number; s: number; r: number }[] = [];
    let guard = 0;
    while (pts.length < 44 && guard++ < 800) {
      const x = (rand() - 0.5) * 26;
      const z = (rand() - 0.5) * 26;
      const h = islandHeight(x, z);
      if (h > 0.7 && h < 3.4) {
        pts.push({ x, z, s: 0.7 + rand() * 0.8, r: rand() * Math.PI * 2 });
      }
    }
    return pts;
  }, [rand]);
  const rocks = useMemo(() => {
    const pts: { x: number; z: number; s: number; r: number; y: number }[] = [];
    let guard = 0;
    while (pts.length < 22 && guard++ < 600) {
      const x = (rand() - 0.5) * 28;
      const z = (rand() - 0.5) * 28;
      const h = islandHeight(x, z);
      if (h > -0.3 && h < 4.2) {
        pts.push({ x, z, s: 0.4 + rand() * 1.1, r: rand() * Math.PI * 2, y: h });
      }
    }
    return pts;
  }, [rand]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    trees.forEach((t, i) => {
      const y = islandHeight(t.x, t.z);
      dummy.position.set(t.x, y + 0.5 * t.s, t.z);
      dummy.scale.setScalar(t.s);
      dummy.rotation.set(0, t.r, 0);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x, y + (1.1 + 1.0) * t.s, t.z);
      dummy.updateMatrix();
      leafRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (trunkRef.current) trunkRef.current.instanceMatrix.needsUpdate = true;
    if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true;
    rocks.forEach((rk, i) => {
      dummy.position.set(rk.x, rk.y + 0.15 * rk.s, rk.z);
      dummy.scale.set(rk.s, rk.s * 0.7, rk.s);
      dummy.rotation.set(rk.r * 0.3, rk.r, 0.2);
      dummy.updateMatrix();
      rockRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (rockRef.current) rockRef.current.instanceMatrix.needsUpdate = true;
  }, [trees, rocks, dummy]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.1, 5]} />
        <meshStandardMaterial color="#5d4030" flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, trees.length]} castShadow>
        <coneGeometry args={[1.05, 2.4, 6]} />
        <meshStandardMaterial color="#4e7a44" flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} castShadow>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#8a8578" flatShading roughness={1} />
      </instancedMesh>
    </group>
  );
}

/* ---------------------------------- cabin --------------------------------- */

function Cabin({ windowRef }: { windowRef: React.MutableRefObject<THREE.MeshStandardMaterial | null> }) {
  const pos = useMemo(() => {
    const x = 4.6;
    const z = 3.4;
    return { x, z, y: islandHeight(x, z) };
  }, []);
  return (
    <group position={[pos.x, pos.y, pos.z]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.7, 1.2, 1.5]} />
        <meshStandardMaterial color="#6b4a33" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.45, 0.85, 4]} />
        <meshStandardMaterial color="#3a2e24" flatShading roughness={0.95} />
      </mesh>
      <mesh position={[0.45, 1.85, -0.3]}>
        <boxGeometry args={[0.22, 0.7, 0.22]} />
        <meshStandardMaterial color="#4a3a2c" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.62, 0.76]}>
        <planeGeometry args={[0.55, 0.42]} />
        <meshStandardMaterial
          ref={windowRef}
          color="#2b2118"
          emissive="#ffc46e"
          emissiveIntensity={0.05}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------- clouds --------------------------------- */

function makeCloudTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const rand = mulberry32(77);
  for (let i = 0; i < 16; i++) {
    const x = 40 + rand() * 176;
    const y = 45 + rand() * 40;
    const r = 22 + rand() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Clouds({ matRef }: { matRef: React.MutableRefObject<THREE.SpriteMaterial | null> }) {
  const tex = useMemo(() => (typeof document !== "undefined" ? makeCloudTexture() : null), []);
  const clouds = useMemo(() => {
    const rand = mulberry32(4242);
    return Array.from({ length: 9 }, (_, i) => ({
      x: (rand() - 0.5) * 90,
      y: 13 + rand() * 8,
      z: -18 - rand() * 22,
      sx: 13 + rand() * 12,
      sy: 5 + rand() * 3,
      speed: 0.35 + rand() * 0.5,
      key: i,
    }));
  }, []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      child.position.x += clouds[i].speed * dt;
      if (child.position.x > 58) child.position.x = -58;
    });
  });
  if (!tex) return null;
  return (
    <group ref={groupRef}>
      {clouds.map((c) => (
        <sprite key={c.key} position={[c.x, c.y, c.z]} scale={[c.sx, c.sy, 1]}>
          <spriteMaterial
            ref={c.key === 0 ? matRef : undefined}
            map={tex}
            transparent
            depthWrite={false}
            opacity={0.9}
          />
        </sprite>
      ))}
    </group>
  );
}

/* --------------------------------- fireflies ------------------------------- */

function Fireflies({ pointsRef }: { pointsRef: React.MutableRefObject<THREE.Points | null> }) {
  const { geo, base } = useMemo(() => {
    const rand = mulberry32(9001);
    const n = 70;
    const positions = new Float32Array(n * 3);
    const base: number[] = [];
    for (let i = 0; i < n; i++) {
      const x = (rand() - 0.5) * 26;
      const z = (rand() - 0.5) * 26;
      const y = Math.max(0.4, islandHeight(x, z)) + 0.5 + rand() * 1.6;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      base.push(y, rand() * Math.PI * 2, 0.4 + rand() * 0.8);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo, base };
  }, []);
  useFrame(({ clock }) => {
    const p = pointsRef.current;
    if (!p) return;
    const t = clock.elapsedTime;
    const attr = p.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 70; i++) {
      const [by, ph, sp] = [base[i * 3], base[i * 3 + 1], base[i * 3 + 2]];
      attr.setY(i, by + Math.sin(t * sp + ph) * 0.35);
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.32}
        color="#ffe28a"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ------------------------------- scene + rig ------------------------------- */

interface RigRefs {
  targetRef: React.MutableRefObject<number>;
  currentRef: React.MutableRefObject<number>;
  interactAtRef: React.MutableRefObject<number>;
  parallaxRef: React.MutableRefObject<{ x: number; y: number }>;
  visibleRef: React.MutableRefObject<boolean>;
  reduced: boolean;
  onHud: (h: { time: string; name: string; alt: number }) => void;
}

function Rig({ refs }: { refs: RigRefs }) {
  const { scene } = useThree();
  // Unpack the shared refs into `*Ref` locals so the compiler lint can see
  // these are ref objects (not frozen props) being mutated inside useFrame.
  const {
    targetRef,
    currentRef,
    interactAtRef,
    parallaxRef,
    visibleRef,
    reduced,
    onHud,
  } = refs;
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const waterRef = useRef<THREE.MeshStandardMaterial>(null);
  const cloudMatRef = useRef<THREE.SpriteMaterial | null>(null);
  const windowRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const fireflyRef = useRef<THREE.Points | null>(null);
  const domeRef = useRef<DomeUniforms | null>(null);
  const hudTimerRef = useRef(0);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (!visibleRef.current) return;

    if (!reduced && performance.now() - interactAtRef.current > 9000) {
      targetRef.current = (targetRef.current + (dt * 24) / 160) % 24;
    }
    const cur = currentRef.current;
    const tgt = targetRef.current;
    const delta = ((tgt - cur + 36) % 24) - 12;
    currentRef.current = cur + delta * (1 - Math.exp(-dt * 1.7));
    const t = currentRef.current;

    const s = skyAt(t);
    const dir = sunDirection(t);
    const df = dayFactor(t);

    const key = keyRef.current;
    if (key) {
      if (df > 0.02) {
        key.position.set(dir[0] * 70, Math.max(dir[1], 0.03) * 70, dir[2] * 70);
        key.color.set(s.sun);
        key.intensity = 0.4 + s.sunI * 1.25;
      } else {
        key.position.set(28, 44, -26);
        key.color.set("#a9c0ff");
        key.intensity = 0.55;
      }
    }
    const hemi = hemiRef.current;
    if (hemi) {
      hemi.color.set(s.hemiSky);
      hemi.groundColor.set(s.hemiGround);
      hemi.intensity = s.hemiI;
    }
    if (scene.fog) (scene.fog as THREE.Fog).color.set(s.fog);
    if (waterRef.current) {
      waterRef.current.color.set(s.water);
      waterRef.current.opacity = 0.9 + df * 0.06;
    }
    if (cloudMatRef.current) {
      cloudMatRef.current.color.set(s.cloud);
      cloudMatRef.current.opacity = 0.5 + df * 0.4;
    }
    if (windowRef.current) {
      windowRef.current.emissiveIntensity = (1 - df) * 2.6 + 0.04;
    }
    const d = domeRef.current;
    if (d) {
      d.uTop.value.set(s.top);
      d.uHorizon.value.set(s.horizon);
      d.uSunDir.value.set(dir[0], dir[1], dir[2]);
      d.uSunColor.value.set(s.sun);
      d.uSunI.value = 0.3 + df * 1.1;
      d.uStars.value = s.stars;
      d.uTime.value = state.clock.elapsedTime;
    }
    const fp = fireflyRef.current;
    if (fp) {
      (fp.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - df * 1.6) * 0.9;
    }

    // gentle camera parallax (disabled under reduced motion)
    const cam = state.camera;
    const px = reduced ? 0 : parallaxRef.current.x * 2.6;
    const py = reduced ? 0 : parallaxRef.current.y * 1.5;
    const k = 1 - Math.exp(-dt * 2.2);
    cam.position.x += (px - cam.position.x) * k;
    cam.position.y += (9.6 + py - cam.position.y) * k;
    cam.lookAt(0, 2.4, 0);

    hudTimerRef.current += dt;
    if (hudTimerRef.current > 0.15) {
      hudTimerRef.current = 0;
      onHud({
        time: formatTime(t),
        name: atmosphereName(t),
        alt: Math.round(sunAltitude(t)),
      });
    }
  });

  return (
    <>
      <SkyDome uniformsRef={domeRef} />
      <directionalLight
        ref={keyRef}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={180}
        shadow-bias={-0.0004}
      />
      <hemisphereLight ref={hemiRef} />
      <Terrain />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial
          ref={waterRef}
          color="#5c9ac8"
          roughness={0.14}
          metalness={0.08}
          transparent
          opacity={0.94}
        />
      </mesh>
      <Scatter />
      <Cabin windowRef={windowRef} />
      <Clouds matRef={cloudMatRef} />
      <Fireflies pointsRef={fireflyRef} />
    </>
  );
}

/* --------------------------------- time rail ------------------------------- */

function TimeRail({
  targetRef,
  interactAtRef,
  onFirstTouch,
}: {
  targetRef: React.MutableRefObject<number>;
  interactAtRef: React.MutableRefObject<number>;
  onFirstTouch: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [val, setVal] = useState(17.8);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    targetRef.current = f * 24;
    interactAtRef.current = performance.now();
    setVal(f * 24);
    onFirstTouch();
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) setFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };
  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 2 : 0.5;
    let v = val;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v = (v + step) % 24;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = (v - step + 24) % 24;
    else if (e.key === "Home") v = 6;
    else if (e.key === "End") v = 18;
    else return;
    e.preventDefault();
    targetRef.current = v;
    interactAtRef.current = performance.now();
    setVal(v);
    onFirstTouch();
  };

  return (
    <div className="pointer-events-auto w-full select-none">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Time of day"
        aria-valuemin={0}
        aria-valuemax={24}
        aria-valuenow={Math.round(val * 10) / 10}
        aria-valuetext={`${formatTime(val)}, ${atmosphereName(val)}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative h-11 cursor-ew-resize touch-none"
      >
        {/* track */}
        <div className="day-gradient absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 overflow-hidden rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] ring-1 ring-black/20" />
        {/* handle */}
        <div
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f6f3ec] shadow-[0_2px_10px_rgba(0,0,0,0.4)] ring-2 ring-[#17150f]/70"
          style={{ left: `${(val / 24) * 100}%` }}
        >
          <div className="absolute inset-[7px] rounded-full bg-[#2b4bd8]" />
        </div>
      </div>
      <div className="tnum mt-1 flex justify-between font-mono text-[10px] tracking-[0.14em] text-white/70">
        {["00", "06", "12", "18", "24"].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- the stage ------------------------------- */

export default function SkyStage() {
  const reduced = useReducedMotion() ?? false;
  const targetRef = useRef(17.8);
  const currentRef = useRef(17.8);
  const interactAtRef = useRef(0); // 0 = never → drift starts after 9s idle anyway
  const parallaxRef = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState({ time: "17:48", name: "Golden hour", alt: 12 });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onHud = useMemo(
    () => (h: { time: string; name: string; alt: number }) => setHud(h),
    []
  );

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    parallaxRef.current = {
      x: (e.clientX - r.left) / r.width - 0.5,
      y: -((e.clientY - r.top) / r.height - 0.5),
    };
  };

  const rigRefs: RigRefs = useMemo(
    () => ({
      targetRef,
      currentRef,
      interactAtRef,
      parallaxRef,
      visibleRef,
      reduced,
      onHud,
    }),
    [reduced, onHud]
  );

  return (
    <figure ref={wrapRef} className="w-full">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px] border border-ink/15 bg-[#0a1230] shadow-[0_30px_80px_-30px_rgba(23,21,15,0.35)] sm:aspect-[16/10]"
        onPointerMove={onPointerMove}
      >
        <StageErrorBoundary>
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 9.6, 27], fov: 38, near: 0.5, far: 400 }}
            shadows
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <Rig refs={rigRefs} />
          </Canvas>
        </StageErrorBoundary>

        {/* HUD — top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-white/60">
              LOCAL TIME
            </div>
            <div className="tnum font-mono text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-3xl">
              {hud.time}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.18em] text-white/60">
              ATMOSPHERE
            </div>
            <div className="font-display text-xl italic text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-2xl">
              {hud.name}
            </div>
            <div className="tnum font-mono text-[11px] text-white/70">
              sun {hud.alt >= 0 ? "+" : ""}
              {hud.alt}°
            </div>
          </div>
        </div>

        {/* hint */}
        <div
          className={`pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 transition-opacity duration-700 ${
            touched ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="rounded-full bg-black/35 px-4 py-2 font-mono text-[11px] tracking-[0.16em] text-white backdrop-blur-sm">
            DRAG THE RAIL TO CONDUCT TIME
          </div>
        </div>

        {/* rail — bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent p-4 pt-10 sm:p-5">
          <TimeRail
            targetRef={targetRef}
            interactAtRef={interactAtRef}
            onFirstTouch={() => setTouched(true)}
          />
        </div>
      </div>
      <figcaption className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-ink-soft">
        <span>FIG. 01 — A WORKING SKY</span>
        <span className="hidden sm:inline">REALTIME · WEBGL · ONE HONEST SUN</span>
      </figcaption>
    </figure>
  );
}
