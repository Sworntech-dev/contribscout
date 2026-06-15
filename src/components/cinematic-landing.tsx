"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stages = [
  {
    key: "discover",
    label: "Discover",
    title: "Surface the repo before the obvious path gets crowded.",
    body: "Live GitHub signals become a short list of fresh projects, clear contribution openings, and practical next moves.",
    cardTitle: "GitHub signal card",
    cardMeta: "Live scanner",
    cardBody: "Fresh push activity, useful topics, open issues, docs signals, and low saturation cues.",
    accent: "text-moss",
    glow: "rgba(157,191,154,0.30)",
  },
  {
    key: "filter",
    label: "Filter",
    title: "Narrow the field by the role you can actually play.",
    body: "Presets and smart filters shape opportunities around first PRs, docs gaps, issue labels, score, and competition.",
    cardTitle: "Filter card",
    cardMeta: "Role presets",
    cardBody: "Docs Fix, First PR, Low Competition, Needs CONTRIBUTING, and high-score paths.",
    accent: "text-warm",
    glow: "rgba(217,168,95,0.28)",
  },
  {
    key: "brief",
    label: "Build Brief",
    title: "Turn one repo into a small contribution plan.",
    body: "Contribution Briefs collect fit signals, issue links, setup checks, and a safe first-PR approach in Markdown.",
    cardTitle: "Brief card",
    cardMeta: "Markdown plan",
    cardBody: "Read README, check CONTRIBUTING, verify open issues, run setup, and keep scope tight.",
    accent: "text-moss",
    glow: "rgba(157,191,154,0.24)",
  },
  {
    key: "pr-kit",
    label: "PR Kit",
    title: "Prepare the submission before you touch the code.",
    body: "PR Kit builds duplicate guards, branch names, PR descriptions, validation notes, and maintainer updates.",
    cardTitle: "PR kit card",
    cardMeta: "Submission ready",
    cardBody: "Search similar PRs, reference issues safely, avoid unrelated files, and validate expected changes.",
    accent: "text-warm",
    glow: "rgba(217,168,95,0.24)",
  },
  {
    key: "proof",
    label: "Proof Vault",
    title: "Keep the contribution trail after the work ships.",
    body: "Proof Vault records submitted links, statuses, notes, and exportable reports locally in the browser.",
    cardTitle: "Proof vault card",
    cardMeta: "Local evidence",
    cardBody: "Save proof links, notes, dates, and status summaries without accounts or backend storage.",
    accent: "text-moss",
    glow: "rgba(157,191,154,0.30)",
  },
];

const productSignals = ["Live GitHub Scanner", "Hermes Skill Layer", "PR Workflow Kit", "Local Proof Vault"];
const workflowSteps = ["Discover", "Filter", "Build Brief", "PR Kit", "Proof Vault"];

