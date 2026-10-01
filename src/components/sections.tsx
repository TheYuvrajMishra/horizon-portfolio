"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { Reveal, SectionHead, GenerateText } from "./chrome";

/* -------------------------------- manifesto -------------------------------- */

export function Manifesto() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-36">
      <div className="grid gap-10 md:grid-cols-[1fr_220px]">
        <GenerateText
          as="h2"
          text="I build worlds around their skies. Every environment starts as weather — the ground is just where the light lands."
          className="font-display text-4xl font-medium leading-[1.12] tracking-tight text-ink sm:text-6xl"
        />
        <Reveal delay={0.35} className="flex items-start md:justify-end">
          <p className="max-w-[220px] border-l-2 border-accent pl-4 font-mono text-[11px] leading-relaxed tracking-[0.08em] text-ink-soft">
            FIELD NOTE 001 — THE SKY IS NOT A BACKGROUND. IT IS THE BRIEF.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- worlds ---------------------------------- */

const WORLDS = [
  {
    img: "/worlds/dawn-dunes.jpg",
    title: "Dawn Dunes",
    note: "First light, Erg Admer",
    tags: "DESERT",
    year: "2026",
    alt: "Vast desert dunes at dawn with a huge low sun and pink cirrus clouds",
  },
  {
    img: "/worlds/storm-coast.jpg",
    title: "Storm Coast",
    note: "The weather turns",
    tags: "COASTLINE",
    year: "2026",
    alt: "Stormy coastline at dusk with thunderheads torn open by golden light",
  },
  {
    img: "/worlds/neon-harbor.jpg",
    title: "Neon Harbor",
    note: "Blue hour, district 9",
    tags: "SCI-FI CITY",
    year: "2025",
    alt: "Futuristic harbor city at blue hour with neon reflections on water",
  },
  {
    img: "/worlds/aurora-alps.jpg",
    title: "Aurora Alps",
    note: "A quieter night",
    tags: "ALPINE",
    year: "2025",
    alt: "Alpine valley under aurora borealis with a glassy lake reflection",
  },
  {
    img: "/worlds/monsoon-ghats.jpg",
    title: "Monsoon Ghats",
    note: "After the rain",
    tags: "HIGHLANDS",
    year: "2026",
    alt: "Lush terraced hills in monsoon with sunbreak through heavy clouds",
  },
];

