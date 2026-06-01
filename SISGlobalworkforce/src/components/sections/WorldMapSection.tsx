"use client";

import { useEffect, useRef, useState } from "react";
import type { CountryData } from "@/types";

interface PinData extends CountryData {
  flag: string;
  tags: string[];
  animDelay: number;
}

interface TooltipState {
  x: number;
  y: number;
  pin: PinData | null;
}

const PINS: PinData[] = [
  { name: "North America", projects: 12, coordinates: [-100, 42], flag: "🇺🇸", tags: ["React", "Node.js", "AWS"], animDelay: 0 },
  { name: "South America", projects: 6,  coordinates: [-55, -12], flag: "🇧🇷", tags: ["Python", ".NET"],            animDelay: 0.35 },
  { name: "Europe",        projects: 15, coordinates: [12, 50],   flag: "🇬🇧", tags: ["React", "Vue", "Azure"],    animDelay: 0.7 },
  { name: "Africa",        projects: 4,  coordinates: [24, 4],    flag: "🌍",  tags: ["Node.js", "Python"],         animDelay: 1.0 },
  { name: "Middle East",   projects: 18, coordinates: [46, 26],   flag: "🇦🇪", tags: ["React", "AWS", "AI/ML"],    animDelay: 1.3 },
  { name: "India",         projects: 24, coordinates: [80, 22],   flag: "🇮🇳", tags: ["React", "Node.js", "Python", "AWS", "AI/ML", ".NET"], animDelay: 1.6 },
  { name: "Asia",          projects: 10, coordinates: [120, 36],  flag: "🌏",  tags: ["Vue", "Python", "AWS"],      animDelay: 1.9 },
  { name: "Oceania",       projects: 7,  coordinates: [134, -26], flag: "🇦🇺", tags: ["React", ".NET", "Azure"],   animDelay: 2.2 },
];

const REGION_PILLS = [
  { label: "North America (12)", color: "rgba(200,16,46,0.35)" },
  { label: "South America (6)",  color: "rgba(200,16,46,0.5)"  },
  { label: "Europe (15)",        color: "rgba(200,16,46,0.65)" },
  { label: "Africa (4)",         color: "rgba(160,13,37,0.75)" },
  { label: "Middle East (18)",   color: "rgba(160,13,37,0.9)"  },
  { label: "Asia (24)",          color: "#C8102E"               },
  { label: "Oceania (7)",        color: "#7A0A1C"               },
];

const STATS = [
  { value: "80+",   label: "Countries",         sub: "Worldwide Presence"    },
  { value: "96+",   label: "Partner Companies", sub: "Growing Together"      },
  { value: "2500+", label: "Professionals",     sub: "Delivering Excellence" },
  { value: "50+",   label: "Technologies",      sub: "Modern & Scalable"     },
  { value: "93K+",  label: "Live Jobs",         sub: "Active Openings"       },
  { value: "10+",   label: "Years",             sub: "Trusted Partnership"   },
];

