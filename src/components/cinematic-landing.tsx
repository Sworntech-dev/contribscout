"use client";

import { motion, useReducedMotion } from "framer-motion";

const workflowSteps = ["Discover", "Filter", "Save", "Brief", "PR Kit", "Proof Vault"];
const productSignals = ["Live GitHub Scanner", "Hermes Skill Layer", "Local Proof Vault"];

export function CinematicLanding() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div className="relative grid min-h-screen items-center overflow-hidden rounded-md border border-cream/10 bg-[#050806] px-5 py-12 shadow-[0_44px_150px_rgba(0,0,0,0.48)] sm:px-8 lg:px-10">
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
                href="#mission-control"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                className="premium-action rounded-md bg-warm px-5 py-3 text-center text-sm font-black text-ink shadow-[0_18px_60px_rgba(217,168,95,0.25)] transition hover:bg-cream"
              >
                Enter Mission Control
              </motion.a>
              <motion.a
                href="#top-opportunities"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                className="premium-action rounded-md border border-cream/10 bg-cream/[0.065] px-5 py-3 text-center text-sm font-semibold text-cream/85 transition hover:border-moss/50 hover:text-cream"
              >
                View live opportunities
              </motion.a>
            </div>
          </motion.div>

          <ProductObject reduceMotion={Boolean(reduceMotion)} />
        </div>
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md border border-cream/10 bg-cream/[0.045] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.26)]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {workflowSteps.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2 text-sm font-semibold text-cream/64">
                <span className="rounded-full border border-moss/25 bg-moss/10 px-3 py-1.5 text-moss">{step}</span>
                {index < workflowSteps.length - 1 ? <span className="hidden text-cream/24 sm:inline">/</span> : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section
        id="mission-control"
        className="relative mx-auto mb-2 grid max-w-5xl place-items-center rounded-md border border-cream/10 bg-[linear-gradient(180deg,rgba(243,234,215,0.075),rgba(5,7,9,0.88))] px-5 py-12 text-center shadow-[0_26px_100px_rgba(0,0,0,0.28)]"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-moss">Dashboard handoff</p>
          <h2 className="mt-4 text-4xl font-black text-cream sm:text-6xl">Enter Mission Control</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-cream/64">
            The landing shell hands off directly to the working cockpit: scanner, filters, reports, watchlist, briefs,
            PR prep, and proof tracking.
          </p>
        </div>
      </section>
    </section>
  );
}

function ProductObject({ reduceMotion }: { reduceMotion: boolean }) {
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
