"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Preloader, Nav, Grain, Marquee } from "@/components/chrome";
import { Manifesto, Worlds, Process, About, Footer } from "@/components/sections";

const SkyStage = dynamic(() => import("@/components/SkyStage"), {
  ssr: false,
  loading: () => (
    <figure className="w-full">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[22px] border border-ink/15 bg-paper-deep sm:aspect-[16/10]">
        <span className="font-mono text-[11px] tracking-[0.24em] text-ink-soft">
          LOADING THE SKY…
        </span>
      </div>
    </figure>
  ),
});

function Hero({ started }: { started: boolean }) {
  const reduced = useReducedMotion();
  const anim = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 32, filter: "blur(6px)" },
          animate: started
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 32, filter: "blur(6px)" },
          transition: { duration: 1, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section id="top" className="mx-auto max-w-6xl px-5 pt-32 sm:px-8 sm:pt-40">
      <motion.div {...anim(0)}>
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.24em] text-ink-soft">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          ENVIRONMENT ARTIST — FIELD NOTES ON SKY
        </div>
      </motion.div>

      <motion.h1
        {...anim(0.12)}
        className="mt-6 max-w-4xl font-display text-[13.5vw] font-medium leading-[0.98] tracking-tight text-ink sm:text-8xl"
      >
        I build <span className="italic text-accent">skies</span> you can stand
        under.
      </motion.h1>

      <motion.p
        {...anim(0.24)}
        className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft"
      >
        Yuvraj Mishra crafts 3D environments for film, games, and daydreams —
        every one art-directed around its atmosphere. Below is a working sky.
        Drag the rail and conduct the weather yourself.
      </motion.p>

      <motion.div {...anim(0.36)} className="mt-10">
        <SkyStage />
      </motion.div>

      <motion.div {...anim(0.48)} className="mt-8 flex justify-center">
        <a
          href="#worlds"
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-ink-soft transition-colors hover:text-ink"
          aria-label="Scroll to selected worlds"
        >
          SCROLL FOR THE WORLDS
          <motion.span
            animate={reduced ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={13} />
          </motion.span>
        </a>
      </motion.div>
    </section>
  );
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Grain />
      <AnimatePresence>
        {!loaded && <Preloader onDone={() => setLoaded(true)} />}
      </AnimatePresence>
      <Nav />
      <main>
        <Hero started={loaded} />
        <div className="mt-20 sm:mt-28">
          <Marquee
            items={[
              "ENVIRONMENTS",
              "SKIES",
              "ATMOSPHERE",
              "LIGHT",
              "WEATHER",
              "WORLDBUILDING",
            ]}
          />
        </div>
        <Manifesto />
        <Worlds />
        <Process />
        <About />
      </main>
      <Footer />
    </>
  );
}
