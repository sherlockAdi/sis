"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight, Shield, Users, Globe, TrendingUp,
  Building2, Award, ChevronRight, Star, CheckCircle, Phone
} from "lucide-react";

// ── useCountUp hook (inline — no extra file needed) ───────────────────────

function useCountUp(target: number, duration = 1800, delay = 0) {
  const ref      = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const raf      = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(el);

        const timeout = setTimeout(() => {
          let start: number | null = null;
          const tick = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) raf.current = requestAnimationFrame(tick);
          };
          raf.current = requestAnimationFrame(tick);
        }, delay);

        return () => clearTimeout(timeout);
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);

  return { ref, count };
}

// ── Data ──────────────────────────────────────────────────────────────────

const GROUP_STATS = [
  { raw: "₹15,982 Cr+", numeric: null,   suffix: "",   prefix: "₹", label: "Annual Revenue",    sub: "FY 2023–24"               },
  { raw: "357,028+",   numeric: 357028, suffix: "+",  prefix: "",  label: "Employees",         sub: "Across all verticals"     },
  { raw: "78,154",         numeric: 78154,     suffix: "+",  prefix: "",  label: "Sites",   sub: "Founded 1992"             },
  { raw: "22,329+",         numeric: 22329,     suffix: "+",  prefix: "",  label: "Customers",sub: "Diversified portfolio"    },
  { raw: "446+",         numeric: 446,     suffix: "+",  prefix: "",  label: "Offices",            sub: "Pan-India presence"       },
  { raw: "790+",          numeric: 790,      suffix: "+",  prefix: "",  label: "Districts",         sub: "International operations" },
];

const PRESENCE_STATS = [
  { icon: <Shield size={22} />,    numeric: 5000,   suffix: "+",      label: "Enterprise Clients",  bg: "rgba(200,16,46,0.06)", border: "rgba(200,16,46,0.15)" },
  { icon: <Users size={22} />,     numeric: 250000, suffix: "+",      label: "Employees",           bg: "#F5F5F5",              border: "#E5E5E5"              },
  { icon: <Globe size={22} />,     numeric: 22,     suffix: "+",      label: "Indian States",       bg: "#F5F5F5",              border: "#E5E5E5"              },
  { icon: <Building2 size={22} />, numeric: 10,     suffix: "+",      label: "Business Verticals",  bg: "rgba(200,16,46,0.06)", border: "rgba(200,16,46,0.15)" },
  { icon: <Award size={22} />,     numeric: 31,     suffix: "+",      label: "Years of Excellence", bg: "rgba(200,16,46,0.06)", border: "rgba(200,16,46,0.15)" },
  { icon: <Star size={22} />,      numeric: null,   suffix: "NSE·BSE",label: "Listed Entity",       bg: "#F5F5F5",              border: "#E5E5E5"              },
];

const BUSINESSES = [
  { id: "security",  icon: "🛡️", color: "#C8102E", title: "SIS Security",         category: "Security Solutions",      desc: "India's largest security solutions company providing manned guarding, electronic security, and integrated security solutions to 5,000+ clients.",                                    highlights: ["Manned Guarding", "CCTV & Surveillance", "Access Control", "Crisis Management"],              href: "https://www.sisindia.com" },
  { id: "workforce", icon: "👥", color: "#C8102E", title: "SIS Global Workforce",  category: "Workforce Solutions",     desc: "Technology-enabled workforce outsourcing connecting skilled, verified talent with trusted employers across industries and geographies.",                                               highlights: ["Permanent Staffing", "Contract Staffing", "Payroll Management", "HR Consulting"],             href: "/",  isActive: true },
  { id: "cash",      icon: "💰", color: "#404040", title: "SIS Cash Services",     category: "Cash Management",         desc: "End-to-end cash management services including ATM management, cash-in-transit, cash processing, and vault management for banks and enterprises.",                                    highlights: ["ATM Management", "Cash-in-Transit", "Cash Processing", "Vault Services"],                     href: "#" },
  { id: "facility",  icon: "🏢", color: "#404040", title: "Terminix SIS",          category: "Facility Management",     desc: "Comprehensive facility management and pest control services for residential complexes, commercial spaces, and large industrial facilities.",                                          highlights: ["Pest Control", "Housekeeping", "Soft Services", "Technical Services"],                        href: "#" },
  { id: "tech",      icon: "💻", color: "#C8102E", title: "SIS Tech",              category: "Technology Services",     desc: "Cutting-edge technology solutions including AI-powered surveillance, smart access management, and digital transformation for enterprise clients.",                                     highlights: ["AI Surveillance", "Smart Access", "Digital Platform", "IoT Integration"],                     href: "#" },
  { id: "training",  icon: "🎓", color: "#404040", title: "SIS Academy",           category: "Training & Development",  desc: "Skill development and workforce training programs empowering thousands of individuals with industry-certified qualifications annually.",                                             highlights: ["Skill Development", "Certification Programs", "Leadership Training", "Compliance Training"],  href: "#" },
];

