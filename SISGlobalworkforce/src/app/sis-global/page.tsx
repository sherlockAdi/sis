// src/app/about/page.tsx
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight, CheckCircle, Target, Cpu, BarChart3,
  Users, Globe, Shield, Heart, Lightbulb, MessageSquare
} from "lucide-react";

// ── Static data ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "93,178", label: "Live Jobs",    sub: "Active openings"       },
  { value: "12,534", label: "Companies",    sub: "Verified employers"    },
  { value: "56,240", label: "Candidates",   sub: "Registered talent"     },
  { value: "29,180", label: "Placements",   sub: "Successful hires"      },
];

const FEATURES = [
  { icon: <Target size={20} />,    title: "Smart Matching",       desc: "AI-powered job recommendations tailored to your skills and experience." },
  { icon: <Shield size={20} />,    title: "Verified Employers",   desc: "Every company is thoroughly vetted before listing jobs on our platform." },
  { icon: <BarChart3 size={20} />, title: "Salary Insights",      desc: "Real-time salary benchmarking data to help candidates negotiate better." },
  { icon: <Cpu size={20} />,       title: "Technology Driven",    desc: "Our proprietary platform connects talent with opportunity at scale." },
];

const TEAM = [
  { name: "Rajiv Sharma",      role: "CEO & Founder",          avatar: "RS", color: "#C8102E" },
  { name: "Ananya Patel",      role: "Chief Operating Officer", avatar: "AP", color: "#404040" },
  { name: "Michael Torres",    role: "CTO",                    avatar: "MT", color: "#C8102E" },
  { name: "Deepika Nair",      role: "Head of Talent",         avatar: "DN", color: "#737373" },
  { name: "James Whitfield",   role: "VP — Global Expansion",  avatar: "JW", color: "#C8102E" },
  { name: "Sunita Krishnan",   role: "Head of Compliance",     avatar: "SK", color: "#404040" },
];

const VALUES = [
  { icon: <Globe size={22} />,        title: "Inclusivity",    desc: "Building a platform where everyone has equal opportunity regardless of background, location, or experience." },
  { icon: <Lightbulb size={22} />,    title: "Innovation",     desc: "Constantly improving how people find jobs and how companies find the right talent, faster." },
  { icon: <MessageSquare size={22} />,title: "Transparency",   desc: "Honest communication with candidates, employers, and our own team — always." },
  { icon: <Heart size={22} />,        title: "Impact",         desc: "Every hire we facilitate is a life changed. That responsibility drives everything we do." },
];

const MILESTONES = [
  { year: "2019", title: "Founded",         desc: "SIS Global Workforce Solutions incorporated as a venture of SIS India Ltd." },
  { year: "2020", title: "First 1,000 Jobs", desc: "Reached 1,000 active job listings across healthcare and logistics sectors." },
  { year: "2021", title: "5 Countries",     desc: "Expanded operations to UAE, Singapore, UK, and Australia." },
  { year: "2022", title: "Tech Platform",   desc: "Launched our proprietary AI-powered matching and verification engine." },
  { year: "2023", title: "25,000 Hires",    desc: "Surpassed 25,000 successful placements across all industry verticals." },
  { year: "2024", title: "Global Leader",   desc: "Recognised as one of India's fastest-growing workforce solutions companies." },
];

