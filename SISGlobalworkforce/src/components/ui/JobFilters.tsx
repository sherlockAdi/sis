"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

const JOB_TYPES = ["Full Time", "Part Time", "Remote", "Hybrid", "Contract"];
const EXPERIENCE = ["0–2 Years", "2–5 Years", "5–10 Years", "10+ Years"];
const SALARY_RANGES = ["$0 – $30k", "$30k – $60k", "$60k – $100k", "$100k+"];

interface Category {
  name: string;
  count: number;
}

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [types, setTypes] = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) || []
  );
  const [exp, setExp] = useState<string[]>(
    searchParams.get("experience")?.split(",").filter(Boolean) || []
  );
  const [salary, setSalary] = useState<string[]>(
    searchParams.get("salary")?.split(",").filter(Boolean) || []
  );
  const [selectedCategory, setSelectedCategory] = useState<string[]>(
    searchParams.get("category")?.split(",").filter(Boolean) || []
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          "https://sisglobalapi.neuralinfo.co.in/public/jobs/preview?status=Open"
        );
        const data = await res.json();
        const counts = data.reduce(
          (acc: Record<string, number>, job: { category_name?: string }) => {
            const cat = job.category_name || "Other";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          },
          {}
        );
        setCategories(
          Object.keys(counts).map((cat) => ({ name: cat, count: counts[cat] }))
        );
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };
    fetchCategories();
  }, []);

  const toggle = (
    arr: string[],
    setArr: (v: string[]) => void,
    val: string
  ) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (location) params.set("location", location);
    if (types.length) params.set("types", types.join(","));
    if (exp.length) params.set("experience", exp.join(","));
    if (salary.length) params.set("salary", salary.join(","));
    if (selectedCategory.length)
      params.set("category", selectedCategory.join(","));
    router.push(`/jobs?${params.toString()}`);
  };

  const clearAll = () => {
    setTypes([]);
    setExp([]);
    setSalary([]);
    setSearch("");
    setLocation("");
    setSelectedCategory([]);
    router.push("/jobs");
  };

  return (
    <div className="bg-white border border-brand-grey-200 rounded-xl p-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-brand-grey-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-brand-red" />
          <h3
            className="font-bold text-brand-grey-900 text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FILTER JOBS
          </h3>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-brand-red hover:underline font-semibold bg-transparent border-none cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Search */}
      <FilterGroup title="Search">
        <input
          type="text"
          placeholder="Job title, keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-brand-grey-200 rounded text-sm text-brand-grey-700 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red"
        />
      </FilterGroup>

      {/* Location */}
      <FilterGroup title="Location">
        <input
          type="text"
          placeholder="City or country..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-3 py-2 border border-brand-grey-200 rounded text-sm text-brand-grey-700 placeholder-brand-grey-400 focus:outline-none focus:border-brand-red"
        />
      </FilterGroup>

      {/* Category */}
      {categories.length > 0 && (
        <FilterGroup title="Category">
          {categories.map((cat) => (
            <label
              key={cat.name}
              className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                className="accent-brand-red w-3.5 h-3.5"
                checked={selectedCategory.includes(cat.name)}
                onChange={() =>
                  toggle(selectedCategory, setSelectedCategory, cat.name)
                }
              />
              <span className="text-sm text-brand-grey-600 group-hover:text-brand-red transition-colors flex-1">
                {cat.name}
              </span>
              <span className="text-xs text-brand-grey-400">({cat.count})</span>
            </label>
          ))}
        </FilterGroup>
      )}

      {/* Job Type */}
      <FilterGroup title="Job Type">
        {JOB_TYPES.map((t) => (
          <label
            key={t}
            className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              className="accent-brand-red w-3.5 h-3.5"
              checked={types.includes(t)}
              onChange={() => toggle(types, setTypes, t)}
            />
            <span className="text-sm text-brand-grey-600 group-hover:text-brand-red transition-colors">
              {t}
            </span>
          </label>
        ))}
      </FilterGroup>

      {/* Experience */}
      <FilterGroup title="Experience">
        {EXPERIENCE.map((e) => (
          <label
            key={e}
            className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              className="accent-brand-red w-3.5 h-3.5"
              checked={exp.includes(e)}
              onChange={() => toggle(exp, setExp, e)}
            />
            <span className="text-sm text-brand-grey-600 group-hover:text-brand-red transition-colors">
              {e}
            </span>
          </label>
        ))}
      </FilterGroup>

      {/* Salary */}
      <FilterGroup title="Salary Range">
        {SALARY_RANGES.map((s) => (
          <label
            key={s}
            className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              className="accent-brand-red w-3.5 h-3.5"
              checked={salary.includes(s)}
              onChange={() => toggle(salary, setSalary, s)}
            />
            <span className="text-sm text-brand-grey-600 group-hover:text-brand-red transition-colors">
              {s}
            </span>
          </label>
        ))}
      </FilterGroup>

      <button
        onClick={applyFilters}
        className="btn-primary w-full justify-center mt-2 text-sm"
      >
        Apply Filters
      </button>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 pb-5 border-b border-brand-grey-100 last:border-0 last:mb-0 last:pb-0">
      <p className="text-xs font-bold text-brand-grey-700 uppercase tracking-widest mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}