export function Worlds() {
  const [active, setActive] = useState<number | null>(null);
  const [fine, setFine] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    // One-time mount read of the pointer media query (no render cascade: runs once).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFine(window.matchMedia("(pointer: fine)").matches && !reduced);
  }, [reduced]);

  const movePreview = (e: React.MouseEvent) => {
    const list = listRef.current;
    const prev = previewRef.current;
    if (!list || !prev || !fine) return;
    const r = list.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    prev.style.transform = `translate(${x + 28}px, ${y - 110}px)`;
  };

  return (
    <section id="worlds" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <SectionHead
        index="01"
        eyebrow="SELECTED WORLDS"
        title={
          <>
            Five skies, <span className="italic text-accent">five weathers.</span>
          </>
        }
        lede="Each world below was art-directed around a single sky. Hover to preview — every frame is rendered, graded, and lit by hand."
      />

      <div
        ref={listRef}
        className="relative mt-12"
        onMouseMove={movePreview}
        onMouseLeave={() => setActive(null)}
      >
        {/* floating preview (desktop, fine pointer) */}
        <div
          ref={previewRef}
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 z-20 w-[300px] transition-opacity duration-300 ${
            active !== null && fine ? "opacity-100" : "opacity-0"
          }`}
        >
          {WORLDS.map((w, i) => (
            <Image
              key={w.img}
              src={w.img}
              alt=""
              width={600}
              height={338}
              loading="lazy"
              className={`absolute left-0 top-0 aspect-video w-[300px] rounded-xl border border-ink/15 object-cover shadow-2xl transition-opacity duration-300 ${
                active === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        <div className="border-t border-ink/12">
          {WORLDS.map((w, i) => (
            <Reveal key={w.img} delay={Math.min(i * 0.06, 0.24)}>
              <a
                href="#contact"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-ink/12 py-6 transition-colors duration-300 hover:bg-paper-deep/60 sm:grid-cols-[64px_1fr_auto_auto_40px] sm:gap-8 sm:py-8"
              >
                <span className="tnum font-mono text-[11px] tracking-[0.2em] text-ink-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display text-3xl font-medium tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-2 sm:text-5xl">
                    {w.title}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] tracking-[0.18em] text-ink-soft">
                    {w.note.toUpperCase()}
                  </span>
                  {/* mobile thumbnail */}
                  <Image
                    src={w.img}
                    alt={w.alt}
                    width={800}
                    height={450}
                    loading="lazy"
                    className="mt-4 aspect-video w-full rounded-xl border border-ink/12 object-cover sm:hidden"
                  />
                </span>
                <span className="hidden font-mono text-[11px] tracking-[0.2em] text-ink-soft sm:block">
                  {w.tags}
                </span>
                <span className="tnum hidden font-mono text-[11px] tracking-[0.2em] text-ink-soft sm:block">
                  {w.year}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-paper">
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
      <p className="mt-6 font-mono text-[10px] tracking-[0.16em] text-ink-soft">
        FIG. 02–06 — RENDERED IN BLENDER · GRADED LIKE FILM
      </p>
    </section>
  );
}

/* --------------------------------- process --------------------------------- */

const STEPS = [
  {
    n: "01",
    title: "Sky studies",
    meta: "INPUT — 1,200+ REFERENCES",
    body: "Skies get watched, screenshotted, and noted in the margins. Every world starts as weather; the ground is just where the light lands.",
  },
  {
    n: "02",
    title: "Silhouette blockout",
    meta: "GREYBOX — BIG SHAPES FIRST",
    body: "Big shapes first, in flat grey. If a world reads as a 200-pixel thumbnail, it will read in motion.",
  },
  {
    n: "03",
    title: "One honest sun",
    meta: "LIGHTING — A SINGLE KEY",
    body: "A single key light, placed like it means it. No HDRI soup — shadows do the storytelling.",
  },
  {
    n: "04",
    title: "Color script",
    meta: "GRADE — DAWN TO DUSK",
    body: "The day gets graded like a film, dawn to dusk on one timeline, so the mood survives every camera angle.",
  },
];

export function Process() {
  return (
    <section id="process" className="scroll-mt-24 bg-paper-deep/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          index="02"
          eyebrow="THE ATMOSPHERE RECIPE"
          title={
            <>
              How a sky gets <span className="italic text-accent">built.</span>
            </>
          }
          lede="Four steps, same order every time. The recipe is boring on purpose — the weather is where the drama lives."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink/12 bg-ink/12 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="bg-paper p-8 sm:p-10">
              <Reveal delay={Math.min(i * 0.07, 0.21)}>
                <div className="flex items-baseline justify-between">
                  <span className="tnum font-display text-5xl font-medium text-ink/20">
                    {s.n}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-accent">
                    {s.meta}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-3xl italic tracking-tight text-ink">
                  {s.title}
                </h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{s.body}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- about ---------------------------------- */

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const f = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - f, 3);
      setVal(Math.round(target * e));
      if (f < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, reduced]);
  // Reduced motion: skip the tween entirely and render the final value.
  return reduced ? target : val;
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="border-t border-ink/12 pt-5">
      <div className="tnum font-display text-5xl font-medium tracking-tight text-ink sm:text-6xl">
        {n.toLocaleString("en-IN")}
        <span className="text-accent">{suffix}</span>
      </div>
      <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-ink-soft">
        {label}
      </div>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <SectionHead
        index="03"
        eyebrow="THE WEATHERMAN"
        title={
          <>
            Hi, I&apos;m <span className="italic text-accent">Yuvraj.</span>
          </>
        }
      />
      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <Reveal>
          <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink-soft">
            <p>
              <span className="font-medium text-ink">
                I&apos;m an environment artist from Kolkata
              </span>{" "}
              who fell into 3D through skies — the kind you screenshot at 6pm
              and spend all night trying to rebuild.
            </p>
            <p>
              I work in Blender, think in weather systems, and believe no
              landscape is finished until its sky could carry a film. Deserts
              at dawn, coasts in a storm, cities at blue hour — if it has an
              atmosphere, I want to build it.
            </p>
            <p className="font-mono text-[11px] tracking-[0.14em]">
              CURRENTLY — OPEN FOR FREELANCE WORLD-BUILDING
            </p>
          </div>
        </Reveal>
        <div className="grid content-start gap-8 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          <Stat value={32} suffix="+" label="ENVIRONMENTS SHIPPED" />
          <Stat value={1200} suffix="+" label="SKY STUDIES LOGGED" />
          <Stat value={47} suffix="" label="AVG. CLOUDS PER SCENE" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- footer --------------------------------- */

export function Footer() {
  const [copied, setCopied] = useState(false);
  const email = "yuvraj17mishra11@gmail.com";

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <footer id="contact" className="scroll-mt-24 border-t border-ink/12">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <div className="font-mono text-[11px] tracking-[0.24em] text-ink-soft">
            GOT A WORLD THAT NEEDS WEATHER?
          </div>
          <h2 className="mt-6 font-display text-[13vw] font-medium leading-[0.95] tracking-tight text-ink sm:text-[7.5rem]">
            Commission <span className="italic text-accent">a&nbsp;sky.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
            Freelance environment work — keyframes, stills, or full worlds.
            Tell me the mood; I&apos;ll bring the weather.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={copyEmail}
              className="group flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-mono text-xs tracking-[0.12em] text-paper transition-colors duration-300 hover:bg-accent"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "COPIED — TALK SOON" : email.toUpperCase()}
            </button>
            <a
              href="https://www.linkedin.com/in/the-yuvraj-mishra"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 rounded-full border border-ink/20 px-7 py-4 font-mono text-xs tracking-[0.12em] text-ink transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              LINKEDIN
              <ArrowUpRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </Reveal>
      </div>
      <div className="border-t border-ink/12">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 font-mono text-[10px] tracking-[0.18em] text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 YUVRAJ MISHRA</span>
          <span>KOLKATA, IN — WORKING WORLDWIDE</span>
          <span>BUILT WITH ONE HONEST SUN</span>
        </div>
      </div>
      {/* bottom breathing room for the fixed grain */}
      <div className="h-2" />
    </footer>
  );
}