export function CinematicLanding() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const storyRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const warmGlowRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const stageTextRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ghostRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReduceMotion(mediaQuery.matches);
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);

    return () => {
      mediaQuery.removeEventListener("change", updateReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    if (!desktopQuery.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const stageTexts = stageTextRefs.current.filter(Boolean) as HTMLDivElement[];
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      const ghosts = ghostRefs.current.filter(Boolean) as HTMLDivElement[];

      gsap.set(stageTexts, { autoAlpha: 0, y: 28 });
      gsap.set(stageTexts[0], { autoAlpha: 1, y: 0 });
      gsap.set(cards, { autoAlpha: 0, x: 220, y: 80, scale: 0.74, rotateY: -24, rotateZ: 5, pointerEvents: "none" });
      gsap.set(cards[0], { autoAlpha: 1, x: 0, y: 0, scale: 1, rotateY: 0, pointerEvents: "auto" });
      gsap.set(ghosts, { autoAlpha: 0.11, scale: 0.82 });
      gsap.set(progressFillRef.current, { scaleX: 0.2, transformOrigin: "left center" });

      const segment = 1 / stages.length;
      const transitionDuration = 0.07;

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: storyRef.current,
          start: "top top",
          end: "+=140%",
          scrub: true,
          pin: pinRef.current,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setActiveStage(Math.min(stages.length - 1, Math.floor(self.progress * stages.length)));
          },
        },
      });

      stages.forEach((stage, index) => {
        const position = index * segment;
        const previousIndex = index - 1;

        if (index > 0) {
          timeline
            .to(stageTexts[previousIndex], { autoAlpha: 0, y: -34, duration: transitionDuration }, position)
            .fromTo(stageTexts[index], { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: transitionDuration }, position)
            .to(cards[previousIndex], { autoAlpha: 0, x: -220, y: -82, scale: 0.72, rotateY: 24, rotateZ: -5, pointerEvents: "none", duration: transitionDuration }, position)
            .fromTo(
              cards[index],
              { autoAlpha: 0, x: 220, y: 84, scale: 0.72, rotateY: -24, rotateZ: 5, pointerEvents: "none" },
              { autoAlpha: 1, x: 0, y: 0, scale: 1, rotateY: 0, rotateZ: 0, pointerEvents: "auto", duration: transitionDuration },
              position,
            );
        }

        timeline
          .to(glowRef.current, { xPercent: -22 + index * 11, yPercent: index % 2 === 0 ? -9 : 12, backgroundColor: stage.glow, opacity: 0.95, duration: transitionDuration }, position)
          .to(warmGlowRef.current, { xPercent: 24 - index * 11, yPercent: index % 2 === 0 ? 14 : -10, opacity: index % 2 === 0 ? 0.45 : 0.78, duration: transitionDuration }, position)
          .to(progressFillRef.current, { scaleX: (index + 1) / stages.length, duration: transitionDuration }, position)
          .to(ghosts, { autoAlpha: 0.06, scale: 0.78, duration: transitionDuration }, position)
          .to(ghosts[index], { autoAlpha: 0.28, scale: 1, duration: transitionDuration }, position);
      });

      timeline.to(progressFillRef.current, { scaleX: 1, duration: 0.001 }, 1);

      ScrollTrigger.refresh();
    }, storyRef);

    return () => {
      ctx.revert();
    };
  }, [reduceMotion]);

  return (
    <section className="relative overflow-hidden">
      <Hero reduceMotion={reduceMotion} />

      <div id="cinematic-story">
        {reduceMotion ? (
          <StaticStageStack />
        ) : (
          <>
            <DesktopScrollStory
              activeStage={activeStage}
              storyRef={storyRef}
              pinRef={pinRef}
              glowRef={glowRef}
              warmGlowRef={warmGlowRef}
              progressFillRef={progressFillRef}
              stageTextRefs={stageTextRefs}
              cardRefs={cardRefs}
              ghostRefs={ghostRefs}
            />
            <StaticStageStack mobileOnly />
          </>
        )}
      </div>

      <MissionControlHandoff />
    </section>
  );
}

function Hero({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <section className="relative grid min-h-[86vh] items-center overflow-hidden rounded-md border border-cream/10 bg-[#050806] px-5 py-10 shadow-[0_44px_150px_rgba(0,0,0,0.48)] sm:px-8 lg:min-h-[92vh] lg:px-10">
      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: ["-2%", "3%", "-2%"], y: ["0%", "-2%", "0%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[-18%] bg-[radial-gradient(62%_56%_at_76%_18%,rgba(157,191,154,0.24),transparent_64%),radial-gradient(48%_44%_at_18%_78%,rgba(217,168,95,0.16),transparent_68%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(rgba(243,234,215,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(243,234,215,0.035)_1px,transparent_1px)] bg-[size:88px_88px] opacity-55"
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(243,234,215,0.10),transparent_34%,rgba(8,12,11,0.86))]" />

      <div className="relative grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap gap-2">
            {productSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-cream/10 bg-cream/[0.06] px-3 py-1.5 text-xs font-semibold text-cream/72"
              >
                {signal}
              </span>
            ))}
          </div>
          <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.92] text-cream sm:text-7xl lg:text-8xl">
            Find the right open-source contribution before you open the PR.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-cream/72">
            ContribScout scans GitHub signals, scores contribution leverage, and turns repo discovery into a clean,
            local-first PR workflow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.a
              href="#cinematic-story"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className="premium-action rounded-md bg-warm px-5 py-3 text-center text-sm font-black text-ink shadow-[0_18px_60px_rgba(217,168,95,0.25)] transition hover:bg-cream"
            >
              Watch the flow
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

        <HeroObject reduceMotion={reduceMotion} />
      </div>
    </section>
  );
}

