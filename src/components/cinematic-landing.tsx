"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";

const stages = [
  {
    key: "discover",
    label: "Discover",
    title: "Surface high-leverage repos before the obvious paths get crowded.",
    body: "ContribScout turns noisy GitHub discovery into a short list of fresh projects, useful signals, and practical starting points.",
    accent: "text-moss",
  },
  {
    key: "filter",
    label: "Filter",
    title: "Shape the scan around the contribution role you actually want.",
    body: "Role presets and signal filters narrow the field by score, issue labels, docs gaps, saturation, and source quality.",
    accent: "text-warm",
  },
  {
    key: "brief",
    label: "Build Brief",
    title: "Turn one opportunity into a contribution plan.",
    body: "Briefs collect context, issue links, fit signals, starter checks, and a safe first-PR approach in copy-ready Markdown.",
    accent: "text-moss",
  },
  {
    key: "pr-kit",
    label: "PR Kit",
    title: "Prepare the PR before you touch the repo.",
    body: "Duplicate guards, branch names, PR descriptions, validation notes, and maintainer updates help keep the first contribution clean.",
    accent: "text-warm",
  },
  {
    key: "proof",
    label: "Proof Vault",
    title: "Archive the work trail after the contribution lands.",
    body: "Proof Vault keeps submitted links, notes, statuses, and exports local to the browser for a clean contributor record.",
    accent: "text-moss",
  },
];

const productCards = [
  {
    title: "Opportunity",
    kicker: "Role Score 82",
    body: "Fresh repo, active issues, docs gap, low saturation.",
  },
  {
    title: "Watchlist",
    kicker: "Planned",
    body: "Save the repo, add notes, track status, return when ready.",
  },
  {
    title: "Contribution Brief",
    kicker: "Markdown plan",
    body: "README checks, issue links, setup notes, safe starter scope.",
  },
  {
    title: "PR Kit",
    kicker: "Submission ready",
    body: "Duplicate guard, branch name, PR description, validation list.",
  },
  {
    title: "Proof Vault",
    kicker: "Local evidence",
    body: "Proof link, status, notes, date, exportable report.",
  },
];

