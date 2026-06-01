// src/app/contact/ContactClient.tsx  ← CLIENT COMPONENT
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone, Mail, MapPin, Clock, Send, ChevronRight,
  CheckCircle, MessageSquare, Briefcase, Building2, Globe,
} from "lucide-react";

import type { OFFICES, FAQS } from "./page";

// ── Types ──────────────────────────────────────────────────────────────────

type Office  = (typeof OFFICES)[number];
type Faq     = (typeof FAQS)[number];

interface Props {
  offices: readonly Office[];
  faqs:    readonly Faq[];
}

// ── Static UI-only data (icons can't be serialised from server → stays here) ─

const ENQUIRY_TYPES = [
  { value: "hiring",  label: "Hire Workforce",    icon: <Briefcase     size={16} /> },
  { value: "jobs",    label: "Job Opportunities", icon: <MessageSquare size={16} /> },
  { value: "partner", label: "Partnership / B2B", icon: <Building2     size={16} /> },
  { value: "other",   label: "General Enquiry",   icon: <Globe         size={16} /> },
];

const QUICK_CONTACTS = [
  { icon: <Phone         size={18} />, label: "Call Us",  value: "0124-4171 888",      sub: "Mon–Sat, 9am–7pm IST",   href: "tel:01244171888"            },
  { icon: <Mail          size={18} />, label: "Email Us", value: "info@sisglobal.com", sub: "Reply within 4 hours",   href: "mailto:info@sisglobal.com"  },
  { icon: <MessageSquare size={18} />, label: "WhatsApp", value: "+91 98765 43210",    sub: "Chat with us instantly", href: "https://wa.me/919876543210" },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function ContactClient({ offices, faqs }: Props) {
  const [enquiryType,  setEnquiryType]  = useState("hiring");
  const [submitted,    setSubmitted]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [activeOffice, setActiveOffice] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1600);
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
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-white/5" />
          <div className="absolute top-10 -right-20 w-80 h-80 rounded-full border border-white/5" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full border border-brand-red/10" />
          <div
            className="absolute right-0 top-0 w-1/2 h-full"
            style={{ background: "radial-gradient(ellipse 60% 80% at 90% 40%, rgba(200,16,46,0.12) 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={11} />
            <span className="text-white/70">Contact Us</span>
          </div>

          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Heading */}
            <div>
              <span
                className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(200,16,46,0.18)", color: "#FF6B7A", border: "1px solid rgba(200,16,46,0.28)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                Get In Touch
              </span>
              <h1
                className="text-5xl md:text-6xl font-bold text-white leading-[1.05] mb-5"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Let&apos;s Start a <span className="text-brand-red">Conversation</span>
              </h1>
              <p className="text-white/55 text-lg leading-relaxed max-w-md">
                Whether you&apos;re looking to hire a workforce, find a job, or explore a partnership —
                our team is ready to help you within the hour.
              </p>
            </div>

            {/* Quick contact cards */}
            <div className="flex flex-col gap-3">
              {QUICK_CONTACTS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-250 hover:border-brand-red/50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-brand-red"
                    style={{ background: "rgba(200,16,46,0.2)", color: "#FF6B7A" }}
                  >
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-0.5">{c.label}</p>
                    <p className="text-white font-bold text-sm">{c.value}</p>
                    <p className="text-white/35 text-xs mt-0.5">{c.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-brand-red group-hover:translate-x-1 transition-all flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FORM + OFFICES
      ════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: "linear-gradient(160deg,#FAFAFA 0%,#F3F3F3 100%)" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_460px] gap-10 items-start">

            {/* ── Contact Form ── */}
            <div
              className="bg-white rounded-3xl overflow-hidden shadow-xl"
              style={{ border: "1px solid #E5E5E5", borderTop: "4px solid #C8102E" }}
            >
              <div className="px-8 pt-8 pb-6 border-b border-brand-grey-100">
                <h2
                  className="text-2xl font-bold text-brand-grey-900 mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Send Us a Message
                </h2>
                <p className="text-sm text-brand-grey-500">
                  Fill out the form below and we&apos;ll get back to you within{" "}
                  <strong className="text-brand-grey-700">4 working hours</strong>.
                </p>
              </div>

              <div className="px-8 py-7">
                {submitted ? (
                  <SuccessState onReset={() => setSubmitted(false)} />
                ) : (
                  <ContactForm
                    enquiryType={enquiryType}
                    loading={loading}
                    offices={offices}
                    onEnquiryTypeChange={setEnquiryType}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
            </div>

            {/* ── Offices panel ── */}
            <OfficesPanel
              offices={offices}
              activeOffice={activeOffice}
              onSelect={setActiveOffice}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-grey-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Frequently Asked Questions
            </h2>
            <div className="section-divider mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-5 rounded-xl border border-brand-grey-200 hover:border-brand-red/30 transition-colors"
              >
                <h4 className="font-bold text-brand-grey-900 text-sm mb-2 flex items-start gap-2">
                  <span className="text-brand-red mt-0.5 flex-shrink-0">Q</span>
                  {faq.q}
                </h4>
                <p className="text-xs text-brand-grey-500 leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BOTTOM CTA
      ════════════════════════════════════════════════════════ */}
      <section
        className="py-16 text-white text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#C8102E 0%,#A00D25 60%,#7A0A1C 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full border border-white/10" />
        </div>
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h2
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Prefer to Talk Directly?
          </h2>
          <p className="text-white/70 text-base mb-8">
            Our team is available Monday to Saturday, 9AM to 7PM IST — ready to answer your questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:01244171888" className="btn-outline !text-white !border-white hover:!bg-white hover:!text-brand-red">
              <Phone size={15} />
              Call 0124-4171 888
            </a>
            <a href="mailto:info@sisglobal.com" className="btn-outline !text-white !border-white/50 hover:!bg-white/20">
              <Mail size={15} />
              info@sisglobal.com
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "rgba(200,16,46,0.08)" }}
      >
        <CheckCircle size={36} className="text-brand-red" />
      </div>
      <h3
        className="text-2xl font-bold text-brand-grey-900 mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Message Sent!
      </h3>
      <p className="text-brand-grey-500 text-sm leading-relaxed max-w-sm mb-8">
        Thank you for reaching out. One of our specialists will contact you within 4 working hours.
      </p>
      <button onClick={onReset} className="btn-primary text-sm">
        Send Another Message
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ContactFormProps {
  enquiryType:          string;
  loading:              boolean;
  offices:              readonly Office[];
  onEnquiryTypeChange:  (v: string) => void;
  onSubmit:             (e: React.FormEvent) => void;
}

function ContactForm({
  enquiryType, loading, offices, onEnquiryTypeChange, onSubmit,
}: ContactFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Enquiry type pills */}
      <div>
        <label className="block text-xs font-bold text-brand-grey-700 uppercase tracking-widest mb-3">
          I&apos;m enquiring about
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ENQUIRY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onEnquiryTypeChange(t.value)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all duration-200"
              style={{
                background:  enquiryType === t.value ? "rgba(200,16,46,0.07)" : "#FAFAFA",
                borderColor: enquiryType === t.value ? "#C8102E" : "#E5E5E5",
                color:       enquiryType === t.value ? "#C8102E" : "#737373",
                transform:   enquiryType === t.value ? "translateY(-1px)" : "none",
                boxShadow:   enquiryType === t.value ? "0 4px 12px rgba(200,16,46,0.12)" : "none",
              }}
            >
              <span style={{ color: enquiryType === t.value ? "#C8102E" : "#A3A3A3" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name + Company */}
      <div className="grid sm:grid-cols-2 gap-4">
        <InputField label="Full Name *"   name="name"    placeholder="Your full name"  required />
        <InputField label="Company Name"  name="company" placeholder="Your company"              />
      </div>

      {/* Email + Phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <InputField label="Email Address *" name="email" type="email" placeholder="you@company.com" required />
        <InputField label="Phone Number"    name="phone" type="tel"   placeholder="+91 XXXXX XXXXX"          />
      </div>

      {/* Industry + Office */}
      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField
          label="Industry"
          name="industry"
          options={["Healthcare", "Hospitality", "Oil & Gas", "Logistics", "Engineering & MEP", "IT & Technology", "Other"]}
        />
        <SelectField
          label="Preferred Office"
          name="office"
          options={offices.map((o) => o.city)}
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-bold text-brand-grey-700 uppercase tracking-widest mb-2">
          Message *
        </label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Tell us about your requirement, timeline, and expected workforce size…"
          className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-800 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red resize-none transition-colors"
        />
      </div>

      {/* Consent */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" required className="mt-0.5 accent-brand-red w-4 h-4 flex-shrink-0" />
        <span className="text-xs text-brand-grey-500 leading-relaxed">
          I agree to the{" "}
          <Link href="/privacy" className="text-brand-red hover:underline">Privacy Policy</Link>{" "}
          and consent to SIS Global Workforce Solutions contacting me regarding my enquiry.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center text-sm relative overflow-hidden"
        style={{ opacity: loading ? 0.85 : 1 }}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send size={15} />
            Send Message
          </span>
        )}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface OfficesPanelProps {
  offices:      readonly Office[];
  activeOffice: number;
  onSelect:     (i: number) => void;
}

function OfficesPanel({ offices, activeOffice, onSelect }: OfficesPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2
          className="text-2xl font-bold text-brand-grey-900 mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Our Offices
        </h2>
        <p className="text-sm text-brand-grey-500">Click on an office to view its location details</p>
      </div>

      {/* Office cards */}
      <div className="flex flex-col gap-3">
        {offices.map((office, i) => (
          <button
            key={office.city}
            onClick={() => onSelect(i)}
            className="text-left rounded-2xl border p-5 transition-all duration-250 w-full"
            style={{
              background:  activeOffice === i ? "white" : "#FAFAFA",
              borderColor: activeOffice === i ? "#C8102E" : "#E5E5E5",
              borderLeft:  activeOffice === i ? "4px solid #C8102E" : "4px solid transparent",
              boxShadow:   activeOffice === i ? "0 4px 20px rgba(200,16,46,0.10)" : "none",
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{office.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="font-bold text-sm"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: activeOffice === i ? "#C8102E" : "#171717",
                    }}
                  >
                    {office.city}
                  </h3>
                  {office.primary && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(200,16,46,0.08)", color: "#C8102E" }}
                    >
                      Headquarters
                    </span>
                  )}
                </div>

                <p className="text-xs text-brand-grey-500 leading-relaxed mb-2">{office.address}</p>

                {/* Animated expanded details */}
                <div
                  style={{
                    maxHeight:  activeOffice === i ? 200 : 0,
                    overflow:   "hidden",
                    transition: "max-height 0.35s ease",
                  }}
                >
                  <div className="pt-3 border-t border-brand-grey-100 mt-2 space-y-2">
                    <a
                      href={`tel:${office.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-xs text-brand-grey-600 hover:text-brand-red transition-colors"
                    >
                      <Phone size={12} className="text-brand-red flex-shrink-0" />
                      {office.phone}
                    </a>
                    <a
                      href={`mailto:${office.email}`}
                      className="flex items-center gap-2 text-xs text-brand-grey-600 hover:text-brand-red transition-colors"
                    >
                      <Mail size={12} className="text-brand-red flex-shrink-0" />
                      {office.email}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-brand-grey-500">
                      <Clock size={12} className="text-brand-red flex-shrink-0" />
                      {office.hours}
                    </div>
                    <a
                      href={office.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline mt-1"
                    >
                      <MapPin size={12} />
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Map embed */}
      <div
        className="rounded-2xl overflow-hidden border border-brand-grey-200 shadow-sm"
        style={{ height: 220 }}
      >
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(offices[activeOffice].address)}&output=embed&z=14`}
          width="100%"
          height="220"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${offices[activeOffice].city} office map`}
        />
      </div>
    </div>
  );
}

// ── Reusable field primitives ──────────────────────────────────────────────

function InputField({
  label, name, type = "text", placeholder, required = false,
}: {
  label: string; name: string; type?: string; placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-brand-grey-700 uppercase tracking-widest mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-800 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red transition-colors"
      />
    </div>
  );
}

function SelectField({
  label, name, options,
}: {
  label: string; name: string; options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-brand-grey-700 uppercase tracking-widest mb-2">
        {label}
      </label>
      <select
        name={name}
        className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-700 focus:outline-none focus:border-brand-red transition-colors bg-white appearance-none cursor-pointer"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}