const LEADERSHIP = [
  { name: "Ravindra Kishore Sinha", role: "Founder & Chairman",            avatar: "RKS", color: "#C8102E", quote: "Our vision is to be the most trusted integrated services company in Asia."    },
  { name: "Rituraj Kishore Sinha",  role: "Group CEO & Managing Director", avatar: "RJS", color: "#404040", quote: "Technology and talent together define the future of services."                },
  { name: "Uday Singh",             role: "Group CFO",                     avatar: "US",  color: "#C8102E", quote: "Financial discipline enables us to invest in people and growth."              },
  { name: "A. Venkataraman",        role: "President — Security Division", avatar: "AV",  color: "#737373", quote: "Safety is not a product, it is a culture we build together."                  },
];

const AWARDS = [
  { year: "2024", title: "India's Best Employer",              org: "Economic Times"                       },
  { year: "2023", title: "Top Staffing Company",               org: "NASSCOM Workforce Report"             },
  { year: "2023", title: "Best Security Services Brand",       org: "Asia Business Awards"                 },
  { year: "2022", title: "Great Place to Work Certified",      org: "Great Place to Work® India"           },
  { year: "2022", title: "Forbes India Top 100",               org: "Forbes India"                         },
  { year: "2021", title: "CII Award for Business Excellence",  org: "Confederation of Indian Industry"     },
];

const PRESENCE_REGIONS = [
  { region: "North India",   states: ["Delhi NCR", "Haryana", "Punjab", "UP", "Rajasthan"],        color: "#C8102E" },
  { region: "West India",    states: ["Maharashtra", "Gujarat", "Goa", "MP"],                      color: "#A00D25" },
  { region: "South India",   states: ["Karnataka", "Tamil Nadu", "Kerala", "Andhra", "Telangana"], color: "#C8102E" },
  { region: "East India",    states: ["West Bengal", "Odisha", "Bihar", "Jharkhand"],               color: "#7A0A1C" },
  { region: "International", states: ["Singapore", "UAE", "Australia", "UK", "USA"],               color: "#404040" },
];

// ── Small counter display components ──────────────────────────────────────

// Hero stat card with count-up
function HeroStatCard({ stat, delay }: { stat: typeof GROUP_STATS[0]; delay: number }) {
  const { ref, count } = useCountUp(stat.numeric ?? 0, 2000, delay);

  const display = stat.numeric === null
    ? stat.raw
    : `${stat.prefix}${count.toLocaleString("en-IN")}${stat.suffix}`;

  return (
    <div
      ref={ref}
      className="rounded-2xl p-5 border transition-all hover:border-brand-red/40"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="text-2xl font-bold mb-1 text-white tabular-nums"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
      >
        {display}
      </div>
      <div className="text-white/70 text-xs font-semibold">{stat.label}</div>
      <div className="text-white/35 text-[10px] mt-0.5">{stat.sub}</div>
    </div>
  );
}

