"use client";

import { useEffect, useRef, useState } from "react";
import { whyCards } from "@/data";

export default function WhySISSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cardEls = sectionRef.current?.querySelectorAll(".shuffle-card");
    if (!cardEls) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              (entry.target as HTMLElement).dataset.idx || "0"
            );

            // Stagger each card reveal
            setTimeout(() => {
              setVisibleCards(
                (prev) => new Set(Array.from(prev).concat(idx))
              );
            }, idx * 120);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cardEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">
            Our Advantages
          </p>

          <h2
            className="text-4xl font-bold text-brand-grey-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Why SIS Global Workforce?
          </h2>

          <div className="section-divider mt-4" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyCards.map((card, i) => {
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                data-idx={i}
                className={`shuffle-card bg-white border border-brand-grey-200 rounded-xl p-7 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                  visibleCards.has(i) ? "visible" : ""
                }`}
                style={{
                  animationDelay: `${i * 0.12}s`,
                }}
              >
                {/* Icon Circle */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-grey-100 to-brand-grey-200 flex items-center justify-center mb-5 shadow-sm">
                  <Icon className="w-7 h-7 text-brand-red" />
                </div>

                {/* Accent Line */}
                <div className="w-8 h-0.5 bg-brand-red mb-4" />

                {/* Title */}
                <h3
                  className="text-lg font-bold text-brand-grey-900 mb-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-brand-grey-500 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}