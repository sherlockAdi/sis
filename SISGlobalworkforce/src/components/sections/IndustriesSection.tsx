"use client";

import { useIntersectionObserver } from "@/lib/useIntersectionObserver";
import { industries } from "@/data";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function IndustriesSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="py-20 grey-gradient-section" ref={ref}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">
            What We Cover
          </p>

          <h2
            className="text-4xl font-bold text-brand-grey-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            INDUSTRIES WE SERVE
          </h2>

          <div className="section-divider mt-4" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, i) => {
            const Icon = industry.icon;

            return (
              <Link
                key={industry.id}
                href={industry.href}
                className={`industry-card bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-700 block group ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={industry.image}
                    alt={industry.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="industry-overlay absolute inset-0" />

                  {/* Icon Badge */}
                  <div className="absolute top-3 left-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                    <Icon
                      size={20}
                      className="text-brand-red"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3
                    className="text-lg font-bold text-brand-grey-900 mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {industry.title}
                  </h3>

                  <p className="text-brand-grey-500 text-sm leading-relaxed mb-4">
                    {industry.description}
                  </p>

                  <div className="flex items-center gap-2 text-brand-red text-sm font-semibold group-hover:gap-3 transition-all">
                    <span>Learn More</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="h-0.5 bg-gradient-to-r from-brand-red to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}