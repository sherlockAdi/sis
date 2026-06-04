import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Building2,
  CheckCircle,
  Star,
  ArrowRight,
  Share2,
  Bookmark,
  ChevronRight,
} from "lucide-react";

interface JobDetail {
  id: number;
  title: string;
  company: string;
  logo: string;
  logoColor: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  category: string;
  experience: number | string;
  urgent: boolean;
  featured: boolean;
  description: string;
  compensation: string;
  jobCode: string;
  status: string;
  vacancy: number;
  documents: Array<{ id?: number; document_name: string; is_required: boolean }>;
  jobSpecificDocuments: Array<{ id?: number; document_name: string; is_required: boolean }>;
  tags: string[];
}

async function getJob(id: string): Promise<{ job: JobDetail } | null> {
  try {
    const res = await fetch(
      `https://sisglobalapi.neuralinfo.co.in/public/jobs/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const j = data.job;

    const job: JobDetail = {
      id:          j.job_id,
      title:       j.job_title,
      company:     j.category_name || "Company",
      logo:        j.job_title?.charAt(0) || "J",
      logoColor:   "#C8102E",
      location:    data.locations?.[0]?.city_name || j.country_name || "—",
      type:        j.employment_type_name || "Full Time",
      salary:      `${j.salary_min} – ${j.salary_max}`,
      posted:      new Date(j.created_at).toLocaleDateString("en-IN", {
                     day: "numeric", month: "short", year: "numeric",
                   }),
      category:    j.category_name || "",
      experience:  j.min_experience || "Not specified",
      urgent:      false,
      featured:    false,
      description: j.job_description || "",
      compensation: j.compensation_text || "",
      jobCode:     j.job_code || "—",
      status:      j.status || "Open",
      vacancy:     j.vacancy || 1,
      documents:   data.documents || [],
      jobSpecificDocuments: data.job_specific_documents || [],
      tags:        [],
    };

    return { job };
  } catch {
    return null;
  }
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Full Time": { bg: "#E7F9ED", color: "#0BA02C" },
  Remote:      { bg: "#E8F1FB", color: "#0A65CC" },
  Hybrid:      { bg: "#FFF8EC", color: "#FFB836" },
  Contract:    { bg: "#F5F0FF", color: "#7B3FE4" },
};

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getJob(params.id);
  if (!result) notFound();

  const { job } = result;
  const tc = TYPE_COLORS[job.type] || TYPE_COLORS["Full Time"];
  const allDocs = [...job.documents, ...job.jobSpecificDocuments];

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero strip ── */}
        <div
          style={{
            background:
              "linear-gradient(135deg,#FFF5F6 0%,#FFF0F2 60%,#F9F9F9 100%)",
            borderBottom: "1px solid #E5E5E5",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-8">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-brand-grey-500 mb-5">
              <Link href="/" className="hover:text-brand-red transition-colors">
                Home
              </Link>
              <ChevronRight size={12} />
              <Link
                href="/jobs"
                className="hover:text-brand-red transition-colors"
              >
                Find Jobs
              </Link>
              <ChevronRight size={12} />
              <span className="text-brand-grey-800 font-medium truncate max-w-[200px]">
                {job.title}
              </span>
            </div>

            {/* Job header card */}
            <div
              className="bg-white border border-brand-grey-200 rounded-2xl p-6 flex items-start gap-5 flex-wrap shadow-sm"
              style={{ borderTop: "4px solid #C8102E" }}
            >
              {/* Logo */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
                style={{
                  background: job.logoColor + "12",
                  color: job.logoColor,
                  fontFamily: "var(--font-display)",
                }}
              >
                {job.logo}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {job.urgent && (
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: "#FFF0F2", color: "#C8102E" }}
                    >
                      🔥 URGENT
                    </span>
                  )}
                  <span
                    className="text-xs font-semibold px-3 py-0.5 rounded-full"
                    style={{ background: tc.bg, color: tc.color }}
                  >
                    {job.type}
                  </span>
                  <span
                    className="text-xs font-semibold px-3 py-0.5 rounded-full"
                    style={{ background: "#F0FFF4", color: "#0BA02C" }}
                  >
                    {job.status}
                  </span>
                </div>

                <h1
                  className="text-2xl md:text-3xl font-bold text-brand-grey-900 mb-2 leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {job.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-brand-grey-600">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-brand-red" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-brand-red" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-brand-red" />
                    {job.salary}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-brand-red" />
                    Posted {job.posted}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button className="w-9 h-9 rounded-lg border border-brand-grey-200 flex items-center justify-center text-brand-grey-500 hover:border-brand-red hover:text-brand-red transition-colors">
                  <Bookmark size={15} />
                </button>
                <button className="w-9 h-9 rounded-lg border border-brand-grey-200 flex items-center justify-center text-brand-grey-500 hover:border-brand-red hover:text-brand-red transition-colors">
                  <Share2 size={15} />
                </button>
                {/* Scrolls to #apply form */}
                <a
                  href="#apply"
                  className="btn-primary !py-2.5 !px-6 text-sm flex items-center gap-1.5"
                >
                  Apply Now <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

            {/* Left column */}
            <div className="flex flex-col gap-8">

              {/* Job Description */}
              <ContentCard
                title="Job Description"
                icon={<Briefcase size={16} className="text-brand-red" />}
              >
                <div
                  className="prose prose-sm max-w-none text-brand-grey-600 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: job.description || "<p>Description not available.</p>",
                  }}
                />
              </ContentCard>

              {/* Key Responsibilities */}
              {job.compensation && (
                <ContentCard
                  title="Key Responsibilities"
                  icon={<CheckCircle size={16} className="text-brand-red" />}
                >
                  <div
                    className="prose prose-sm max-w-none text-brand-grey-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: job.compensation }}
                  />
                </ContentCard>
              )}

              {/* ── Apply form (anchor target) ── */}
              <div
                id="apply"
                className="bg-white border border-brand-grey-200 rounded-2xl overflow-hidden shadow-sm scroll-mt-24"
                style={{ borderTop: "4px solid #C8102E" }}
              >
                <div
                  className="px-6 py-5 border-b border-brand-grey-100"
                  style={{ background: "#FFF5F6" }}
                >
                  <h2
                    className="text-xl font-bold text-brand-grey-900"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Apply for This Position
                  </h2>
                  <p className="text-sm text-brand-grey-500 mt-1">
                    Submit your application for{" "}
                    <strong>{job.title}</strong> · Job Code: {job.jobCode}
                  </p>
                </div>

                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <FormField label="Full Name"           placeholder="Your full name" />
                    <FormField label="Email"               placeholder="you@email.com" type="email" />
                    <FormField label="Phone"               placeholder="+91 XXXXX XXXXX" />
                    <FormField label="Years of Experience" placeholder="e.g. 3" />
                  </div>
                  <FormField
                    label="Cover Letter"
                    placeholder="Tell us why you're a great fit…"
                    textarea
                  />

                  {allDocs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-brand-grey-800 mb-3">
                        Required Documents
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {allDocs.map((doc, i) => (
                          <label key={i} className="block">
                            <span className="text-xs text-brand-grey-600 mb-1 block">
                              {doc.document_name}
                              {doc.is_required && (
                                <span className="text-brand-red ml-1">*</span>
                              )}
                            </span>
                            <input
                              type="file"
                              className="w-full text-xs border border-brand-grey-200 rounded px-3 py-2 text-brand-grey-600 file:mr-3 file:py-1 file:px-3 file:border-0 file:rounded file:text-xs file:font-semibold file:bg-red-50 file:text-brand-red hover:file:bg-red-100"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="btn-primary mt-5 text-sm flex items-center gap-1.5">
                    Submit Application <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-5">

              <SidebarCard title="Job Overview">
                {[
                  { label: "Job Code",   value: job.jobCode,            icon: "🔖" },
                  { label: "Posted On",  value: job.posted,             icon: "📅" },
                  { label: "Job Type",   value: job.type,               icon: "💼" },
                  { label: "Salary",     value: job.salary,             icon: "💰" },
                  { label: "Category",   value: job.category,           icon: "🏷️" },
                  { label: "Experience", value: String(job.experience), icon: "📊" },
                  { label: "Location",   value: job.location,           icon: "📍" },
                  { label: "Vacancies",  value: String(job.vacancy),    icon: "👥" },
                  { label: "Status",     value: job.status,             icon: "🟢" },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2.5 border-b border-brand-grey-100 last:border-0"
                  >
                    <span className="text-xs text-brand-grey-500 flex items-center gap-1.5">
                      <span>{icon}</span>
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-brand-grey-800 text-right max-w-[140px] truncate">
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </SidebarCard>

              {allDocs.length > 0 && (
                <SidebarCard title="Required Documents">
                  <div className="flex flex-wrap gap-2">
                    {allDocs.map((doc, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-full border font-medium"
                        style={{
                          background:  doc.is_required ? "#FFF0F2" : "#F5F5F5",
                          color:       doc.is_required ? "#C8102E" : "#525252",
                          borderColor: doc.is_required
                            ? "rgba(200,16,46,0.2)"
                            : "#E0E0E0",
                        }}
                      >
                        {doc.document_name}
                        <span className="ml-1 opacity-60">
                          ({doc.is_required ? "Req" : "Opt"})
                        </span>
                      </span>
                    ))}
                  </div>
                </SidebarCard>
              )}

              {/* CTA card */}
              <div
                className="rounded-2xl p-5 text-white text-center"
                style={{
                  background: "linear-gradient(135deg,#C8102E 0%,#900B20 100%)",
                }}
              >
                <Star size={22} className="mx-auto mb-2 opacity-80" />
                <p
                  className="font-bold text-base mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Interested in this role?
                </p>
                <p className="text-white/70 text-xs mb-4 leading-relaxed">
                  Don&apos;t miss out — apply before positions are filled.
                </p>
                {/* Scrolls to #apply form */}
                <a
                  href="#apply"
                  className="block w-full py-2.5 rounded-lg bg-white text-brand-red text-sm font-bold hover:bg-brand-grey-50 transition-colors"
                >
                  Apply Now →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ── Sub-components ── */

function ContentCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-brand-grey-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-brand-grey-100">
        {icon}
        <h2
          className="font-bold text-brand-grey-900"
          style={{ fontFamily: "var(--font-display)", fontSize: 16 }}
        >
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-brand-grey-200 rounded-xl p-5 shadow-sm">
      <h3
        className="font-bold text-brand-grey-900 mb-4 pb-3 border-b border-brand-grey-100"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          letterSpacing: "0.03em",
        }}
      >
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
  textarea = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div className={textarea ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-brand-grey-700 mb-1.5">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={4}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 border border-brand-grey-200 rounded text-sm text-brand-grey-700 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red resize-none"
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 border border-brand-grey-200 rounded text-sm text-brand-grey-700 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red"
        />
      )}
    </div>
  );
}