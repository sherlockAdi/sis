import Link from "next/link";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JobFilters from "@/components/ui/JobFilters";
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Search,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  logoColor: string;
  location: string;
  type: string;
  salary: string;
  tags: string[];
  posted: string;
  urgent: boolean;
  category: string;
  experience: number;
  featured: boolean;
}

async function getJobs(
  searchParams: Record<string, string>
): Promise<{ jobs: Job[]; total: number }> {
  try {
    const res = await fetch(
      "https://sisglobalapi.neuralinfo.co.in/public/jobs/preview?status=Open",
      { cache: "no-store" }
    );
    const data = await res.json();

    let jobs: Job[] = data.map((j: Record<string, unknown>) => ({
      id: j.job_id,
      title: j.job_title,
      company: (j.category_name as string) || "Company",
      logo: ((j.job_title as string)?.charAt(0)) || "J",
      logoColor: "#C8102E",
      location: j.country_name,
      type: (j.employment_type_name as string) || "Full Time",
      salary: `${j.salary_min} – ${j.salary_max}`,
      tags: [],
      posted: new Date(j.created_at as string).toLocaleDateString(),
      urgent: false,
      category: (j.category_name as string) || "",
      experience: j.min_experience ? Number(j.min_experience) : 0,
      featured: false,
    }));

    const { q, location, category, types } = searchParams;
    if (q)
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q.toLowerCase()) ||
          j.company.toLowerCase().includes(q.toLowerCase())
      );
    if (location)
      jobs = jobs.filter((j) =>
        j.location?.toLowerCase().includes(location.toLowerCase())
      );
    if (category) {
      const cats = category.split(",").map((c) => c.toLowerCase());
      jobs = jobs.filter((j) => cats.includes(j.category?.toLowerCase()));
    }
    if (types) {
      const typeList = types.split(",").map((t) => t.toLowerCase());
      jobs = jobs.filter((j) => typeList.includes(j.type?.toLowerCase()));
    }

    return { jobs, total: jobs.length };
  } catch {
    return { jobs: [], total: 0 };
  }
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Full Time": { bg: "#E7F9ED", color: "#0BA02C" },
  Remote:      { bg: "#E8F1FB", color: "#0A65CC" },
  Hybrid:      { bg: "#FFF8EC", color: "#FFB836" },
  Contract:    { bg: "#F5F0FF", color: "#7B3FE4" },
};

const JOB_TYPES    = ["Full Time", "Remote", "Hybrid", "Contract"];
const SORT_OPTIONS = ["Newest First", "Salary: High to Low", "Salary: Low to High"];

