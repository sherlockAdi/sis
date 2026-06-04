"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative h-[71.6vh] min-h-[580px] flex items-center overflow-hidden">
      {/* Background video — loop, muted, autoplay */}
     <video
  className="absolute inset-0 w-full h-full object-cover"
  autoPlay
  muted
  loop
  playsInline
  poster="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80"
>
  <source src="/hero.mp4" type="video/mp4" />
</video>

      {/* Overlay */}
      <div className="hero-video-overlay absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="max-w-xl">
          <h1
            className="text-white text-5xl md:text-6xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Empowering Employers with{" "}
            <span className="text-brand-red">Reliable Workforce</span>{" "}
            Solutions
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
            Connecting businesses with skilled, verified and reliable workforce across industries.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/employers" className="btn-primary">
              Hire Workforce <ArrowRight size={16} />
            </Link>
            <Link href="/solutions" className="btn-outline">
              <Play size={14} fill="currentColor" />
              Explore Workforce Solutions
            </Link>
          </div>
        </div>
      </div>

      {/* Video play indicator — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60">
        <div className="w-px h-12 bg-white/30 animate-pulse" />
        <span className="text-xs tracking-widest uppercase">Scroll</span>
      </div>
    </section>
  );
}