function DesktopScrollStory({
  activeStage,
  storyRef,
  pinRef,
  glowRef,
  warmGlowRef,
  progressFillRef,
  stageTextRefs,
  cardRefs,
  ghostRefs,
}: {
  activeStage: number;
  storyRef: React.MutableRefObject<HTMLElement | null>;
  pinRef: React.MutableRefObject<HTMLDivElement | null>;
  glowRef: React.MutableRefObject<HTMLDivElement | null>;
  warmGlowRef: React.MutableRefObject<HTMLDivElement | null>;
  progressFillRef: React.MutableRefObject<HTMLDivElement | null>;
  stageTextRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  cardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  ghostRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
}) {
  return (
    <section ref={storyRef} className="relative hidden md:block">
      <div
        ref={pinRef}
        className="relative grid h-screen items-center overflow-hidden rounded-md border-y border-cream/10 bg-[#050806] px-6 py-10 lg:px-10"
      >
        <div
          ref={glowRef}
          aria-hidden="true"
          className="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-moss/30 blur-3xl"
        />
        <div
          ref={warmGlowRef}
          aria-hidden="true"
          className="absolute bottom-[8%] right-[8%] h-80 w-80 rounded-full bg-warm/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(rgba(243,234,215,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(243,234,215,0.03)_1px,transparent_1px)] bg-[size:82px_82px] opacity-50"
        />

        <div className="relative grid w-full gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div className="relative min-h-[30rem]">
            {stages.map((stage, index) => (
              <div
                key={stage.key}
                ref={(node) => {
                  stageTextRefs.current[index] = node;
                }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2"
              >
                <p className={`text-sm font-semibold uppercase tracking-[0.32em] ${stage.accent}`}>
                  Stage {index + 1} / {stages.length} - {stage.label}
                </p>
                <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.96] text-cream xl:text-6xl">
                  {stage.title}
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-cream/64">{stage.body}</p>
              </div>
            ))}

            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex flex-wrap gap-2">
                {workflowSteps.map((step, index) => (
                  <span
                    key={step}
                    className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                      index === activeStage
                        ? "border-warm/50 bg-warm/12 text-warm shadow-[0_0_28px_rgba(217,168,95,0.18)]"
                        : "border-cream/10 bg-cream/[0.04] text-cream/42"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-cream/10">
                <div ref={progressFillRef} className="h-full origin-left rounded-full bg-warm" />
              </div>
            </div>
          </div>

          <ProductStageObject cardRefs={cardRefs} ghostRefs={ghostRefs} activeStage={activeStage} />
        </div>
      </div>
    </section>
  );
}

function ProductStageObject({
  cardRefs,
  ghostRefs,
  activeStage,
}: {
  cardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  ghostRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  activeStage: number;
}) {
  return (
    <div className="relative mx-auto min-h-[42rem] w-full max-w-4xl [perspective:1500px]">
      <div className="absolute inset-8 rounded-[2rem] border border-cream/10 bg-cream/[0.035] shadow-[0_52px_150px_rgba(0,0,0,0.48)]" />

      {stages.map((stage, index) => (
        <div
          key={`ghost-${stage.key}`}
          ref={(node) => {
            ghostRefs.current[index] = node;
          }}
          className={`absolute rounded-md border border-cream/10 bg-cream/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.25)] ${
            index % 2 === 0 ? "left-8 top-10 h-28 w-48" : "bottom-10 right-8 h-24 w-44"
          }`}
        >
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/36">{stage.label}</p>
            <div className="mt-3 h-2 w-2/3 rounded-full bg-cream/12" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-cream/10" />
          </div>
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 h-[31rem] w-[min(94%,38rem)] -translate-x-1/2 -translate-y-1/2">
        {stages.map((stage, index) => (
          <div
            key={`stage-card-${stage.key}`}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className="absolute inset-0 rounded-md border border-cream/12 bg-[linear-gradient(180deg,rgba(243,234,215,0.14),rgba(8,12,11,0.94))] p-5 shadow-[0_48px_130px_rgba(0,0,0,0.48)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${stage.accent}`}>{stage.cardMeta}</p>
                <h3 className="mt-3 text-4xl font-black text-cream">{stage.cardTitle}</h3>
              </div>
              <div className="rounded-md border border-warm/30 bg-warm/10 px-3 py-2 text-center">
                <p className="text-xs text-warm">Step</p>
                <p className="text-2xl font-black text-cream">{String(index + 1).padStart(2, "0")}</p>
              </div>
            </div>
            <p className="mt-5 text-base leading-7 text-cream/64">{stage.cardBody}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {["Signal", "Action", "Proof"].map((item) => (
                <div
                  key={`${stage.key}-${item}`}
                  className={`rounded-md border p-4 ${
                    index === activeStage
                      ? "border-moss/25 bg-moss/10"
                      : "border-cream/10 bg-black/20"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">{item}</p>
                  <div className="mt-3 h-2 rounded-full bg-cream/14" />
                  <div className="mt-2 h-2 w-2/3 rounded-full bg-cream/10" />
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-md border border-cream/10 bg-black/24 p-4">
              <p className="text-sm font-semibold text-cream">Current focus</p>
              <p className="mt-2 text-sm leading-6 text-cream/58">
                {stage.label} keeps the workflow compact so the dashboard can take over immediately after the story.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroObject({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 34, rotate: -1 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl"
    >
      <div aria-hidden="true" className="absolute inset-8 rounded-[2rem] bg-moss/18 blur-3xl" />
      <div className="relative rounded-md border border-cream/12 bg-[linear-gradient(180deg,rgba(243,234,215,0.13),rgba(8,12,11,0.92))] p-4 shadow-[0_48px_140px_rgba(0,0,0,0.5)]">
        <div className="rounded-md border border-cream/10 bg-black/24 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">Role Opportunity Score</p>
              <h2 className="mt-3 text-3xl font-black text-cream">Open-source cockpit</h2>
            </div>
            <div className="rounded-md border border-warm/30 bg-warm/10 px-3 py-2 text-center">
              <p className="text-xs text-warm">Score</p>
              <p className="text-3xl font-black text-cream">82</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-cream/62">
            Fresh repo signal, docs gap, active issues, low saturation, and a clean first action.
          </p>
        </div>

        <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Scan", "12 repos"],
            ["Brief", "Markdown"],
            ["PR Kit", "Ready"],
          ].map(([label, value], index) => (
            <motion.div
              key={label}
              animate={reduceMotion ? undefined : { y: [0, index % 2 === 0 ? -5 : 5, 0] }}
              transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-md border border-cream/10 bg-cream/[0.055] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">{label}</p>
              <p className="mt-2 text-lg font-black text-cream">{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-md border border-cream/10 bg-cream/[0.045] p-4">
          <p className="text-sm font-semibold text-cream">Suggested first move</p>
          <p className="mt-2 text-sm leading-6 text-cream/60">
            Test the quickstart, capture setup friction, and open a focused README clarity issue.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StaticStageStack({ mobileOnly = false }: { mobileOnly?: boolean }) {
  return (
    <section className={`grid gap-4 px-1 py-8 ${mobileOnly ? "md:hidden" : ""}`}>
      {stages.map((stage, index) => (
        <article key={`static-stage-${stage.key}`} className="premium-panel rounded-md p-5">
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${stage.accent}`}>
            {String(index + 1).padStart(2, "0")} / {stage.label}
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-cream">{stage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-cream/64">{stage.body}</p>
          <div className="mt-5 rounded-md border border-cream/10 bg-black/20 p-4">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${stage.accent}`}>{stage.cardMeta}</p>
            <p className="mt-2 text-lg font-black text-cream">{stage.cardTitle}</p>
            <p className="mt-2 text-sm leading-6 text-cream/60">{stage.cardBody}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function MissionControlHandoff() {
  return (
    <section
      id="mission-control"
      className="relative mx-auto mb-0 grid max-w-5xl place-items-center rounded-md border border-cream/10 bg-[linear-gradient(180deg,rgba(243,234,215,0.075),rgba(5,7,9,0.88))] px-5 py-6 text-center shadow-[0_22px_80px_rgba(0,0,0,0.24)]"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-moss">Dashboard handoff</p>
        <h2 className="mt-4 text-4xl font-black text-cream sm:text-6xl">Enter Mission Control</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-cream/64">
          The scroll story hands off directly to the working cockpit: scanner, filters, reports, watchlist, briefs, PR
          prep, and proof tracking.
        </p>
      </div>
    </section>
  );
}