// ── Page ───────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#FFF5F6 0%,#FFF0F2 50%,#F5F5F5 100%)" }}>
          {/* Red geometric accent */}
          <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none overflow-hidden">
            <div
              className="absolute right-0 top-0 w-full h-full"
              style={{
                background: "radial-gradient(ellipse 60% 80% at 80% 40%, rgba(200,16,46,0.06) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute right-0 top-0 w-full h-full"
              style={{
                background: "radial-gradient(ellipse 40% 60% at 90% 10%, rgba(200,16,46,0.04) 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-brand-grey-500 mb-8">
              <Link href="/" className="hover:text-brand-red transition-colors">Home</Link>
              <span>/</span>
              <span className="text-brand-grey-800 font-medium">About Us</span>
            </div>

            <div className="max-w-2xl">
              <span
                className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-4 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(200,16,46,0.08)" }}
              >
                Our Story
              </span>
              <h1
                className="text-5xl md:text-6xl font-bold text-brand-grey-900 leading-[1.06] mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                We&apos;re on a Mission to Connect{" "}
                <span className="text-brand-red">People with Purpose</span>
              </h1>
              <p className="text-brand-grey-500 text-lg leading-relaxed mb-8 max-w-xl">
                SIS Global Workforce Solutions was founded with one simple belief: every person deserves
                a job that excites them, and every company deserves a team that drives them forward.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/jobs" className="btn-primary">
                  Find Jobs <ArrowRight size={15} />
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-6 py-3 border border-brand-grey-300 text-brand-grey-700 text-sm font-semibold rounded hover:border-brand-red hover:text-brand-red transition-colors"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section style={{ background: "linear-gradient(90deg,#C8102E 0%,#A00D25 50%,#8B0B1F 100%)" }}>
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
              {STATS.map((s, i) => (
                <div key={s.label} className="relative">
                  {i < STATS.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-white/20" />
                  )}
                  <div
                    className="text-4xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-white/90 text-sm font-semibold">{s.label}</div>
                  <div className="text-white/55 text-xs mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO WE ARE ── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">

              {/* Left */}
              <div>
                <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>
                  Who We Are
                </span>
                <h2
                  className="text-4xl font-bold text-brand-grey-900 leading-tight mb-5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Built by People Who Understand the Journey
                </h2>
                <div className="section-divider section-divider-left mb-6" />
                <p className="text-brand-grey-500 leading-relaxed mb-4">
                  Our founding team spent years on both sides of the hiring table — as job seekers
                  frustrated with impersonal platforms, and as hiring managers drowning in
                  unqualified applications.
                </p>
                <p className="text-brand-grey-500 leading-relaxed mb-4">
                  We built SIS Global Workforce Solutions to solve both problems simultaneously:
                  a platform intelligent enough to match the right people with the right roles,
                  and transparent enough that everyone knows where they stand.
                </p>
                <p className="text-brand-grey-500 leading-relaxed mb-8">
                  Backed by SIS India Ltd.&apos;s legacy of operational excellence, we bring decades
                  of domain expertise and a pan-India network to every engagement.
                </p>

                <div className="space-y-3">
                  {["End-to-End Solutions", "Technology Driven", "Structured & Transparent", "Faster Turnaround", "Compliance Guaranteed", "Backed by SIS India Ltd."].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-brand-red flex-shrink-0" />
                      <span className="text-sm font-medium text-brand-grey-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — feature cards */}
              <div className="grid grid-cols-2 gap-4">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    className="rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    style={{
                      background:   i % 2 === 0 ? "#FFF5F6" : "#FAFAFA",
                      borderColor:  i % 2 === 0 ? "rgba(200,16,46,0.15)" : "#E5E5E5",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        background: i % 2 === 0 ? "rgba(200,16,46,0.1)" : "#F0F0F0",
                        color: "#C8102E",
                      }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-brand-grey-900 text-sm mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      {f.title}
                    </h3>
                    <p className="text-xs text-brand-grey-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

       

        {/* ── TEAM ── */}
        <section id="team" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>
                Our Team
              </span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>
                Meet the People Behind SIS Global
              </h2>
              <p className="text-brand-grey-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
                A diverse team of passionate professionals committed to your success
              </p>
              <div className="section-divider mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="group bg-white border border-brand-grey-200 rounded-2xl p-7 text-center hover:border-brand-red/30 hover:shadow-lg transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="relative inline-block mb-5">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto"
                      style={{ background: `linear-gradient(135deg, ${member.color} 0%, ${member.color}CC 100%)`, fontFamily: "var(--font-display)" }}
                    >
                      {member.avatar}
                    </div>
                    {/* Red ring on hover */}
                    <div
                      className="absolute inset-0 rounded-full border-2 border-brand-red scale-0 group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <h3 className="font-bold text-brand-grey-900 mb-1" style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>
                    {member.name}
                  </h3>
                  <p className="text-brand-red text-xs font-semibold tracking-wide mb-4">{member.role}</p>

                  {/* Social links */}
                  <div className="flex justify-center gap-2">
                    {["in", "tw", "gh"].map((s) => (
                      <a
                        key={s}
                        href="#"
                        className="w-8 h-8 rounded-lg bg-brand-grey-100 flex items-center justify-center text-xs font-bold text-brand-grey-600 hover:bg-brand-red hover:text-white transition-all"
                      >
                        {s}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="py-20" style={{ background: "linear-gradient(135deg,#F9F9F9 0%,#F2F2F2 100%)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>
                Our Values
              </span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>
                What We Stand For
              </h2>
              <div className="section-divider mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((v, i) => (
                <div
                  key={v.title}
                  className="group bg-white rounded-2xl p-7 text-center border border-brand-grey-200 hover:border-brand-red/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: i % 2 === 0 ? "rgba(200,16,46,0.08)" : "#F0F0F0",
                      color: "#C8102E",
                    }}
                  >
                    {v.icon}
                  </div>
                  <h3 className="font-bold text-brand-grey-900 mb-3 text-base" style={{ fontFamily: "var(--font-display)" }}>
                    {v.title}
                  </h3>
                  <p className="text-xs text-brand-grey-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section
          className="py-20 text-white text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#C8102E 0%,#A00D25 60%,#7A0A1C 100%)" }}
        >
          {/* Background circles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-white/10" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full border border-white/10" />
            <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full border border-white/5" />
          </div>

          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <Users size={36} className="mx-auto mb-4 opacity-80" />
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to Work With Us?
            </h2>
            <p className="text-white/75 text-lg mb-10 leading-relaxed">
              Whether you&apos;re looking for your next opportunity or building your next great team —
              SIS Global Workforce Solutions is your partner.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs" className="btn-outline !text-white !border-white hover:!bg-white hover:!text-brand-red">
                Browse Jobs <ArrowRight size={15} />
              </Link>
              <Link href="/" className="btn-outline !text-white !border-white/50 hover:!bg-white/20">
                Get In Touch
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}