export function CinematicLanding() {
  const storyRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0);
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const bgX = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-8%", "12%"]);
  const bgY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "-18%"]);
  const warmX = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["18%", "-16%"]);
  const gridY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "10%"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextStage = Math.min(stages.length - 1, Math.floor(latest * stages.length));
    setActiveStage(nextStage);
  });

  const current = stages[activeStage];

  if (reduceMotion) {
    return (
      <section className="overflow-hidden">
        <LandingHero reduceMotion />
        <StaticStoryStack reduceMotion />
        <MissionControlHandoff />
      </section>
    );
  }

  return (
    <section className="overflow-hidden">
      <LandingHero />

      <section id="cinematic-story" ref={storyRef} className="relative md:min-h-[320vh]">
        <div className="sticky top-0 hidden min-h-screen items-center overflow-hidden rounded-md border-x border-cream/10 bg-[#050709] px-5 py-10 sm:px-8 md:flex lg:px-10">
          <motion.div
            aria-hidden="true"
            style={{ x: bgX, y: bgY }}
            className="absolute inset-[-18%] bg-[radial-gradient(48%_46%_at_72%_18%,rgba(157,191,154,0.28),transparent_65%),radial-gradient(42%_42%_at_24%_72%,rgba(243,234,215,0.08),transparent_68%)] blur-2xl"
          />
          <motion.div
            aria-hidden="true"
            style={{ x: warmX }}
            className="absolute inset-[-16%] bg-[radial-gradient(44%_50%_at_86%_76%,rgba(217,168,95,0.24),transparent_68%)] blur-2xl"
          />
          <motion.div
            aria-hidden="true"
            style={{ y: gridY }}
            className="absolute inset-0 bg-[linear-gradient(rgba(243,234,215,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(243,234,215,0.03)_1px,transparent_1px)] bg-[size:84px_84px] opacity-60"
          />

          <div className="relative grid w-full gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.32em] ${current.accent}`}>Stage {activeStage + 1} / {stages.length}</p>
              <motion.h2
                key={current.title}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 max-w-3xl text-4xl font-black leading-tight text-cream sm:text-6xl"
              >
                {current.title}
              </motion.h2>
              <motion.p
                key={current.body}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 max-w-xl text-lg leading-8 text-cream/64"
              >
                {current.body}
              </motion.p>
              <div className="mt-8 flex flex-wrap gap-2">
                {stages.map((stage, index) => (
                  <span
                    key={stage.key}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      index === activeStage
                        ? "border-warm/45 bg-warm/10 text-warm"
                        : "border-cream/10 bg-cream/[0.04] text-cream/50"
                    }`}
                  >
                    {stage.label}
                  </span>
                ))}
              </div>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-cream/10">
                <motion.div
                  style={{ scaleX: scrollYProgress }}
                  className="h-full origin-left rounded-full bg-warm"
                />
              </div>
            </div>

            <StoryCards progress={scrollYProgress} activeStage={activeStage} />
          </div>
        </div>
        <StaticStoryStack mobileOnly />
      </section>

      <MissionControlHandoff />
    </section>
  );
}

function LandingHero({ reduceMotion = false }: { reduceMotion?: boolean }) {
  return (
    <section className="relative grid min-h-screen items-center overflow-hidden rounded-md border border-cream/10 bg-[#050709] px-5 py-10 shadow-[0_44px_150px_rgba(0,0,0,0.48)] sm:px-8 lg:px-10">
      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: ["-4%", "3%", "-4%"], y: ["0%", "-3%", "0%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_78%_18%,rgba(157,191,154,0.24),transparent_62%),radial-gradient(55%_55%_at_15%_82%,rgba(217,168,95,0.18),transparent_68%)]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(243,234,215,0.10),transparent_34%,rgba(8,12,11,0.82))]" />

      <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-moss">ContribScout / Contribution intelligence</p>
          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.92] text-cream sm:text-7xl lg:text-8xl">
            Find the right open-source contribution before you open the PR.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-cream/72">
            ContribScout scans GitHub signals, scores contribution leverage, and turns repo discovery into a clean PR workflow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.a
              href="#cinematic-story"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className="premium-action rounded-md bg-warm px-5 py-3 text-center text-sm font-black text-ink shadow-[0_18px_60px_rgba(217,168,95,0.25)] transition hover:bg-cream"
            >
              Watch the workflow
            </motion.a>
            <motion.a
              href="#mission-control"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className="premium-action rounded-md border border-cream/10 bg-cream/[0.065] px-5 py-3 text-center text-sm font-semibold text-cream/85 transition hover:border-moss/50 hover:text-cream"
            >
              Enter Mission Control
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 34, rotate: -1 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="premium-panel rounded-md p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">Live operation</p>
                <h2 className="mt-3 text-2xl font-black text-cream">Contribution cockpit online</h2>
              </div>
              <div className="rounded-md border border-warm/30 bg-warm/10 px-3 py-2 text-center">
                <p className="text-xs text-warm">Score</p>
                <p className="text-3xl font-black text-cream">82</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Fresh repo signal", "Docs gap found", "PR kit ready", "Proof local"].map((item) => (
                <div key={item} className="rounded-md border border-cream/10 bg-black/20 p-3 text-sm font-semibold text-cream/78">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md border border-cream/10 bg-cream/[0.045] p-4">
              <p className="text-sm font-semibold text-cream">Suggested first move</p>
              <p className="mt-2 text-sm leading-6 text-cream/60">
                Test the quickstart, capture setup friction, and open a focused README clarity issue.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StoryCards({
  progress,
  activeStage,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  activeStage: number;
}) {
  return (
    <div className="relative min-h-[34rem] overflow-hidden lg:min-h-[40rem]">
      <div className="absolute inset-x-4 top-8 h-[30rem] rounded-md border border-cream/10 bg-cream/[0.035] shadow-[0_40px_150px_rgba(0,0,0,0.42)]" />
      {productCards.map((card, index) => (
        <StageProductCard
          key={card.title}
          card={card}
          index={index}
          progress={progress}
          active={activeStage === index}
        />
      ))}
    </div>
  );
}

function StageProductCard({
  card,
  index,
  progress,
  active,
}: {
  card: (typeof productCards)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  active: boolean;
}) {
  const start = index / stages.length;
  const end = (index + 1) / stages.length;
  const fadeIn = Math.max(0, start - 0.045);
  const holdStart = Math.min(1, start + 0.03);
  const holdEnd = Math.max(0, end - 0.03);
  const fadeOut = Math.min(1, end + 0.045);
  const direction = index % 2 === 0 ? -1 : 1;
  const opacity = useTransform(progress, [fadeIn, holdStart, holdEnd, fadeOut], [0, 1, 1, 0]);
  const x = useTransform(progress, [fadeIn, holdStart, holdEnd, fadeOut], [90 * direction, 0, 0, -90 * direction]);
  const y = useTransform(progress, [fadeIn, holdStart, holdEnd, fadeOut], [42, 0, 0, -38]);
  const scale = useTransform(progress, [fadeIn, holdStart, holdEnd, fadeOut], [0.9, 1, 1, 0.94]);

  return (
    <motion.article
      style={{ opacity, x, y, scale }}
      className={`pointer-events-none absolute left-4 right-4 top-1/2 -translate-y-1/2 rounded-md border border-cream/10 bg-[linear-gradient(180deg,rgba(243,234,215,0.12),rgba(8,12,11,0.92))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)] ${
        active ? "z-10 pointer-events-auto" : "z-0"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warm">{card.kicker}</p>
          <h3 className="mt-2 text-3xl font-black text-cream">{card.title}</h3>
        </div>
        <span className="rounded-md border border-moss/25 bg-moss/10 px-3 py-2 text-xs font-semibold text-moss">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-4 text-base leading-7 text-cream/64">{card.body}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {["Signal", "Action", "Proof"].map((item) => (
          <div key={`${card.title}-${item}`} className="rounded-md border border-cream/10 bg-black/20 p-3 text-sm font-semibold text-cream/64">
            {item}
          </div>
        ))}
      </div>
    </motion.article>
  );
}

