"use client";

import { useIntersectionObserver } from "@/lib/useIntersectionObserver";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";


const highlights = [
  "End-to-End Solutions",
  "Structured & Transparent",
  "Technology Driven",
  "Faster Turnaround",
];

export default function AboutSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div
            className={`relative transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
          >
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80"
                alt="SIS Global Office"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-brand-red text-white text-xs font-semibold px-3 py-1 rounded tracking-wider uppercase">
                Backed by SIS India Ltd.
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-4 border-brand-red/20 rounded-lg -z-10" />
          </div>

          {/* Content */}
          <div
            className={`transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
          >
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">About Company</p>
            <h2
              className="text-4xl font-bold text-brand-grey-900 mb-4 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              SIS Global Workforce Solutions
            </h2>
            <div className="section-divider section-divider-left mb-6" />
            <p className="text-brand-grey-600 mb-4 leading-relaxed">
              <strong className="text-brand-grey-800">SIS Global Workforce Solutions Private Limited</strong> is a new venture of SIS India Ltd., designed to deliver structured and scalable workforce outsourcing solutions.
            </p>
            <p className="text-brand-grey-600 mb-4 leading-relaxed">
              The company connects skilled talent with trusted employers through a technology-enabled ecosystem — ensuring transparency, efficiency, and reliability.
            </p>
            <p className="text-brand-grey-600 mb-6 leading-relaxed">
              Backed by SIS India&apos;s legacy, SIS Global transforms manpower outsourcing into an organised, compliant, and digitally driven service model.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {highlights.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-brand-red flex-shrink-0" />
                  <span className="text-sm text-brand-grey-700 font-medium">{h}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <a href="/" className="btn-primary">
                Learn More <ArrowRight size={16} />
              </a>
              <Link
                href="/contact"
                className="px-6 py-3 border border-brand-grey-300 text-brand-grey-700 text-sm font-semibold tracking-wider uppercase hover:border-brand-red hover:text-brand-red transition-colors"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
