"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
  useMotionValue,
} from "framer-motion";

import { recruitmentSteps } from "@/data";

/* ─── spring config ───────────────────────────────────────────────────────── */
const SPRING = { stiffness: 120, damping: 20, mass: 0.8 };
const SOFT = { stiffness: 60, damping: 18, mass: 1 };

export default function RecruitmentSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);

  /* raw motion values */
  const rawProgress = useMotionValue(0);
  const rawStepPct = useMotionValue(0);

  /* spring-smoothed */
  const springProgress = useSpring(rawProgress, SOFT);

  const barWidth = useTransform(
    springProgress,
    [0, 100],
    ["0%", "100%"]
  );

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const el = sectionRef.current;

      if (!el) return;

      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;

      const scrolled = Math.max(0, -rect.top);

      const pct = Math.min(1, scrolled / total);

      const raw = pct * recruitmentSteps.length;

      const idx = Math.min(
        recruitmentSteps.length - 1,
        Math.floor(raw)
      );

      const sub = raw - Math.floor(raw);

      rawProgress.set(pct * 100);
      rawStepPct.set(sub);

      setActiveStep((prev) => {
        if (idx !== prev) {
          setDirection(idx > prev ? 1 : -1);
        }

        return idx;
      });
    });
  }, [rawProgress, rawStepPct]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);

      cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll]);

  const step = recruitmentSteps[activeStep];

  /* IMPORTANT */
  const StepIcon = step.icon;

  /* connector fills */
  const connectorFills = recruitmentSteps.map((_, i) => {
    if (i < activeStep) return 1;

    if (i === activeStep) return rawStepPct.get();

    return 0;
  });

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{
        height: `${recruitmentSteps.length * 100}vh`,
      }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden flex flex-col"
        style={{
          background:
            "linear-gradient(160deg,#fafafa 0%,#f2f2f2 100%)",
        }}
      >
        {/* TOP PROGRESS */}
        <div
          className="w-full h-1 flex-shrink-0"
          style={{ background: "#E5E5E5" }}
        >
          <motion.div
            className="h-full origin-left"
            style={{
              width: barWidth,
              background:
                "linear-gradient(90deg,#C8102E 0%,#E8193E 60%,#ff4d6d 100%)",
              boxShadow:
                "0 0 12px rgba(200,16,46,0.5)",
            }}
          />
        </div>

        {/* HEADER */}
        <motion.div
          className="text-center pt-10 pb-4 px-4 flex-shrink-0"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <p className="text-brand-red text-xs font-bold tracking-[0.2em] uppercase mb-1">
            How We Work
          </p>

          <h2
            className="text-4xl md:text-5xl font-bold text-brand-grey-900"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            OUR RECRUITMENT PROCESS
          </h2>

          <div className="section-divider mt-6" />
        </motion.div>

        {/* MAIN */}
        <div className="flex-1 flex items-center max-w-6xl mx-auto w-full px-4 gap-10 md:gap-16 pb-4">
          {/* LEFT STEPPER */}
          <div className="hidden md:flex flex-col w-60 text-lg flex-shrink-0">
            {recruitmentSteps.map((s, i) => {
              const done = i < activeStep;

              const current = i === activeStep;

              const fill =
                i < activeStep
                  ? 1
                  : i === activeStep
                  ? connectorFills[i]
                  : 0;

              return (
                <div
                  key={s.id}
                  className="flex items-stretch gap-3"
                >
                  {/* DOT */}
                  <div className="flex flex-col items-center w-9 flex-shrink-0">
                    <motion.div
                      animate={{
                        scale: current ? 1.22 : 1,
                        backgroundColor:
                          current || done
                            ? "#C8102E"
                            : "#E0E0E0",
                      }}
                      transition={SPRING}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{
                        color:
                          current || done
                            ? "white"
                            : "#A3A3A3",
                      }}
                    >
                      {done ? "✓" : s.id}
                    </motion.div>

                    {i < recruitmentSteps.length - 1 && (
                      <div
                        className="w-0.5 rounded-full overflow-hidden my-1"
                        style={{
                          background: "#E0E0E0",
                          flex: 1,
                          minHeight: 28,
                        }}
                      >
                        <ConnectorFill fill={fill} />
                      </div>
                    )}
                  </div>

                  {/* LABEL */}
                  <div className="pt-1.5 pb-5 flex-1 min-w-0">
                    <motion.p
                      animate={{
                        color: current
                          ? "#C8102E"
                          : done
                          ? "#525252"
                          : "#B0B0B0",
                      }}
                      transition={{ duration: 0.3 }}
                      className="font-bold text-sm"
                    >
                      {s.title}
                    </motion.p>

                    <motion.div
                      animate={{
                        height: current ? "auto" : 0,
                        opacity: current ? 1 : 0,
                      }}
                      transition={{ duration: 0.4 }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="text-xs text-brand-grey-400 leading-relaxed mt-2">
                        {/* {s.description} */}
                      </p>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT CARD */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{
                  opacity: 0,
                  y: direction * 60,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: direction * -60,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="relative bg-white rounded-2xl overflow-hidden shadow-xl"
                style={{
                  borderTop: "4px solid #C8102E",
                }}
              >
                {/* HEADER */}
                <div className="px-8 pt-8 pb-6 border-b border-brand-grey-100">
                  <div className="flex items-start gap-5 mb-5">
                    {/* BADGE */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg,#C8102E 0%,#900B20 100%)",
                      }}
                    >
                      {step.id}
                    </div>

                    {/* TITLE */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-1">
                        Step {step.id} of{" "}
                        {recruitmentSteps.length}
                      </p>

                      <h3 className="text-2xl md:text-3xl font-bold text-brand-grey-900 leading-tight">
                        {step.title}
                      </h3>
                    </div>

                    {/* ICON */}
                    <motion.span
                      initial={{
                        scale: 0,
                        rotate: 20,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        rotate: 0,
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.2,
                        duration: 0.5,
                      }}
                      className="flex-shrink-0"
                    >
                      <StepIcon
                        size={30}
                        className="text-brand-red"
                      />
                    </motion.span>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-brand-grey-500 leading-relaxed md:mx-20 text-lg">
                    {step.description}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 flex items-center justify-between">
                  {/* DOTS */}
                  <div className="flex items-center gap-2">
                    {recruitmentSteps.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          width:
                            i === activeStep ? 24 : 7,
                          background:
                            i <= activeStep
                              ? "#C8102E"
                              : "#E0E0E0",
                        }}
                        transition={SPRING}
                        className="h-2 rounded-full"
                      />
                    ))}
                  </div>

                  {/* COUNTER */}
                  <motion.p className="text-xs text-brand-grey-400 font-medium tabular-nums">
                    <ProgressCounter
                      progress={rawProgress}
                      total={recruitmentSteps.length}
                    />
                  </motion.p>
                </div>

                {/* BOTTOM BAR */}
                <div
                  className="h-1 w-full"
                  style={{ background: "#F5F5F5" }}
                >
                  <motion.div
                    className="h-full"
                    animate={{
                      width: `${
                        ((activeStep + 1) /
                          recruitmentSteps.length) *
                        100
                      }%`,
                    }}
                    transition={SOFT}
                    style={{
                      background:
                        "linear-gradient(90deg,#C8102E,#E8193E)",
                    }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* MOBILE PILLS */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-4 pb-5 flex-shrink-0">
          {recruitmentSteps.map((s, i) => {
            const MobileIcon = s.icon;

            return (
              <motion.div
                key={s.id}
                animate={{
                  background:
                    i === activeStep
                      ? "#C8102E"
                      : i < activeStep
                      ? "white"
                      : "#F0F0F0",

                  color:
                    i === activeStep
                      ? "white"
                      : i < activeStep
                      ? "#C8102E"
                      : "#A3A3A3",
                }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  border:
                    i < activeStep
                      ? "1.5px solid #C8102E"
                      : "1.5px solid transparent",
                }}
              >
                <MobileIcon size={14} />
                {s.title}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* CONNECTOR */
function ConnectorFill({
  fill,
}: {
  fill: number;
}) {
  const mv = useMotionValue(fill);

  const spring = useSpring(mv, {
    stiffness: 80,
    damping: 20,
  });

  const height = useTransform(
    spring,
    [0, 1],
    ["0%", "100%"]
  );

  useEffect(() => {
    mv.set(fill);
  }, [fill, mv]);

  return (
    <motion.div
      className="w-full rounded-full"
      style={{
        height,
        background:
          "linear-gradient(180deg,#C8102E,#E8193E)",
      }}
    />
  );
}

/* COUNTER */
function ProgressCounter({
  progress,
  total,
}: {
  progress: ReturnType<typeof useMotionValue<number>>;
  total: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = progress.on("change", (v) =>
      setDisplay(Math.round(v))
    );

    return unsub;
  }, [progress]);

  const step = Math.min(
    total,
    Math.ceil((display / 100) * total)
  );

  return (
    <>
      {display}% — Step {step}/{total}
    </>
  );
}