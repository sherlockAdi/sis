// src/components/ui/StatsGrid.tsx
// Drop-in replacement for the 6-stat grid in sis-global/page.tsx
// Usage: <StatsGrid />
"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Users, Globe, Building2, Award, Star } from "lucide-react";

// ── config ────────────────────────────────────────────────────────────────

interface StatItem {
  icon:    React.ReactNode;
  value:   string;          // raw display string
  numeric: number | null;   // null = non-numeric (e.g. "NSE·BSE")
  suffix:  string;          // e.g. "+", ",000+" etc.
  label:   string;
  bg:      string;
  border:  string;
}

const STATS: StatItem[] = [
  {
    icon:    <Shield size={22} />,
    value:   "5,000+",
    numeric: 5000,
    suffix:  "+",
    label:   "Enterprise Clients",
    bg:      "rgba(200,16,46,0.06)",
    border:  "rgba(200,16,46,0.15)",
  },
  {
    icon:    <Users size={22} />,
    value:   "2,50,000+",
    numeric: 250000,
    suffix:  "+",
    label:   "Employees",
    bg:      "#F5F5F5",
    border:  "#E5E5E5",
  },
  {
    icon:    <Globe size={22} />,
    value:   "22+",
    numeric: 22,
    suffix:  "+",
    label:   "Indian States",
    bg:      "#F5F5F5",
    border:  "#E5E5E5",
  },
  {
    icon:    <Building2 size={22} />,
    value:   "10+",
    numeric: 10,
    suffix:  "+",
    label:   "Business Verticals",
    bg:      "rgba(200,16,46,0.06)",
    border:  "rgba(200,16,46,0.15)",
  },
  {
    icon:    <Award size={22} />,
    value:   "31+",
    numeric: 31,
    suffix:  "+",
    label:   "Years of Excellence",
    bg:      "rgba(200,16,46,0.06)",
    border:  "rgba(200,16,46,0.15)",
  },
  {
    icon:    <Star size={22} />,
    value:   "NSE·BSE",
    numeric: null,
    suffix:  "",
    label:   "Listed Entity",
    bg:      "#F5F5F5",
    border:  "#E5E5E5",
  },
];

// ── Counter hook ──────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1800, started = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started || target === 0) return;

    let startTime: number | null = null;
    let raf: number;

    // ease-out cubic
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOut(progress) * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);

  return count;
}

// ── Single stat card ──────────────────────────────────────────────────────

function StatCard({ item, started, index }: { item: StatItem; started: boolean; index: number }) {
  // stagger each card's counter start slightly
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setDelayed(true), index * 120);
    return () => clearTimeout(t);
  }, [started, index]);

  const count = useCounter(item.numeric ?? 0, 1800, delayed);

  // Format the counted number with commas matching the original style
  const formatCount = (n: number): string => {
    if (item.numeric! >= 100000) {
      // Indian numbering: 2,50,000
      return n.toLocaleString("en-IN");
    }
    return n.toLocaleString("en-US");
  };

  const displayValue =
    item.numeric === null
      ? item.value                          // "NSE·BSE" — static
      : `${formatCount(count)}${item.suffix}`;

  return (
    <div
      className="rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform duration-300"
      style={{ background: item.bg, border: `1px solid ${item.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-brand-red"
        style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        {item.icon}
      </div>

      <div
        className="text-2xl font-bold text-brand-grey-900 mb-1 tabular-nums"
        style={{ fontFamily: "var(--font-display)", minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {displayValue}
      </div>

      <div className="text-xs text-brand-grey-500 font-medium">{item.label}</div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export default function StatsGrid() {
  const ref     = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4">
      {STATS.map((item, i) => (
        <StatCard key={item.label} item={item} started={started} index={i} />
      ))}
    </div>
  );
}