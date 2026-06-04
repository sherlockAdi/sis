"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight, CheckCircle, ChevronRight, Building2,
  Users, Clock, Shield, BarChart3, Briefcase, Star,
  Phone, Mail, Upload, AlertCircle, Loader2,
} from "lucide-react";

// ── API service import ─────────────────────────────────────────────────────
import {
  fetchCountries,
  fetchStates,
  fetchCities,
  registerEmployer,
  type ApiCountry,
  type ApiState,
  type ApiCity,
} from "@/lib/sisApi";
import CountrySlider from "@/components/ui/CountrySlider";

// ── Types ──────────────────────────────────────────────────────────────────
interface EmployerFormData {
  // Company Info
  companyName:    string;
  website:        string;
  gstin:          string;   // → cr_licence_number
  // Contact Info
  contactName:    string;
  email:          string;
  phone:          string;
  alternatePhone: string;   // → alt_phone
  altEmail:       string;   // → alt_email
  landline:       string;   // → landline
  // Partner ref (optional)
  partnerName:    string;   // → partner_name
  partnerCode:    string;   // → partner_code
  altPartnerName: string;   // → alt_partner_name
  // Address
  addressLine1:   string;   // → address
  addressLine2:   string;   // → address2
  countryId:      number | null;
  stateId:        number | null;
  cityId:         number | null;
  pincode:        string;
  // Agreement
  agreeTerms:     boolean;
  agreePrivacy:   boolean;
}

const INITIAL_FORM: EmployerFormData = {
  companyName: "", website: "", gstin: "",
  contactName: "", email: "", phone: "",
  alternatePhone: "", altEmail: "", landline: "",
  partnerName: "", partnerCode: "", altPartnerName: "",
  addressLine1: "", addressLine2: "",
  countryId: null, stateId: null, cityId: null, pincode: "",
  agreeTerms: false, agreePrivacy: false,
};

// ── Static data ────────────────────────────────────────────────────────────
const WHY_CARDS = [
  { icon: <Users size={22} />,     title: "Pre-Verified Talent",  desc: "Every candidate is background-checked, skill-assessed, and document-verified before being presented to you." },
  { icon: <Clock size={22} />,     title: "48-Hour Shortlisting", desc: "Our pre-built talent pools mean we shortlist qualified candidates within 48 hours of receiving your requirement." },
  { icon: <Shield size={22} />,    title: "Full Compliance",      desc: "We manage PF, ESI, TDS, labour law compliance and act as employer of record for all contract placements." },
  { icon: <BarChart3 size={22} />, title: "Real-Time Reporting",  desc: "Dedicated account managers and weekly dashboards keep you fully informed on placement progress and SLA adherence." },
  { icon: <Briefcase size={22} />, title: "Replacement Guarantee",desc: "Free replacement within 60–90 days if a placed candidate exits for performance reasons." },
  { icon: <Star size={22} />,      title: "Backed by SIS India",  desc: "Leveraging 31+ years of operational excellence and 2,50,000+ workforce managed by SIS India Group." },
];

const STEPS = [
  { id: 1, title: "Register",          desc: "Fill the employer registration form. Our team verifies your account within 24 hours." },
  { id: 2, title: "Share Requirement", desc: "Describe your workforce need — role, skills, location, timeline, and volume."         },
  { id: 3, title: "Review Candidates", desc: "Receive a shortlist of pre-verified, assessed candidates within 48 hours."            },
  { id: 4, title: "Hire & Onboard",    desc: "Conduct interviews, make your selection, and we handle onboarding and compliance."    },
];

// ── Shared field components ────────────────────────────────────────────────
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

