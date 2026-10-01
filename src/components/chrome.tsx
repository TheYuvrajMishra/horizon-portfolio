"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { Menu, X, ArrowUpRight } from "lucide-react";

/* ---------------------------------- grain --------------------------------- */

export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

/* -------------------------------- preloader -------------------------------- */

export function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 200 : 1500);
    return () => clearTimeout(t);
  }, [onDone, reduced]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="font-mono text-[10px] tracking-[0.3em] text-ink-soft">
        FIELD NOTES ON SKY
      </div>
      <div className="mt-3 font-display text-3xl italic text-ink sm:text-4xl">
        Developing the sky…
      </div>
      <div className="mt-8 h-px w-48 overflow-hidden bg-ink/15">
        <motion.div
          className="h-full bg-accent"
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: reduced ? 0.1 : 1.25, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

/* ----------------------------------- nav ----------------------------------- */

const LINKS = [
  { label: "Worlds", href: "#worlds" },
  { label: "Process", href: "#process" },
  { label: "About", href: "#about" },
];

export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 320 && !open);
    setScrolled(y > 24);
  });

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-4"
      >
        <nav
          aria-label="Primary"
          className={`flex w-full max-w-3xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-5 ${
            scrolled
              ? "border-ink/12 bg-paper/85 shadow-[0_10px_40px_-18px_rgba(23,21,15,0.35)] backdrop-blur-xl"
              : "border-transparent bg-transparent"
          }`}
        >
          <a href="#top" className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold tracking-tight">
              Yuvraj Mishra
            </span>
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-ink-soft sm:inline">
              FIELD NOTES
            </span>
          </a>
          <div className="hidden items-center gap-7 sm:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[11px] tracking-[0.18em] text-ink-soft transition-colors hover:text-ink"
              >
                {l.label.toUpperCase()}
              </a>
            ))}
            <a
              href="#contact"
              className="group flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-[11px] tracking-[0.14em] text-paper transition-colors hover:bg-accent"
            >
              COMMISSION A SKY
              <ArrowUpRight
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 sm:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-x-4 top-20 z-[69] rounded-3xl border border-ink/12 bg-paper/95 p-6 shadow-xl backdrop-blur-xl sm:hidden"
          >
            <div className="flex flex-col gap-5">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl italic text-ink"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3.5 font-mono text-xs tracking-[0.14em] text-paper"
              >
                COMMISSION A SKY <ArrowUpRight size={14} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* --------------------------------- reveal ---------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------- section head ------------------------------ */

export function SectionHead({
  index,
  eyebrow,
  title,
  lede,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lede?: string;
}) {
  return (
    <Reveal>
      <div className="flex items-center gap-4">
        <span className="tnum font-mono text-[11px] tracking-[0.2em] text-accent">
          {index}
        </span>
        <span className="h-px flex-1 bg-ink/12" />
        <span className="font-mono text-[11px] tracking-[0.24em] text-ink-soft">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-6 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
        {title}
      </h2>
      {lede && (
        <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
          {lede}
        </p>
      )}
    </Reveal>
  );
}

/* --------------------------------- marquee --------------------------------- */

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-ink/12 py-4" aria-hidden="true">
      <div className="animate-marquee flex w-max items-center gap-8">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-8">
            {row.map((item, i) => (
              <span
                key={`${half}-${i}`}
                className="flex items-center gap-8 whitespace-nowrap font-mono text-[11px] tracking-[0.3em] text-ink-soft"
              >
                {item}
                <span className="text-accent">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ generate effect ---------------------------- */

export function GenerateText({
  text,
  className,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "h1" | "h2" | "span";
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  if (reduced) {
    const RTag = Tag as "p";
    return <RTag className={className}>{text}</RTag>;
  }
  const MotionTag = motion[Tag] as typeof motion.p;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055 } } }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, filter: "blur(8px)" },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}
