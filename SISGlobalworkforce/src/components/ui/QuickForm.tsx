"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function QuickForm() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setOpen(false); }, 2500);
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
      {/* Form panel */}
      <div
        className={`bg-white shadow-2xl border border-brand-grey-200 transition-all duration-400 overflow-hidden ${
          open ? "w-72 opacity-100" : "w-0 opacity-0"
        }`}
        style={{ maxHeight: "480px" }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-brand-grey-900 font-bold text-base"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
            >
              Quick Enquiry
            </h3>
            <button onClick={() => setOpen(false)} className="text-brand-grey-400 hover:text-brand-red">
              <X size={18} />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-brand-grey-700 font-medium">Thank you! We&apos;ll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {["Full Name", "Email", "Phone", "Company"].map((field) => (
                <input
                  key={field}
                  type={field === "Email" ? "email" : "text"}
                  placeholder={field}
                  required
                  className="w-full px-3 py-2.5 border border-brand-grey-200 text-sm text-brand-grey-800 focus:outline-none focus:border-brand-red placeholder-brand-grey-400"
                />
              ))}
              <select
                className="w-full px-3 py-2.5 border border-brand-grey-200 text-sm text-brand-grey-600 focus:outline-none focus:border-brand-red"
                defaultValue=""
              >
                <option value="" disabled>Select Service</option>
                <option>Permanent Staffing</option>
                <option>Contract Staffing</option>
                <option>Payroll Management</option>
                <option>HR Consulting</option>
              </select>
              <button type="submit" className="btn-primary w-full justify-center mt-1">
                Submit Enquiry
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tab */}
      <button
        className="quick-form-tab"
        onClick={() => setOpen(!open)}
        aria-label="Toggle Quick Form"
      >
        Quick Form
      </button>
    </div>
  );
}
