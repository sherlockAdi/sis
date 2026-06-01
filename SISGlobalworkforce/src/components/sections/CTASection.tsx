"use client";

import { useIntersectionObserver } from "@/lib/useIntersectionObserver";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      className={`py-20 red-gradient-section transition-all duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 text-center text-white">
        <h2
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready to Build Your Dream Team?
        </h2>
        <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Let SIS Global Workforce Solutions handle your hiring. Get access to verified talent across all industries.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/employers" className="btn-outline !text-white !border-white hover:!bg-white hover:!text-brand-red">
            Hire Workforce <ArrowRight size={16} />
          </Link>
          <a href="tel:01244171888" className="btn-outline !text-white !border-white/60 hover:!bg-white/20">
            <Phone size={16} />
            Call 0124-4171 888
          </a>
        </div>
      </div>
    </section>
  );
}