/** API-driven select with loading state */
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
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
        style={{ background: "linear-gradient(135deg,#C8102E,#A00D25)", fontFamily: "var(--font-display)" }}
      >
        {step}
      </div>
      <div>
        <h3 className="font-bold text-brand-grey-900 text-base" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
        <p className="text-xs text-brand-grey-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function EmployersPage() {
  const [form,      setForm]      = useState<EmployerFormData>(INITIAL_FORM);
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

  const handleCountryChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value) || null;
      setForm((prev) => ({ ...prev, countryId: id, stateId: null, cityId: null }));
      setStates([]);
      setCities([]);
      if (!id) return;
      setLoadingState(true);
      try { setStates(await fetchStates(id)); }
      catch { /* degrade gracefully */ }
      finally { setLoadingState(false); }
    },
    []
  );

  const handleStateChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value) || null;
      setForm((prev) => ({ ...prev, stateId: id, cityId: null }));
      setCities([]);
      if (!id) return;
      setLoadingCity(true);
      try { setCities(await fetchCities(id)); }
      catch { /* degrade gracefully */ }
      finally { setLoadingCity(false); }
    },
    []
  );

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
      await registerEmployer({
        status:            true,
        organisation_name: form.companyName,
        contact_name:      form.contactName,
        email:             form.email,
        phone:             form.phone,
        alt_phone:         form.alternatePhone  || undefined,
        alt_email:         form.altEmail        || undefined,
        address:           form.addressLine1,
        address2:          form.addressLine2    || undefined,
        city_id:           form.cityId,
        state_id:          form.stateId,
        country_id:        form.countryId,
        pin:               form.pincode,
        website:           form.website         || undefined,
        landline:          form.landline        || undefined,
        cr_licence_number: form.gstin           || undefined,
        partner_name:      form.partnerName     || undefined,
        partner_code:      form.partnerCode     || undefined,
        alt_partner_name:  form.altPartnerName  || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or call us at 0124-4171 888."
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
        <CountrySlider />

        {/* ══════════ WHY SIS ══════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Why Choose Us</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>Why Top Employers Trust SIS Global</h2>
              <div className="section-divider mt-4" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_CARDS.map((c) => (
                <div key={c.title} className="group p-6 rounded-2xl border border-brand-grey-200 hover:border-brand-red/30 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-brand-red" style={{ background: "rgba(200,16,46,0.08)" }}>{c.icon}</div>
                  <h3 className="font-bold text-brand-grey-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>{c.title}</h3>
                  <p className="text-xs text-brand-grey-500 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section className="py-16" style={{ background: "linear-gradient(135deg,#F9F9F9 0%,#F2F2F2 100%)" }}>
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>How It Works</h2>
              <div className="section-divider mt-4" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <div key={step.id} className="relative">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-5 left-full w-full h-px z-0" style={{ background: "linear-gradient(90deg,#C8102E,transparent)" }} />
                  )}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-4 shadow-lg" style={{ background: "linear-gradient(135deg,#C8102E,#A00D25)", fontFamily: "var(--font-display)" }}>
                      {step.id}
                    </div>
                    <h3 className="font-bold text-brand-grey-900 mb-2 text-sm" style={{ fontFamily: "var(--font-display)" }}>{step.title}</h3>
                    <p className="text-xs text-brand-grey-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ REGISTRATION FORM ══════════ */}
        <section id="register" className="py-20" style={{ background: "linear-gradient(160deg,#FAFAFA 0%,#F3F3F3 100%)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-red mb-3 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,16,46,0.08)" }}>Get Started</span>
              <h2 className="text-4xl font-bold text-brand-grey-900" style={{ fontFamily: "var(--font-display)" }}>Employer Registration</h2>
              <p className="text-brand-grey-500 mt-3 text-sm">Complete the form below. Our team will verify and activate your account within 24 hours.</p>
            </div>

            {submitted ? (
              <div className="bg-white rounded-3xl border border-brand-grey-200 p-14 text-center shadow-lg" style={{ borderTop: "4px solid #C8102E" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(200,16,46,0.08)" }}>
                  <CheckCircle size={38} className="text-brand-red" />
                </div>
                <h3 className="text-2xl font-bold text-brand-grey-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>Registration Submitted!</h3>
                <p className="text-brand-grey-500 text-sm leading-relaxed max-w-md mx-auto mb-8">
                  Thank you for registering with SIS Global Workforce Solutions. Our team will review your application and activate your employer account within <strong>24 hours</strong>. You&apos;ll receive a confirmation email at the address provided.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/jobs" className="btn-primary text-sm">Browse Candidates</Link>
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

                {/* ── Section 1: Company Info ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={1} title="Company Information" desc="Tell us about your organisation" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Label required>Company / Organisation Name</Label>
                      <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Corp Pvt. Ltd." required />
                    </div>
                    <div>
                      <Label>Company Website</Label>
                      <Input name="website" value={form.website} onChange={handleChange} placeholder="https://www.company.com" type="url" />
                    </div>
                    <div>
                      <Label>GSTIN</Label>
                      <Input name="gstin" value={form.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Contact Person ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={2} title="Primary Contact Person" desc="Who should we reach out to?" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label required>Full Name</Label>
                      <Input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Rajiv Sharma" required />
                    </div>
                    <div>
                      <Label required>Official Email</Label>
                      <Input name="email" value={form.email} onChange={handleChange} placeholder="rajiv@company.com" type="email" required />
                    </div>
                    <div>
                      <Label required>Mobile Number</Label>
                      <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" required />
                    </div>
                    <div>
                      <Label>Alternate Mobile</Label>
                      <Input name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" />
                    </div>
                    <div>
                      <Label>Alternate Email</Label>
                      <Input name="altEmail" value={form.altEmail} onChange={handleChange} placeholder="alt@company.com" type="email" />
                    </div>
                    <div>
                      <Label>Landline</Label>
                      <Input name="landline" value={form.landline} onChange={handleChange} placeholder="011-XXXXXXXX" type="tel" />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Address ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={3} title="Registered / Office Address" desc="Where are you based?" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Label required>Address Line 1</Label>
                      <Input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Building name, street, locality" required />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Address Line 2</Label>
                      <Input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Area / Landmark (optional)" />
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
                      <Input name="pincode" value={form.pincode} onChange={handleChange} placeholder="122001" required />
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Partner Reference (optional) ── */}
                <div className="px-8 py-8 border-b border-brand-grey-100">
                  <SectionHeader step={4} title="Partner Reference" desc="Were you referred by a SIS Global partner? " />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label required>Partner Name</Label>
                      <Input name="partnerName" value={form.partnerName} onChange={handleChange} placeholder="Referring partner's name" />
                    </div>
                    <div>
                      <Label>Partner Code</Label>
                      <Input name="partnerCode" value={form.partnerCode} onChange={handleChange} placeholder="e.g. SIS-P-00123" />
                    </div>
                    <div>
                      <Label>Alternate Partner Name</Label>
                      <Input name="altPartnerName" value={form.altPartnerName} onChange={handleChange} placeholder="Secondary referring partner (if any)" />
                    </div>
                  </div>
                </div>

                {/* ── Section 5: Consent & Submit ── */}
                <div className="px-8 py-8">
                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} required className="mt-0.5 accent-brand-red w-4 h-4 flex-shrink-0" />
                      <span className="text-xs text-brand-grey-500 leading-relaxed">
                        I agree to the <Link href="/terms" className="text-brand-red hover:underline">Terms of Service</Link> and confirm that the information provided is accurate and complete. <span className="text-brand-red">*</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="agreePrivacy" checked={form.agreePrivacy} onChange={handleChange} required className="mt-0.5 accent-brand-red w-4 h-4 flex-shrink-0" />
                      <span className="text-xs text-brand-grey-500 leading-relaxed">
                        I consent to SIS Global Workforce Solutions contacting me and processing my data per the <Link href="/privacy" className="text-brand-red hover:underline">Privacy Policy</Link>. <span className="text-brand-red">*</span>
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: "#FFF0F2", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}>
                      <AlertCircle size={15} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !form.agreeTerms || !form.agreePrivacy}
                    className="btn-primary w-full justify-center text-sm"
                    style={{ opacity: loading || !form.agreeTerms || !form.agreePrivacy ? 0.7 : 1 }}
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                    ) : (
                      <><Upload size={15} /> Submit Registration</>
                    )}
                  </button>

                  <p className="text-center text-xs text-brand-grey-400 mt-4">
                    Already registered?{" "}
                    <a href="https://sisglobal.neuralinfo.co.in/portal/login/auth?portal=employer" target="_blank" className="text-brand-red hover:underline font-semibold">Sign in to your employer dashboard →</a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ══════════ BOTTOM CTA ══════════ */}
        <section className="py-16 text-white text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg,#C8102E 0%,#A00D25 60%,#7A0A1C 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full border border-white/10" />
            <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full border border-white/10" />
          </div>
          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <Building2 size={34} className="mx-auto mb-4 opacity-70" />
            <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Need Workforce Now?</h2>
            <p className="text-white/70 mb-8 text-base">Skip the form — talk to our sales team directly for same-day consultation.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:01244171888" className="btn-outline !text-white !border-white hover:!bg-white hover:!text-brand-red"><Phone size={15} /> 0124-4171 888</a>
              <a href="mailto:employers@sisglobal.com" className="btn-outline !text-white !border-white/50 hover:!bg-white/20"><Mail size={15} /> employers@sisglobal.com</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}