"use client";

import { motion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";

function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setHasMounted(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return hasMounted;
}

function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    const frameId = window.requestAnimationFrame(updatePreference);
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      window.cancelAnimationFrame(frameId);
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return reduceMotion;
}

export function MotionBackdrop() {
  return <StaticBackdrop />;
}

function StaticBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-28 top-12 h-[34rem] w-[46rem] rotate-[-12deg] bg-[linear-gradient(120deg,rgba(157,191,154,0.16),transparent_62%)] opacity-[0.32] blur-3xl" />
      <div className="absolute -right-32 top-[30rem] h-[38rem] w-[48rem] rotate-[16deg] bg-[linear-gradient(130deg,rgba(217,168,95,0.12),transparent_64%)] opacity-80 blur-3xl" />
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatedReveal id={id} className={className} delay={delay}>
      {children}
    </AnimatedReveal>
  );
}

function AnimatedReveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const reduceMotion = useReducedMotionPreference();

  if (reduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return <div className={className}>{children}</div>;
  }

  return <AnimatedStaggerGroup className={className}>{children}</AnimatedStaggerGroup>;
}

function AnimatedStaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotionPreference();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -80px 0px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return <div className={className}>{children}</div>;
  }

  return <AnimatedStaggerItem className={className}>{children}</AnimatedStaggerItem>;
}

function AnimatedStaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotionPreference();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FloatingPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export const Motion = motion;
