/**
 * The sky engine: a 24-hour keyframed atmosphere.
 * Every visual in the hero stage — dome shader, lights, fog, water,
 * clouds, HUD — is derived from `skyAt(t)`. Smooth by construction:
 * all values lerp between hand-tuned keyframes.
 */

export interface SkyState {
  top: string;
  horizon: string;
  sun: string;
  fog: string;
  hemiSky: string;
  hemiGround: string;
  cloud: string;
  water: string;
  sunI: number; // key light intensity
  hemiI: number; // ambient intensity
  stars: number; // 0..1 starfield opacity
}

type Stop = [number, SkyState];

const STOPS: Stop[] = [
  [
    0,
    {
      top: "#050a1e", horizon: "#0c1838", sun: "#a9c0ff", fog: "#0a1230",
      hemiSky: "#22346b", hemiGround: "#04060d", cloud: "#141f45", water: "#0a1330",
      sunI: 0, hemiI: 0.45, stars: 1,
    },
  ],
  [
    4.5,
    {
      top: "#0a1230", horizon: "#1b2a55", sun: "#a9c0ff", fog: "#101b40",
      hemiSky: "#2a3d75", hemiGround: "#05070e", cloud: "#1a2650", water: "#0d1738",
      sunI: 0, hemiI: 0.5, stars: 0.85,
    },
  ],
  [
    6,
    {
      top: "#2e5da8", horizon: "#e8975a", sun: "#ffce8a", fog: "#c99a6e",
      hemiSky: "#8fa8d8", hemiGround: "#23242c", cloud: "#e8b48c", water: "#5e7fa0",
      sunI: 0.9, hemiI: 0.65, stars: 0.25,
    },
  ],
  [
    7.5,
    {
      top: "#3e8ad9", horizon: "#cfe4f2", sun: "#fff1d0", fog: "#c3d6e8",
      hemiSky: "#b9d2ee", hemiGround: "#33392e", cloud: "#fdfdfd", water: "#6fa3c6",
      sunI: 2.0, hemiI: 0.9, stars: 0,
    },
  ],
  [
    12,
    {
      top: "#2b7cd9", horizon: "#bee2f5", sun: "#ffffff", fog: "#bdd8ea",
      hemiSky: "#c2daf2", hemiGround: "#3b4433", cloud: "#ffffff", water: "#5c9ac8",
      sunI: 2.6, hemiI: 1.0, stars: 0,
    },
  ],
  [
    16,
    {
      top: "#3585d4", horizon: "#cbdfec", sun: "#fff8e6", fog: "#c2d4e2",
      hemiSky: "#bcd4ec", hemiGround: "#3a4132", cloud: "#fdfbf6", water: "#649cc4",
      sunI: 2.3, hemiI: 0.95, stars: 0,
    },
  ],
  [
    17.8,
    {
      top: "#46589e", horizon: "#ffae54", sun: "#ffc46e", fog: "#dda068",
      hemiSky: "#b99f8e", hemiGround: "#33291f", cloud: "#f7c496", water: "#b98a5e",
      sunI: 1.5, hemiI: 0.7, stars: 0,
    },
  ],
  [
    19,
    {
      top: "#2c3768", horizon: "#f2703f", sun: "#ff9a52", fog: "#a86248",
      hemiSky: "#84749e", hemiGround: "#201b20", cloud: "#d98f6e", water: "#6e5468",
      sunI: 0.8, hemiI: 0.55, stars: 0.08,
    },
  ],
  [
    20.3,
    {
      top: "#18224e", horizon: "#46549a", sun: "#aebdff", fog: "#2a3468",
      hemiSky: "#46549a", hemiGround: "#12141d", cloud: "#39477f", water: "#202c58",
      sunI: 0.25, hemiI: 0.5, stars: 0.55,
    },
  ],
  [
    21.8,
    {
      top: "#070d22", horizon: "#101c40", sun: "#a9c0ff", fog: "#0c1434",
      hemiSky: "#26386e", hemiGround: "#04060d", cloud: "#16224a", water: "#0b1432",
      sunI: 0, hemiI: 0.45, stars: 1,
    },
  ],
  [
    24,
    {
      top: "#050a1e", horizon: "#0c1838", sun: "#a9c0ff", fog: "#0a1230",
      hemiSky: "#22346b", hemiGround: "#04060d", cloud: "#141f45", water: "#0a1332",
      sunI: 0, hemiI: 0.45, stars: 1,
    },
  ],
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpHex(a: string, b: string, f: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const bl = Math.round(b1 + (b2 - b1) * f);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export function skyAt(t: number): SkyState {
  const tt = ((t % 24) + 24) % 24;
  let i = 0;
  while (i < STOPS.length - 2 && STOPS[i + 1][0] <= tt) i++;
  const [t0, s0] = STOPS[i];
  const [t1, s1] = STOPS[i + 1];
  const f = Math.min(1, Math.max(0, (tt - t0) / (t1 - t0)));
  const c = (k: keyof SkyState) =>
    typeof s0[k] === "string"
      ? lerpHex(s0[k] as string, s1[k] as string, f)
      : lerp(s0[k] as number, s1[k] as number, f);
  return {
    top: c("top") as string,
    horizon: c("horizon") as string,
    sun: c("sun") as string,
    fog: c("fog") as string,
    hemiSky: c("hemiSky") as string,
    hemiGround: c("hemiGround") as string,
    cloud: c("cloud") as string,
    water: c("water") as string,
    sunI: c("sunI") as number,
    hemiI: c("hemiI") as number,
    stars: c("stars") as number,
  };
}

/** Normalized sun direction. y < 0 means below the horizon (night). */
export function sunDirection(t: number): [number, number, number] {
  const theta = (Math.PI * (t - 6)) / 12; // 0 at 06:00, π at 18:00
  const x = -Math.cos(theta) * 0.9;
  const y = Math.sin(theta);
  const z = 0.42;
  const len = Math.hypot(x, y, z);
  return [x / len, y / len, z / len];
}

/** Sun altitude in degrees, for the HUD. Negative at night. */
export function sunAltitude(t: number): number {
  const [, y] = sunDirection(t);
  return (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
}

/** 0 at deep night → 1 at full day. */
export function dayFactor(t: number): number {
  const [, y] = sunDirection(t);
  const f = (y + 0.06) / 0.2;
  return Math.min(1, Math.max(0, f));
}

export function atmosphereName(t: number): string {
  const tt = ((t % 24) + 24) % 24;
  if (tt < 4.5 || tt >= 21.5) return "Night";
  if (tt < 6.2) return "Blue hour";
  if (tt < 8) return "Sunrise";
  if (tt < 11.5) return "Morning";
  if (tt < 14.5) return "Midday";
  if (tt < 17) return "Afternoon";
  if (tt < 18.7) return "Golden hour";
  if (tt < 20) return "Sunset";
  return "Dusk";
}

export function formatTime(t: number): string {
  const tt = ((t % 24) + 24) % 24;
  const h = Math.floor(tt);
  const m = Math.floor((tt - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