function StaticStoryStack({
  reduceMotion = false,
  mobileOnly = false,
}: {
  reduceMotion?: boolean;
  mobileOnly?: boolean;
}) {
  return (
    <div className={`grid gap-4 px-1 py-8 ${mobileOnly ? "md:hidden" : ""}`}>
      {stages.map((stage, index) => (
        <motion.article
          key={`mobile-stage-${stage.key}`}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.24 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="premium-panel rounded-md p-5"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${stage.accent}`}>
            {String(index + 1).padStart(2, "0")} / {stage.label}
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-cream">{stage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-cream/64">{stage.body}</p>
          <div className="mt-5 rounded-md border border-cream/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warm">{productCards[index].kicker}</p>
            <p className="mt-2 text-lg font-black text-cream">{productCards[index].title}</p>
            <p className="mt-2 text-sm leading-6 text-cream/60">{productCards[index].body}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

function MissionControlHandoff() {
  return (
    <section id="mission-control" className="relative grid min-h-[46vh] place-items-center rounded-md border border-cream/10 bg-[linear-gradient(180deg,rgba(243,234,215,0.08),rgba(5,7,9,0.94))] px-5 py-14 text-center md:py-20">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-moss">Dashboard handoff</p>
        <h2 className="mt-5 text-4xl font-black text-cream sm:text-6xl">Enter Mission Control</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-cream/64">
          The story turns into the working cockpit: live scanner, filters, reports, watchlist, briefs, PR prep, and proof tracking.
        </p>
        <a
          href="#top-opportunities"
          className="premium-action mt-8 inline-flex rounded-md bg-warm px-5 py-3 text-sm font-black text-ink shadow-[0_18px_60px_rgba(217,168,95,0.22)] transition hover:bg-cream"
        >
          Open the live cockpit
        </a>
      </div>
    </section>
  );
}
