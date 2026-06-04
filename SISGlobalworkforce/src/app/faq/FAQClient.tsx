// src/app/faq/FAQClient.tsx  ← CLIENT COMPONENT
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, Search, Phone, Mail, MessageSquare, ChevronRight } from "lucide-react";

import type { FAQ, CATEGORIES } from "./page";

// ── Types ──────────────────────────────────────────────────────────────────

type Category = (typeof CATEGORIES)[number];

interface Props {
  categories: readonly Category[];
  faqs:       FAQ[];
}

// ── AccordionItem ──────────────────────────────────────────────────────────

function AccordionItem({
  faq, isOpen, onToggle,
}: {
  faq: FAQ; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="border rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        borderColor: isOpen ? "rgba(200,16,46,0.3)" : "#E5E5E5",
        background:  "white",
        boxShadow:   isOpen ? "0 4px 20px rgba(200,16,46,0.08)" : "none",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 px-6 py-5 text-left group"
      >
        {/* Number badge */}
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors"
          style={{
            background: isOpen ? "#C8102E" : "#F5F5F5",
            color:      isOpen ? "white"   : "#A3A3A3",
            fontFamily: "var(--font-display)",
          }}
        >
          {String(faq.id).padStart(2, "0")}
        </span>

        <span
          className="flex-1 font-semibold text-sm leading-relaxed transition-colors"
          style={{ color: isOpen ? "#C8102E" : "#171717" }}
        >
          {faq.question}
        </span>

        <ChevronDown
          size={18}
          className="flex-shrink-0 mt-0.5 transition-transform duration-300 text-brand-grey-400"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Answer panel */}
      <div
        style={{
          maxHeight:  isOpen ? 400 : 0,
          overflow:   "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="px-6 pb-6 ml-11">
          <div className="w-8 h-px bg-brand-red/30 mb-4" />
          <p className="text-sm text-brand-grey-500 leading-relaxed">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ── FAQClient ──────────────────────────────────────────────────────────────

export default function FAQClient({ categories, faqs }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId,         setOpenId]         = useState<number | null>(1);
  const [query,          setQuery]          = useState("");

  const filtered = useMemo(() => {
    let list = faqs;
    if (activeCategory !== "all") list = list.filter((f) => f.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqs, activeCategory, query]);

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setQuery("");
    setOpenId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveCategory("all");
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
  };

  return (
    <main>

      {/* ════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#171717 0%,#262626 100%)" }}
      >
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full border border-white/5" />
          <div className="absolute top-10 -right-10 w-72 h-72 rounded-full border border-white/5" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full border border-brand-red/10" />
          <div
            className="absolute right-0 top-0 w-1/2 h-full"
            style={{ background: "radial-gradient(ellipse 60% 80% at 90% 40%, rgba(200,16,46,0.14) 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={11} />
            <span className="text-white/70">FAQ</span>
          </div>

          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(200,16,46,0.2)", color: "#FF6B7A", border: "1px solid rgba(200,16,46,0.28)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
              Help Center
            </span>

            <h1
              className="text-5xl md:text-6xl font-bold text-white leading-[1.05] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Frequently Asked <span className="text-brand-red">Questions</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mb-8">
              Everything you need to know about SIS Global Workforce Solutions. Can&apos;t find your answer? Contact our team directly.
            </p>

            {/* Search bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search questions…"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <button onClick={clearFilters} className="btn-primary !py-3.5 !px-6 text-sm">
                {query ? "Clear" : "Search"}
              </button>
            </div>

            {/* Quick stat pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { label: "24 Questions",        color: "rgba(255,255,255,0.08)" },
                { label: "6 Categories",        color: "rgba(255,255,255,0.08)" },
                { label: "Avg. response: 4 hrs",color: "rgba(200,16,46,0.25)"  },
              ].map((p) => (
                <span
                  key={p.label}
                  className="text-xs text-white/60 px-3 py-1.5 rounded-full font-medium"
                  style={{ background: p.color, border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ background: "linear-gradient(160deg,#FAFAFA 0%,#F3F3F3 100%)" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-start">

            {/* ── Sidebar ── */}
            <aside className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-brand-grey-200 overflow-hidden shadow-sm">
                <div className="px-4 py-4 border-b border-brand-grey-100" style={{ background: "#FFF5F6" }}>
                  <p className="text-xs font-bold text-brand-red tracking-widest uppercase">Categories</p>
                </div>

                <div className="p-2">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left"
                        style={{
                          background: isActive ? "rgba(200,16,46,0.07)" : "transparent",
                          color:      isActive ? "#C8102E" : "#525252",
                        }}
                      >
                        <span className="text-base leading-none">{cat.icon}</span>
                        <span className="flex-1">{cat.label}</span>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: isActive ? "rgba(200,16,46,0.12)" : "#F0F0F0",
                            color:      isActive ? "#C8102E" : "#A3A3A3",
                          }}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick contact card */}
              <div
                className="mt-5 rounded-2xl p-5 text-white"
                style={{ background: "linear-gradient(135deg,#C8102E 0%,#900B20 100%)" }}
              >
                <p className="font-bold text-sm mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Still have questions?
                </p>
                <p className="text-white/70 text-xs leading-relaxed mb-4">
                  Our team replies within 4 working hours.
                </p>
                <Link
                  href="/contact"
                  className="block w-full py-2.5 rounded-lg bg-white text-center text-sm font-bold text-brand-red hover:bg-brand-grey-50 transition-colors"
                >
                  Contact Support →
                </Link>
              </div>
            </aside>

            {/* ── FAQ list ── */}
            <div>
              {/* Result header */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-brand-grey-500">
                  Showing <strong className="text-brand-grey-900">{filtered.length}</strong>{" "}
                  question{filtered.length !== 1 ? "s" : ""}
                  {activeCategory !== "all" && (
                    <> in <strong className="text-brand-red">{categories.find((c) => c.id === activeCategory)?.label}</strong></>
                  )}
                  {query && <> matching &ldquo;<strong className="text-brand-red">{query}</strong>&rdquo;</>}
                </p>
                {(query || activeCategory !== "all") && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-brand-red hover:underline font-semibold"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Accordion */}
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="font-bold text-brand-grey-700 text-lg mb-2">No results found</p>
                  <p className="text-sm text-brand-grey-400">Try a different search term or browse all categories.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      faq={faq}
                      isOpen={openId === faq.id}
                      onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                    />
                  ))}
                </div>
              )}

              {/* Bottom CTA */}
              <div
                className="mt-10 rounded-2xl p-8 text-center border border-brand-grey-200"
                style={{ background: "white" }}
              >
                <div className="text-4xl mb-4">💬</div>
                <h3
                  className="text-xl font-bold text-brand-grey-900 mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Still have questions?
                </h3>
                <p className="text-sm text-brand-grey-500 mb-6 max-w-sm mx-auto leading-relaxed">
                  Can&apos;t find what you&apos;re looking for? Our support team is available Monday to Saturday, 9AM–7PM IST.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="btn-primary text-sm">
                    <MessageSquare size={14} /> Contact Support
                  </Link>
                  <a
                    href="tel:01244171888"
                    className="flex items-center gap-2 px-5 py-2.5 border border-brand-grey-300 text-brand-grey-700 text-sm font-semibold rounded hover:border-brand-red hover:text-brand-red transition-colors"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                  >
                    <Phone size={14} /> 0124-4171 888
                  </a>
                  <a
                    href="mailto:info@sisglobal.com"
                    className="flex items-center gap-2 px-5 py-2.5 border border-brand-grey-300 text-brand-grey-700 text-sm font-semibold rounded hover:border-brand-red hover:text-brand-red transition-colors"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                  >
                    <Mail size={14} /> Email Us
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}