export default async function FindJobsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const { jobs, total } = await getJobs(searchParams);
  const { q, type } = searchParams;

  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ── */}
        <div
          style={{
            background:
              "linear-gradient(135deg,#FFF5F6 0%,#FFF0F2 60%,#F9F9F9 100%)",
            borderBottom: "1px solid #E5E5E5",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-brand-grey-500 mb-4">
              <Link href="/" className="hover:text-brand-red transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-brand-grey-800 font-medium">Find Jobs</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1
                  className="text-3xl md:text-4xl font-bold text-brand-grey-900 mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {q ? `Results for "${q}"` : "Browse All Jobs"}
                </h1>
                <p className="text-brand-grey-500 text-sm">
                  Showing{" "}
                  <strong className="text-brand-grey-800">{total}</strong> open
                  positions
                </p>
              </div>

              <form
                method="GET"
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <div className="relative flex-1 md:w-72">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400"
                  />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Job title or keyword…"
                    className="w-full pl-9 pr-4 py-2.5 border border-brand-grey-300 text-sm rounded focus:outline-none focus:border-brand-red"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary !py-2.5 !px-5 text-sm"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Type pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              <Link
                href="/jobs"
                className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={
                  !type
                    ? { background: "#C8102E", color: "white", borderColor: "#C8102E" }
                    : { background: "white", color: "#525252", borderColor: "#E0E0E0" }
                }
              >
                All Types
              </Link>
              {JOB_TYPES.map((t) => (
                <Link
                  key={t}
                  href={`/jobs?${q ? `q=${q}&` : ""}type=${encodeURIComponent(t)}`}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                  style={
                    type === t
                      ? { background: "#C8102E", color: "white", borderColor: "#C8102E" }
                      : { background: "white", color: "#525252", borderColor: "#E0E0E0" }
                  }
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

            {/* Sidebar */}
            <aside>
              <Suspense
                fallback={
                  <div className="bg-white border border-brand-grey-200 rounded-xl p-5 h-96 animate-pulse" />
                }
              >
                <JobFilters />
              </Suspense>
            </aside>

            {/* Job list */}
            <div>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <p className="text-sm text-brand-grey-500">
                  <strong className="text-brand-grey-900">{total}</strong> jobs
                  found
                </p>
                <div className="relative">
                  <select className="pl-3 pr-8 py-2 border border-brand-grey-200 text-sm text-brand-grey-700 rounded appearance-none focus:outline-none focus:border-brand-red bg-white cursor-pointer">
                    {SORT_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400 pointer-events-none"
                  />
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-24 text-brand-grey-400">
                  <Briefcase size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-semibold text-brand-grey-600">
                    No jobs found
                  </p>
                  <p className="text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {jobs.map((job) => {
                    const tc =
                      TYPE_COLORS[job.type] || TYPE_COLORS["Full Time"];
                    return (
                      <div
                        key={job.id}
                        className="group bg-white border border-brand-grey-200 rounded-xl p-5 hover:border-brand-red/40 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          {/* Logo */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                            style={{
                              background: job.logoColor + "15",
                              color: job.logoColor,
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {job.logo}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {job.urgent && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    background: "#FFF0F2",
                                    color: "#C8102E",
                                  }}
                                >
                                  🔥 URGENT
                                </span>
                              )}
                              <span
                                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                                style={{ background: tc.bg, color: tc.color }}
                              >
                                {job.type}
                              </span>
                            </div>

                            <Link href={`/jobs/${job.id}`}>
                              <h3
                                className="font-bold text-brand-grey-900 text-base group-hover:text-brand-red transition-colors mb-1 truncate cursor-pointer"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {job.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-brand-grey-500 mb-3">
                              {job.company}
                            </p>

                            <div className="flex flex-wrap gap-4 text-xs text-brand-grey-500">
                              <span className="flex items-center gap-1">
                                <MapPin
                                  size={12}
                                  className="text-brand-red flex-shrink-0"
                                />{" "}
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign
                                  size={12}
                                  className="text-brand-red flex-shrink-0"
                                />{" "}
                                {job.salary}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock
                                  size={12}
                                  className="text-brand-red flex-shrink-0"
                                />{" "}
                                {job.posted}
                              </span>
                            </div>
                          </div>

                          {/* Apply button — links to /jobs/[id]#apply */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-2">
                            <Link
                              href={`/jobs/${job.id}#apply`}
                              className="btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5 whitespace-nowrap"
                            >
                              Apply Now <ArrowRight size={12} />
                            </Link>
                            <Link
                              href={`/jobs/${job.id}`}
                              className="text-xs text-brand-grey-400 hover:text-brand-red transition-colors"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {[1, 2, 3, "...", Math.ceil(total / 20)].map((p, i) => (
                    <button
                      key={i}
                      className="w-9 h-9 rounded text-sm font-semibold transition-colors"
                      style={
                        p === 1
                          ? { background: "#C8102E", color: "white" }
                          : {
                              background: "white",
                              color: "#525252",
                              border: "1px solid #E0E0E0",
                            }
                      }
                    >
                      {p}
                    </button>
                  ))}
                  <button className="px-4 h-9 rounded text-sm font-semibold border border-brand-grey-200 text-brand-grey-700 hover:border-brand-red hover:text-brand-red transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}