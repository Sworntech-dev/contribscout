"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function MotionBackdrop() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const slowY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -180]);
  const fastY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 240]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.45, 1], reduceMotion ? [0.36, 0.36, 0.36] : [0.38, 0.22, 0.32]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ y: slowY, opacity: glowOpacity }}
        className="absolute -left-32 top-16 h-[42rem] w-[58rem] rotate-[-12deg] bg-[linear-gradient(120deg,rgba(157,191,154,0.2),transparent_62%)] blur-3xl"
      />
      <motion.div
        style={{ y: fastY }}
        className="absolute -right-40 top-[34rem] h-[48rem] w-[62rem] rotate-[16deg] bg-[linear-gradient(130deg,rgba(217,168,95,0.16),transparent_64%)] blur-3xl"
      />
      <motion.div
        style={{ y: slowY }}
        className="absolute left-[22%] top-[82rem] h-[44rem] w-[70rem] rotate-[8deg] bg-[linear-gradient(90deg,transparent,rgba(243,234,215,0.08),transparent)] blur-3xl"
      />
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "show"}
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

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 22 },
              show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function FloatingPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.35], reduceMotion ? [0, 0] : [0, -34]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export const Motion = motion;
