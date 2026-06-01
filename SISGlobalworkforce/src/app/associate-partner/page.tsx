"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight, CheckCircle, ChevronRight, Globe,
  TrendingUp, Users, Handshake, Award, Shield,
  Phone, Mail, Upload, AlertCircle, Star, DollarSign, Loader2,
} from "lucide-react";

// ── API service import ─────────────────────────────────────────────────────
import {
  fetchCountries,
  fetchStates,
  fetchCities,
  registerAssociatePartner,
  type ApiCountry,
  type ApiState,
  type ApiCity,
} from "@/lib/sisApi";

// ── Types ──────────────────────────────────────────────────────────────────
interface PartnerFormData {
  // Organisation
  orgName:        string;
  orgType:        string;
  industry:       string;
  yearsOps:       string;
  employeeCount:  string;
  website:        string;
  gstin:          string;
  // Contact
  contactName:    string;
  designation:    string;
  email:          string;
  phone:          string;
  alternatePhone: string;
  // Address (text + resolved IDs)
  addressLine1:   string;
  countryId:      number | null;
  stateId:        number | null;
  cityId:         number | null;
  pincode:        string;
  // Partnership
  partnerTypes:   string[];
  geographies:    string[];
  currentClients: string;
  annualRevenue:  string;
  motivation:     string;
  // Agreement
  agreeTerms:     boolean;
  agreePrivacy:   boolean;
}

const INITIAL_FORM: PartnerFormData = {
  orgName: "", orgType: "", industry: "", yearsOps: "", employeeCount: "",
  website: "", gstin: "", contactName: "", designation: "", email: "",
  phone: "", alternatePhone: "", addressLine1: "",
  countryId: null, stateId: null, cityId: null, pincode: "",
  partnerTypes: [], geographies: [],
  currentClients: "", annualRevenue: "", motivation: "",
  agreeTerms: false, agreePrivacy: false,
};

// ── Static data ────────────────────────────────────────────────────────────
const ORG_TYPES     = ["Private Limited", "Public Limited", "LLP", "Partnership", "Proprietorship", "Sole Trader", "Government Body", "NGO / Trust", "Other"];
const INDUSTRIES    = ["Staffing & Recruitment", "Security Services", "Facility Management", "HR Consulting", "IT Services", "Healthcare", "Logistics", "Hospitality", "Training & Development", "Other"];
const YEARS_OPTS    = ["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"];
const EMP_BANDS     = ["1–10", "11–50", "51–200", "201–500", "500+"];
const PARTNER_TYPES = ["Staffing Partner", "Payroll Processing Partner", "Training & Skilling Partner", "Technology Integration Partner", "Sales / Referral Partner", "International Recruitment Partner"];
const GEOGRAPHIES   = ["Delhi NCR", "Mumbai", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Other India", "UAE", "Singapore", "UK", "Australia", "USA", "Other International"];
const REVENUE_OPTS  = ["< ₹50 Lakhs", "₹50L – ₹2 Cr", "₹2 – ₹10 Cr", "₹10 – ₹50 Cr", "₹50 Cr+"];

const BENEFITS = [
  { icon: <DollarSign size={22} />, title: "Revenue Sharing",    desc: "Earn competitive commissions on every successful placement or service delivered through the SIS Global network." },
  { icon: <Globe size={22} />,      title: "National Network",   desc: "Tap into SIS Global's pan-India presence across 22+ states and reach clients you couldn't access independently." },
  { icon: <TrendingUp size={22} />, title: "Business Growth",    desc: "Co-branded marketing materials, joint pitching support, and lead sharing to grow your business faster." },
  { icon: <Award size={22} />,      title: "SIS Certification",  desc: "Gain official SIS Associate Partner certification — a mark of trust recognised by 5,000+ enterprise clients." },
  { icon: <Users size={22} />,      title: "Training & Support", desc: "Access onboarding training, SOPs, compliance resources, and a dedicated partner success manager." },
  { icon: <Shield size={22} />,     title: "Compliance Umbrella",desc: "Operate under SIS India Group's compliance framework, reducing your legal and operational risk." },
];

const PARTNER_TYPES_INFO = [
  { icon: "🤝", type: "Staffing Partner",                   desc: "Source and deploy talent under the SIS Global brand. Ideal for regional recruitment firms and freelance recruiters." },
  { icon: "💰", type: "Payroll Processing Partner",         desc: "Handle payroll and statutory compliance for SIS Global clients. Perfect for HRMS and payroll service providers." },
  { icon: "🎓", type: "Training & Skilling Partner",        desc: "Deliver skill development and certification programs to our workforce pool. Ideal for training institutes and academies." },
  { icon: "💻", type: "Technology Partner",                 desc: "Integrate your HR tech, ATS, or workforce management platform into the SIS ecosystem." },
  { icon: "📣", type: "Sales / Referral Partner",           desc: "Refer employer clients and earn referral fees with zero operational responsibility." },
  { icon: "✈️", type: "International Recruitment Partner",  desc: "Source overseas talent for SIS Global clients. Ideal for agencies in UAE, Singapore, UK, Australia, and more." },
];

const TESTIMONIALS = [
  { name: "Pradeep Nair",   org: "Nair Staffing Solutions, Kochi",   quote: "Partnering with SIS Global doubled our client base in 8 months. The co-branded credibility opened doors we never could before.",   rating: 5 },
  { name: "Meera Joshi",    org: "TalentFirst HR, Pune",             quote: "The compliance support alone was worth it. We stopped worrying about PF and ESI and focused entirely on recruitment.",              rating: 5 },
  { name: "Aarav Malhotra", org: "GulfConnect Recruiters, Dubai",    quote: "As an international partner, SIS Global gave us access to Indian employers who needed Gulf-ready talent. Excellent collaboration.", rating: 5 },
];

// ── Shared UI ──────────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-brand-grey-700 uppercase tracking-widest mb-2">
      {children}{required && <span className="text-brand-red ml-0.5">*</span>}
    </label>
  );
}