// Presence section stat card with count-up
function PresenceStatCard({ item, delay }: { item: typeof PRESENCE_STATS[0]; delay: number }) {
  const { ref, count } = useCountUp(item.numeric ?? 0, 1800, delay);

  const display = item.numeric === null
    ? item.suffix           // "NSE·BSE"
    : `${count.toLocaleString("en-IN")}${item.suffix}`;

  return (
    <div
      ref={ref}
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
        style={{ fontFamily: "var(--font-display)" }}
      >
        {display}
      </div>
      <div className="text-xs text-brand-grey-500 font-medium">{item.label}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function SISIndiaGroupPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ══════════ HERO ══════════ */}
        <section className="relative overflow-hidden bg-brand-grey-900 text-white">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full border border-white/5" />
            <div className="absolute top-20 -right-20 w-[400px] h-[400px] rounded-full border border-white/5" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-white/5" />
            <div className="absolute top-0 right-0 w-1/2 h-full" style={{ background: "radial-gradient(ellipse 70% 80% at 90% 30%, rgba(200,16,46,0.18) 0%, transparent 70%)" }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-10">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-white/70">SIS India Group</span>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full mb-6"
                  style={{ background: "rgba(200,16,46,0.2)", color: "#FF6B7A", border: "1px solid rgba(200,16,46,0.3)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                  India&apos;s Largest Integrated Services Group
                </div>

                <h1 className="text-5xl md:text-6xl font-bold leading-[1.04] mb-6" style={{ fontFamily: "var(--font-display)" }}>
                  SIS India <span className="text-brand-red">Group</span>
                </h1>
                <p className="text-white/60 text-lg leading-relaxed mb-4">
                  A diversified conglomerate founded in 1992, SIS India Group is the country&apos;s
                  largest integrated security and services organisation — with operations spanning
                  security, workforce, cash management, facility services, and technology.
                </p>
                <p className="text-white/50 text-base leading-relaxed mb-10">
                  Listed on the NSE & BSE, the Group employs over 2,50,000 professionals and
                  serves clients across 22+ Indian states and 8 countries worldwide.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="/" className="btn-primary">
                    Explore Workforce Solutions <ArrowRight size={15} />
                  </Link>
                  <a
                    href="https://www.sisindia.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 border border-white/25 text-white/80 text-sm font-semibold rounded hover:border-white/60 hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                  >
                    Visit SIS India.com ↗
                  </a>
                </div>
              </div>

              {/* ── Hero stat cards with count-up ── */}
              <div className="grid grid-cols-2 gap-3">
                {GROUP_STATS.map((s, i) => (
                  <HeroStatCard key={s.label} stat={s} delay={i * 100} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ RED ACCENT STRIP ══════════ */}
        <div style={{ background: "linear-gradient(90deg,#C8102E 0%,#A00D25 50%,#7A0A1C 100%)", padding: "16px 0" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-white/70 flex-shrink-0" />
                <span className="text-white/80 text-sm">
                  Listed on <strong className="text-white">NSE & BSE</strong> — India&apos;s most trusted integrated services conglomerate
                </span>
              </div>
              <a href="https://www.sisindia.com" target="_blank" rel="noopener noreferrer" className="text-white text-xs font-bold tracking-widest uppercase hover:underline flex items-center gap-1.5">
                Investor Relations ↗
              </a>
            </div>
          </div>
        </div>

        {/* ══════════ BUSINESS VERTICALS ══════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>
                Business Portfolio
              </span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>
                Our Business Verticals
              </h2>
              <p className="text-brand-grey-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
                A diversified portfolio of world-class service businesses, united by a commitment to excellence
              </p>
              <div className="section-divider mt-5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BUSINESSES.map((biz) => (
                <div
                  key={biz.id}
                  className={`relative group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${biz.isActive ? "border-brand-red/30 shadow-md" : "border-brand-grey-200"}`}
                >
                  {biz.isActive && (
                    <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full z-10" style={{ background: "#C8102E", color: "white" }}>
                      ★ YOU ARE HERE
                    </div>
                  )}
                  <div className="h-1 w-full" style={{ background: biz.isActive ? "#C8102E" : "linear-gradient(90deg,#E5E5E5,#D0D0D0)" }} />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: biz.isActive ? "rgba(200,16,46,0.08)" : "#F5F5F5" }}>
                        {biz.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-brand-grey-400">{biz.category}</p>
                        <h3 className="font-bold text-brand-grey-900 text-base leading-tight" style={{ fontFamily: "var(--font-display)" }}>{biz.title}</h3>
                      </div>
                    </div>
                    <p className="text-brand-grey-500 text-sm leading-relaxed mb-5">{biz.desc}</p>
                    <div className="grid grid-cols-2 gap-1.5 mb-5">
                      {biz.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-brand-red flex-shrink-0" />
                          <span className="text-xs text-brand-grey-600">{h}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href={biz.href}
                      target={biz.href.startsWith("http") ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${biz.isActive ? "text-brand-red" : "text-brand-grey-500 hover:text-brand-red"}`}
                    >
                      {biz.isActive ? "Explore Workforce Solutions" : "Learn More"}
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ LEGACY TIMELINE ══════════ */}
        <section className="py-20" style={{ background: "linear-gradient(160deg,#171717 0%,#262626 100%)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(200,16,46,0.2)", color: "#FF6B7A", border: "1px solid rgba(200,16,46,0.25)" }}>
                Our Legacy
              </span>
              <h2 className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Three Decades of Trust</h2>
              <p className="text-white/40 mt-3 max-w-xl mx-auto text-sm leading-relaxed">From a single-office security firm to India&apos;s largest integrated services group</p>
            </div>

            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-px hidden md:block" style={{ background: "rgba(200,16,46,0.3)" }} />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
                {[
                  { year: "1992", event: "Founded in Patna, Bihar"        },
                  { year: "1997", event: "Expanded to 5 states"           },
                  { year: "2003", event: "Launched Cash Services"         },
                  { year: "2008", event: "Pan-India operations"           },
                  { year: "2014", event: "International expansion"        },
                  { year: "2017", event: "Listed on NSE & BSE"            },
                  { year: "2021", event: "₹10,000 Cr revenue milestone"   },
                  { year: "2024", event: "2,50,000+ workforce"            },
                ].map((item, i) => (
                  <div key={item.year} className="relative flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs mb-3 z-10 flex-shrink-0"
                      style={{
                        background: i % 2 === 0 ? "linear-gradient(135deg,#C8102E,#A00D25)" : "rgba(255,255,255,0.08)",
                        border: i % 2 !== 0 ? "1px solid rgba(255,255,255,0.12)" : "none",
                        fontFamily: "var(--font-display)", fontSize: 10,
                      }}
                    >
                      {item.year.slice(-2)}
                    </div>
                    <p className="text-xs font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: i % 2 === 0 ? "#C8102E" : "rgba(255,255,255,0.5)" }}>
                      {item.year}
                    </p>
                    <p className="text-[11px] text-white/40 leading-relaxed">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ LEADERSHIP ══════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Leadership</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>Group Leadership Team</h2>
              <p className="text-brand-grey-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">Visionary leaders with decades of experience in services, technology, and business transformation</p>
              <div className="section-divider mt-5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {LEADERSHIP.map((person) => (
                <div key={person.name} className="group bg-white border border-brand-grey-200 rounded-2xl p-6 text-center hover:border-brand-red/30 hover:shadow-lg transition-all duration-300">
                  <div className="relative inline-block mb-5">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto"
                      style={{ background: `linear-gradient(135deg,${person.color} 0%,${person.color}BB 100%)`, fontFamily: "var(--font-display)" }}
                    >
                      {person.avatar}
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-brand-red scale-0 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-brand-grey-900 mb-1 leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>{person.name}</h3>
                  <p className="text-brand-red text-xs font-semibold tracking-wide mb-4">{person.role}</p>
                  <blockquote className="text-xs text-brand-grey-400 leading-relaxed italic border-l-2 border-brand-red/30 pl-3 text-left">
                    &ldquo;{person.quote}&rdquo;
                  </blockquote>
                  <div className="flex justify-center gap-2 mt-4">
                    {["in", "tw"].map((s) => (
                      <a key={s} href="#" className="w-7 h-7 rounded-lg bg-brand-grey-100 flex items-center justify-center text-xs font-bold text-brand-grey-600 hover:bg-brand-red hover:text-white transition-all">{s}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* /// The presence section is currently commented out as we are still finalizing the content and design. It will be added back in the next update. */}
<div>
 {/* ══════════ PRESENCE ══════════ */}
        {/* <section className="py-20" style={{ background: "linear-gradient(135deg,#F9F9F9 0%,#F2F2F2 100%)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>
                  Our Presence
                </span>
                <h2 className="text-4xl font-bold text-brand-grey-900 leading-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
                  Pan-India & Global Footprint
                </h2>
                <div className="section-divider section-divider-left mb-6" />
                <p className="text-brand-grey-500 leading-relaxed mb-4">
                  With operations spanning every major state in India and a growing international presence, SIS India Group is uniquely positioned to serve businesses at any scale.
                </p>
                <p className="text-brand-grey-500 leading-relaxed mb-8">
                  Our distributed network of regional offices, training centres, and operations hubs ensures rapid deployment and consistent service quality across all geographies.
                </p>
                <div className="space-y-3">
                  {PRESENCE_REGIONS.map((r) => (
                    <div key={r.region} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-brand-grey-200 hover:border-brand-red/30 transition-colors">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: r.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-grey-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>{r.region}</p>
                        <p className="text-xs text-brand-grey-500">{r.states.join(" · ")}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-red flex-shrink-0">{r.states.length} regions</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Presence stat cards with count-up ── */}
              {/* <div className="grid grid-cols-2 gap-4">
                {PRESENCE_STATS.map((item, i) => (
                  <PresenceStatCard key={item.label} item={item} delay={i * 100} />
                ))}
              </div>
            </div>
          </div>
        </section> */} 
</div>
       

        {/* ══════════ AWARDS ══════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Recognition</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>Awards & Accolades</h2>
              <div className="section-divider mt-5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {AWARDS.map((a) => (
                <div key={a.title} className="group flex items-start gap-4 p-5 bg-white border border-brand-grey-200 rounded-xl hover:border-brand-red/30 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-red" style={{ background: "rgba(200,16,46,0.08)" }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-1">{a.year}</p>
                    <h3 className="font-bold text-brand-grey-900 text-sm leading-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>{a.title}</h3>
                    <p className="text-xs text-brand-grey-400">{a.org}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ CTA DUAL PANEL ══════════ */}
        <section className="py-0">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center px-12 py-16 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#171717 0%,#262626 100%)" }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full border border-white/5 translate-x-1/2 -translate-y-1/2" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(200,16,46,0.8)" }}>SIS India Group</p>
              <h3 className="text-3xl font-bold mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>Partner with India&apos;s Most Trusted Services Group</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">Whether you need security, workforce, cash management or facility services — the SIS Group has a solution for you.</p>
              <a href="https://www.sisindia.com" target="_blank" rel="noopener noreferrer" className="btn-primary w-fit">Visit SIS India ↗</a>
            </div>

            <div className="flex flex-col justify-center px-12 py-16 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#C8102E 0%,#A00D25 60%,#7A0A1C 100%)" }}>
              <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full border border-white/10 translate-x-1/4 translate-y-1/4" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3 text-white/60">SIS Global Workforce</p>
              <h3 className="text-3xl font-bold mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>Looking for Workforce Solutions Specifically?</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-8">Hire skilled, verified talent across all industries with our end-to-end recruitment and staffing services.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/jobs" className="btn-outline !text-white !border-white hover:!bg-white hover:!text-brand-red">
                  Browse Jobs <ArrowRight size={14} />
                </Link>
                <a href="tel:01244171888" className="flex items-center gap-2 px-4 py-2.5 border border-white/40 text-white/80 text-sm font-semibold rounded hover:border-white hover:text-white transition-colors" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
                  <Phone size={14} /> Call Us
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}