export default function WorldMapSection() {
  const svgRef       = useRef<SVGSVGElement>(null);
  const mapWrapRef   = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip]   = useState<TooltipState>({ x: 0, y: 0, pin: null });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [d3, topojson] = await Promise.all([
        import("d3"),
        import("topojson-client"),
      ]);

      if (!svgRef.current || !mapWrapRef.current || !mounted) return;

      const W = 760, H = 340;
      const svg = d3.select(svgRef.current)
        .attr("viewBox", `0 0 ${W} ${H}`)
        .attr("width", "100%")
        .attr("height", "auto");

      svg.selectAll("*").remove();

      const proj = d3.geoNaturalEarth1().scale(130).translate([W / 2, H / 2 + 10]);
      const path = d3.geoPath().projection(proj);

      const world = await fetch(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
      ).then((r) => r.json());

      if (!mounted) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countries = topojson.feature(world, world.objects.countries) as any;

      svg.append("g")
        .selectAll("path")
        .data(countries.features)
        .join("path")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", path as any)
        .attr("fill", "#E4E4E4")
        .attr("stroke", "#D0D0D0")
        .attr("stroke-width", 0.4)
        .style("transition", "fill 0.2s ease")
        .on("mouseenter", function () { d3.select(this).attr("fill", "#C8C8C8"); })
        .on("mouseleave", function () { d3.select(this).attr("fill", "#E4E4E4"); });

      PINS.forEach((pin) => {
        const [px, py] = proj(pin.coordinates as [number, number]) ?? [0, 0];
        const d = pin.animDelay;
        const pg = svg.append("g").style("cursor", "pointer");

        // ── Ring 3 — outermost, slowest, most transparent ──
        const r3 = pg.append("circle")
          .attr("cx", px).attr("cy", py).attr("r", 10)
          .attr("fill", "rgba(200,16,46,0.06)")
          .attr("stroke", "rgba(200,16,46,0.20)")
          .attr("stroke-width", 0.8);
        r3.append("animate")
          .attr("attributeName", "r").attr("values", "10;30")
          .attr("dur", "2.6s").attr("begin", `${d}s`).attr("repeatCount", "indefinite");
        r3.append("animate")
          .attr("attributeName", "opacity").attr("values", "0.6;0")
          .attr("dur", "2.6s").attr("begin", `${d}s`).attr("repeatCount", "indefinite");

        // ── Ring 2 — mid, offset by 0.6s ──
        const r2 = pg.append("circle")
          .attr("cx", px).attr("cy", py).attr("r", 7)
          .attr("fill", "rgba(200,16,46,0.10)")
          .attr("stroke", "rgba(200,16,46,0.35)")
          .attr("stroke-width", 0.9);
        r2.append("animate")
          .attr("attributeName", "r").attr("values", "7;20")
          .attr("dur", "2.6s").attr("begin", `${d + 0.6}s`).attr("repeatCount", "indefinite");
        r2.append("animate")
          .attr("attributeName", "opacity").attr("values", "0.7;0")
          .attr("dur", "2.6s").attr("begin", `${d + 0.6}s`).attr("repeatCount", "indefinite");

        // ── Ring 1 — innermost, brightest, offset by 1.1s ──
        const r1 = pg.append("circle")
          .attr("cx", px).attr("cy", py).attr("r", 5)
          .attr("fill", "rgba(200,16,46,0.18)")
          .attr("stroke", "rgba(200,16,46,0.55)")
          .attr("stroke-width", 1.1);
        r1.append("animate")
          .attr("attributeName", "r").attr("values", "5;13")
          .attr("dur", "2.6s").attr("begin", `${d + 1.1}s`).attr("repeatCount", "indefinite");
        r1.append("animate")
          .attr("attributeName", "opacity").attr("values", "0.85;0")
          .attr("dur", "2.6s").attr("begin", `${d + 1.1}s`).attr("repeatCount", "indefinite");

        // ── Solid dot ──
        const dot = pg.append("circle")
          .attr("cx", px).attr("cy", py).attr("r", 15)
          .attr("fill", "#C8102E")
          .attr("stroke", "white")
          .attr("stroke-width", 2.5);
        dot.append("animate")
          .attr("attributeName", "opacity").attr("values", "1;0.6;1")
          .attr("dur", "2.6s").attr("begin", `${d}s`).attr("repeatCount", "indefinite");

        // ── Count label ──
        pg.append("text")
          .attr("x", px).attr("y", py + 4.5)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "11")
          .attr("font-weight", "700")
          .attr("font-family", "Barlow, sans-serif")
          .style("pointer-events", "none")
          .text(pin.projects);

        pg
          .on("mouseenter", (event: MouseEvent) => {
            dot.interrupt().transition().duration(150).attr("r", 19).attr("fill", "#A00D25");
            const rect = mapWrapRef.current!.getBoundingClientRect();
            let x = event.clientX - rect.left + 14;
            let y = event.clientY - rect.top - 12;
            if (x + 210 > rect.width) x = event.clientX - rect.left - 220;
            if (y + 180 > rect.height) y = event.clientY - rect.top - 180;
            setTooltip({ x, y, pin });
          })
          .on("mousemove", (event: MouseEvent) => {
            const rect = mapWrapRef.current!.getBoundingClientRect();
            let x = event.clientX - rect.left + 14;
            let y = event.clientY - rect.top - 12;
            if (x + 210 > rect.width) x = event.clientX - rect.left - 220;
            if (y + 180 > rect.height) y = event.clientY - rect.top - 180;
            setTooltip((prev) => ({ ...prev, x, y }));
          })
          .on("mouseleave", () => {
            dot.transition().duration(200).attr("r", 15).attr("fill", "#C8102E");
            setTooltip({ x: 0, y: 0, pin: null });
          });
      });

      if (mounted) setIsLoaded(true);
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* ── Section header ── */}
        <div className="text-center mb-10">
          <p className="text-brand-red text-xs font-bold tracking-widest uppercase mb-2">
            Global Outsourcing Network
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-brand-grey-900 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Global reach.{" "}
            <span className="text-brand-red block">Stronger together.</span>
          </h2>
        </div>

        {/* ── Main bordered card ── */}
        <div className="border border-brand-grey-200 rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-[300px_1fr]">

            {/* Left panel */}
            <div className="p-8 bg-white border-b md:border-b-0 md:border-r border-brand-grey-200 flex flex-col justify-between gap-6">
              <div>
                <p className="text-brand-grey-500 text-sm leading-relaxed mb-6">
                  We partner with associate partners worldwide to deliver innovative,
                  scalable and future-ready solutions.
                </p>

                {[
                  { icon: "👥", title: "Global Collaboration", desc: "Work with us across multiple markets and industries." },
                  { icon: "📈", title: "Mutual Growth",         desc: "Grow your business and unlock new opportunities together." },
                  { icon: "🛡️", title: "Trusted & Transparent", desc: "We ensure security, compliance and long-term success." },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-4 mb-5 last:mb-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: "#FFF0F2" }}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-grey-900 mb-0.5">{f.title}</p>
                      <p className="text-xs text-brand-grey-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-primary w-full justify-center">
                Become an Associate Partner
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right panel */}
            <div className="flex flex-col" style={{ background: "#FAFAFA" }}>
              <div className="px-6 pt-5 pb-2">
                <p className="font-bold text-brand-grey-900 text-sm">Our Global Footprint</p>
                <p className="text-xs text-brand-grey-500 mt-0.5">
                  An interactive map showcasing our outsourcing presence around the world.
                </p>
              </div>

              {/* SVG Map */}
              <div ref={mapWrapRef} className="relative flex-1 px-4 py-2">
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-brand-grey-400">
                      <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading map…</span>
                    </div>
                  </div>
                )}
                <svg
                  ref={svgRef}
                  className={`block transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                />

                {/* Hover tooltip */}
                {tooltip.pin && (
                  <div
                    className="absolute z-20 bg-white border border-brand-grey-200 rounded-xl shadow-xl pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y, minWidth: 200, padding: "14px 16px" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{tooltip.pin.flag}</span>
                      <span className="font-bold text-brand-grey-900 text-sm">{tooltip.pin.name}</span>
                    </div>
                    <p className="text-xs text-brand-grey-500 mb-3">{tooltip.pin.projects}+ Partner Companies</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-grey-400 font-semibold mb-2">
                      Key Technologies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tooltip.pin.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] bg-brand-grey-100 text-brand-grey-700 rounded px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Region legend pills */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 border-t border-brand-grey-200 bg-white">
                {REGION_PILLS.map((p) => (
                  <div key={p.label} className="flex items-center gap-1.5 text-xs text-brand-grey-600">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: p.color }}
                    />
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-brand-grey-200 divide-x divide-brand-grey-200">
            {STATS.map((s) => (
              <div key={s.label} className="text-center py-5 px-3">
                <div
                  className="text-2xl font-bold text-brand-red"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </div>
                <div className="text-xs font-semibold text-brand-grey-700 mt-1 uppercase tracking-wide">
                  {s.label}
                </div>
                <div className="text-[10px] text-brand-grey-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}