function Input({ name, value, onChange, placeholder, type = "text", required = false }: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-800 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red transition-colors bg-white"
    />
  );
}

function StaticSelect({ name, value, onChange, options, placeholder, required = false }: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; placeholder: string; required?: boolean;
}) {
  return (
    <select
      name={name} value={value} onChange={onChange} required={required}
      className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-700 focus:outline-none focus:border-brand-red transition-colors bg-white appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ApiSelect<T extends { value: number; label: string }>({
  name, value, onChange, options, placeholder, loading, disabled, required = false,
}: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: T[]; placeholder: string; loading?: boolean; disabled?: boolean; required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name={name} value={value} onChange={onChange} required={required}
        disabled={disabled || loading}
        className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-700 focus:outline-none focus:border-brand-red transition-colors bg-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? "Loading…" : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
      {loading && (
        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-grey-400 pointer-events-none" />
      )}
    </div>
  );
}

function SectionHeader({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-5 border-b border-brand-grey-100">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white" style={{ background: "linear-gradient(135deg,#C8102E,#A00D25)", fontFamily: "var(--font-display)" }}>
        {step}
      </div>
      <div>
        <h3 className="font-bold text-brand-grey-900 text-base" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
        <p className="text-xs text-brand-grey-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function MultiSelectPills({ options, selected, onToggle, cols = 2 }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; cols?: number;
}) {
  return (
    <div className={`grid grid-cols-2 ${cols === 3 ? "sm:grid-cols-3" : ""} gap-2 mt-1`}>
      {options.map((o) => {
        const checked = selected.includes(o);
        return (
          <button
            key={o} type="button" onClick={() => onToggle(o)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all duration-200"
            style={{ background: checked ? "rgba(200,16,46,0.07)" : "#FAFAFA", borderColor: checked ? "#C8102E" : "#E5E5E5", color: checked ? "#C8102E" : "#737373" }}
          >
            <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: checked ? "#C8102E" : "#D0D0D0", background: checked ? "#C8102E" : "transparent" }}>
              {checked && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
            </div>
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AssociatePartnerPage() {
  const [form,      setForm]      = useState<PartnerFormData>(INITIAL_FORM);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  // ── Location state ────────────────────────────────────────────────────
  const [countries,      setCountries]      = useState<ApiCountry[]>([]);
  const [states,         setStates]         = useState<ApiState[]>([]);
  const [cities,         setCities]         = useState<ApiCity[]>([]);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [loadingState,   setLoadingState]   = useState(false);
  const [loadingCity,    setLoadingCity]    = useState(false);

  const countryOptions = countries.map((c) => ({ value: c.country_id, label: c.country_name }));
  const stateOptions   = states.map((s)   => ({ value: s.state_id,   label: s.state_name   }));
  const cityOptions    = cities.map((c)   => ({ value: c.city_id,    label: c.city_name    }));

  useEffect(() => {
    setLoadingCountry(true);
    fetchCountries()
      .then(setCountries)
      .catch(() => {})
      .finally(() => setLoadingCountry(false));
  }, []);

  const handleCountryChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || null;
    setForm((prev) => ({ ...prev, countryId: id, stateId: null, cityId: null }));
    setStates([]);
    setCities([]);
    if (!id) return;
    setLoadingState(true);
    try { setStates(await fetchStates(id)); }
    catch { /* degrade */ }
    finally { setLoadingState(false); }
  }, []);

  const handleStateChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value) || null;
    setForm((prev) => ({ ...prev, stateId: id, cityId: null }));
    setCities([]);
    if (!id) return;
    setLoadingCity(true);
    try { setCities(await fetchCities(id)); }
    catch { /* degrade */ }
    finally { setLoadingCity(false); }
  }, []);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, cityId: Number(e.target.value) || null }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggle = (field: "partnerTypes" | "geographies", val: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? (prev[field] as string[]).filter((v) => v !== val)
        : [...(prev[field] as string[]), val],
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.countryId || !form.stateId || !form.cityId) {
      setError("Please select a valid country, state, and city.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await registerAssociatePartner({
        status:            true,
        organisation_name: form.orgName,
        primary_contact:   form.contactName,
        email:             form.email,
        alternate_contact: form.alternatePhone || undefined,
        address1:          form.addressLine1,
        city_id:           form.cityId,
        state_id:          form.stateId,
        country_id:        form.countryId,
        pin:               form.pincode,
        other_info:        JSON.stringify({
          org_type:        form.orgType,
          industry:        form.industry,
          years_ops:       form.yearsOps,
          employee_count:  form.employeeCount,
          website:         form.website,
          gstin:           form.gstin,
          designation:     form.designation,
          partner_types:   form.partnerTypes,
          geographies:     form.geographies,
          current_clients: form.currentClients,
          annual_revenue:  form.annualRevenue,
          motivation:      form.motivation,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or email partners@sisglobal.com."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main>

        {/* ══════════ HERO ══════════ */}
        <section className="relative overflow-hidden bg-brand-grey-900 text-white">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full border border-white/5" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border border-brand-red/10" />
            <div className="absolute right-0 top-0 w-1/2 h-full" style={{ background: "radial-gradient(ellipse 60% 80% at 90% 30%, rgba(200,16,46,0.16) 0%, transparent 70%)" }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={11} />
              <span className="text-white/70">Associate Partner Programme</span>
            </div>

            <div className="grid md:grid-cols-2 gap-14 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(200,16,46,0.2)", color: "#FF6B7A", border: "1px solid rgba(200,16,46,0.3)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                  Grow Together
                </span>
                <h1 className="text-5xl md:text-6xl font-bold leading-[1.04] mb-5" style={{ fontFamily: "var(--font-display)" }}>
                  Become an <span className="text-brand-red">Associate Partner</span>
                </h1>
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  Join India&apos;s largest workforce solutions network. Co-brand with SIS Global, expand your reach, earn competitive commissions, and grow your business under a trusted 31-year legacy.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#partner-form" className="btn-primary">Apply Now <ArrowRight size={15} /></a>
                  <a href="tel:01244171888" className="flex items-center gap-2 px-5 py-3 border border-white/25 text-white/80 text-sm font-semibold rounded hover:border-white/60 hover:text-white transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                    <Phone size={14} /> Talk to Us
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "500+", label: "Active Partners" },
                  { value: "31+",  label: "Years of Trust"  },
                  { value: "22+",  label: "States Covered"  },
                  { value: "8+",   label: "Countries"       },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>{s.value}</div>
                    <div className="text-xs text-white/50 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ PARTNER TYPES ══════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Partner Types</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>Find Your Partnership Model</h2>
              <p className="text-brand-grey-500 mt-3 max-w-xl mx-auto text-sm">We offer flexible models depending on your business type and capabilities</p>
              <div className="section-divider mt-5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PARTNER_TYPES_INFO.map((p) => (
                <div key={p.type} className="group p-6 rounded-2xl border border-brand-grey-200 hover:border-brand-red/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl mb-4">{p.icon}</div>
                  <h3 className="font-bold text-brand-grey-900 mb-2 text-sm" style={{ fontFamily: "var(--font-display)" }}>{p.type}</h3>
                  <p className="text-xs text-brand-grey-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ BENEFITS ══════════ */}
        <section className="py-20" style={{ background: "linear-gradient(135deg,#F9F9F9 0%,#F2F2F2 100%)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Partner Benefits</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>What You Get as a Partner</h2>
              <div className="section-divider mt-5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="group p-6 rounded-2xl bg-white border border-brand-grey-200 hover:border-brand-red/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-brand-red" style={{ background: "rgba(200,16,46,0.08)" }}>{b.icon}</div>
                  <h3 className="font-bold text-brand-grey-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>{b.title}</h3>
                  <p className="text-xs text-brand-grey-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ TESTIMONIALS ══════════ */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>What Our Partners Say</h2>
              <div className="section-divider mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="p-6 rounded-2xl border border-brand-grey-200 hover:border-brand-red/20 hover:shadow-md transition-all">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={14} className="text-brand-red fill-brand-red" />
                    ))}
                  </div>
                  <p className="text-sm text-brand-grey-600 leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: "#C8102E", fontFamily: "var(--font-display)" }}>
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-brand-grey-900">{t.name}</p>
                      <p className="text-[11px] text-brand-grey-400">{t.org}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ REGISTRATION FORM ══════════ */}
        <section id="partner-form" className="py-20" style={{ background: "linear-gradient(160deg,#FAFAFA 0%,#F3F3F3 100%)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Apply Now</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>Partner Registration</h2>
              <p className="text-brand-grey-500 mt-3 text-sm">Complete your application below. Our partnerships team reviews all applications within 48 hours.</p>
            </div>

            {submitted ? (
              <div className="bg-white rounded-3xl border border-brand-grey-200 p-14 text-center shadow-lg" style={{ borderTop: "4px solid #C8102E" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(200,16,46,0.08)" }}>
                  <Handshake size={36} className="text-brand-red" />
                </div>
                <h3 className="text-2xl font-bold text-brand-grey-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>Application Received!</h3>
                <p className="text-brand-grey-500 text-sm leading-relaxed max-w-md mx-auto mb-8">
                  Thank you for applying to the SIS Global Associate Partner Programme. Our partnerships team will review your application and contact you within <strong>48 hours</strong> to discuss next steps.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/" className="btn-primary text-sm">Go to Homepage</Link>
                  <button
                    onClick={() => { setForm(INITIAL_FORM); setSubmitted(false); setStates([]); setCities([]); }}
                    className="px-5 py-2.5 border border-brand-grey-300 text-brand-grey-700 text-sm font-semibold rounded hover:border-brand-red hover:text-brand-red transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Submit Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-brand-grey-200 overflow-hidden shadow-xl" style={{ borderTop: "4px solid #C8102E" }}>

                {/* ── Section 1: Organisation ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={1} title="Your Organisation" desc="Tell us about your business" />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Label required>Organisation / Company Name</Label>
                      <Input name="orgName" value={form.orgName} onChange={handleChange} placeholder="Your Company Pvt. Ltd." required />
                    </div>
                    <div>
                      <Label required>Organisation Type</Label>
                      <StaticSelect name="orgType" value={form.orgType} onChange={handleChange} options={ORG_TYPES} placeholder="Select type…" required />
                    </div>
                    <div>
                      <Label required>Primary Industry</Label>
                      <StaticSelect name="industry" value={form.industry} onChange={handleChange} options={INDUSTRIES} placeholder="Select industry…" required />
                    </div>
                    <div>
                      <Label required>Years in Operation</Label>
                      <StaticSelect name="yearsOps" value={form.yearsOps} onChange={handleChange} options={YEARS_OPTS} placeholder="Select…" required />
                    </div>
                    <div>
                      <Label>Team Size</Label>
                      <StaticSelect name="employeeCount" value={form.employeeCount} onChange={handleChange} options={EMP_BANDS} placeholder="Select band…" />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input name="website" value={form.website} onChange={handleChange} placeholder="https://www.yourcompany.com" type="url" />
                    </div>
                    <div>
                      <Label>GSTIN</Label>
                      <Input name="gstin" value={form.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Contact ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={2} title="Primary Contact" desc="Who will manage this partnership?" />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label required>Full Name</Label>
                      <Input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Your name" required />
                    </div>
                    <div>
                      <Label required>Designation</Label>
                      <Input name="designation" value={form.designation} onChange={handleChange} placeholder="Director / Partner / Head" required />
                    </div>
                    <div>
                      <Label required>Official Email</Label>
                      <Input name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" type="email" required />
                    </div>
                    <div>
                      <Label required>Mobile Number</Label>
                      <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" required />
                    </div>
                    <div>
                      <Label>Alternate Phone</Label>
                      <Input name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Address (API cascading) ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={3} title="Office Address" desc="Where is your primary office located?" />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Label required>Address</Label>
                      <Input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Building, street, locality" required />
                    </div>

                    <div>
                      <Label required>Country</Label>
                      <ApiSelect
                        name="countryId"
                        value={form.countryId ? String(form.countryId) : ""}
                        onChange={handleCountryChange}
                        options={countryOptions}
                        placeholder="Select country…"
                        loading={loadingCountry}
                        required
                      />
                    </div>
                    <div>
                      <Label required>State</Label>
                      <ApiSelect
                        name="stateId"
                        value={form.stateId ? String(form.stateId) : ""}
                        onChange={handleStateChange}
                        options={stateOptions}
                        placeholder={form.countryId ? "Select state…" : "Select country first"}
                        loading={loadingState}
                        disabled={!form.countryId}
                        required
                      />
                    </div>
                    <div>
                      <Label required>City</Label>
                      <ApiSelect
                        name="cityId"
                        value={form.cityId ? String(form.cityId) : ""}
                        onChange={handleCityChange}
                        options={cityOptions}
                        placeholder={form.stateId ? "Select city…" : "Select state first"}
                        loading={loadingCity}
                        disabled={!form.stateId}
                        required
                      />
                    </div>
                    <div>
                      <Label required>PIN Code</Label>
                      <Input name="pincode" value={form.pincode} onChange={handleChange} placeholder="110001" required />
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Partnership Details ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={4} title="Partnership Details" desc="Tell us how you'd like to work together" />
                  <div className="space-y-5">
                    <div>
                      <Label required>Partnership Model(s) Interested In</Label>
                      <MultiSelectPills options={PARTNER_TYPES} selected={form.partnerTypes} onToggle={(v) => toggle("partnerTypes", v)} />
                    </div>
                    <div>
                      <Label>Geographies You Operate In</Label>
                      <MultiSelectPills options={GEOGRAPHIES} selected={form.geographies} onToggle={(v) => toggle("geographies", v)} cols={3} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <Label>Current Client Base</Label>
                        <Input name="currentClients" value={form.currentClients} onChange={handleChange} placeholder="e.g. 30 corporate clients" />
                      </div>
                      <div>
                        <Label>Annual Revenue</Label>
                        <StaticSelect name="annualRevenue" value={form.annualRevenue} onChange={handleChange} options={REVENUE_OPTS} placeholder="Select range…" />
                      </div>
                    </div>
                    <div>
                      <Label>Why do you want to partner with SIS Global?</Label>
                      <textarea
                        name="motivation" value={form.motivation} onChange={handleChange} rows={4}
                        placeholder="Share your goals, current capabilities, and what you hope to achieve through this partnership…"
                        className="w-full px-4 py-3 border border-brand-grey-200 rounded-xl text-sm text-brand-grey-800 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red resize-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 5: Submit ── */}
                <div className="px-8 py-8">
                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} required className="mt-0.5 accent-brand-red w-4 h-4 flex-shrink-0" />
                      <span className="text-xs text-brand-grey-500 leading-relaxed">
                        I agree to the <Link href="/terms" className="text-brand-red hover:underline">Terms of Service</Link> and confirm all information is accurate. <span className="text-brand-red">*</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="agreePrivacy" checked={form.agreePrivacy} onChange={handleChange} required className="mt-0.5 accent-brand-red w-4 h-4 flex-shrink-0" />
                      <span className="text-xs text-brand-grey-500 leading-relaxed">
                        I consent to SIS Global processing my data per the <Link href="/privacy" className="text-brand-red hover:underline">Privacy Policy</Link>. <span className="text-brand-red">*</span>
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: "#FFF0F2", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}>
                      <AlertCircle size={15} className="flex-shrink-0" />{error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !form.agreeTerms || !form.agreePrivacy}
                    className="btn-primary w-full justify-center text-sm"
                    style={{ opacity: loading || !form.agreeTerms || !form.agreePrivacy ? 0.7 : 1 }}
                  >
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                    ) : (
                      <><Upload size={15} /> Submit Partner Application</>
                    )}
                  </button>

                  <p className="text-center text-xs text-brand-grey-400 mt-4">
                    Questions before applying?{" "}
                    <a href="mailto:partners@sisglobal.com" className="text-brand-red hover:underline font-semibold">Email our partnerships team →</a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section className="py-16 text-white text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg,#C8102E 0%,#A00D25 60%,#7A0A1C 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full border border-white/10" />
            <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full border border-white/10" />
          </div>
          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <Handshake size={34} className="mx-auto mb-4 opacity-70" />
            <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Ready to Grow Together?</h2>
            <p className="text-white/70 mb-8 text-base">Call our partnerships team for a direct conversation — we&apos;ll find the right model for your business.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:01244171888" className="btn-outline !text-white !border-white hover:!bg-white hover:!text-brand-red"><Phone size={15} /> 0124-4171 888</a>
              <a href="mailto:partners@sisglobal.com" className="btn-outline !text-white !border-white/50 hover:!bg-white/20"><Mail size={15} /> partners@sisglobal.com</a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}