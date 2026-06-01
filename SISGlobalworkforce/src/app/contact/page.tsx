// src/app/contact/page.tsx  ← SERVER COMPONENT (no "use client")
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactClient from "./ContactClient";

// ── Static data lives here so it never ships to the browser bundle ────────

export const OFFICES = [
  {
    city:    "Gurugram (HQ)",
    address: "7th Floor, Unitech Cyber Park, Sector 39, Gurugram, Haryana — 122 001",
    phone:   "+91 124 417 1888",
    email:   "info@sisglobal.com",
    hours:   "Mon – Sat: 9:00 AM – 6:30 PM",
    mapUrl:  "https://maps.google.com/?q=Unitech+Cyber+Park+Sector+39+Gurugram",
    primary: true,
    icon:    "🏢",
  },
  {
    city:    "Mumbai",
    address: "Unit 12, Maker Chambers IV, Nariman Point, Mumbai, Maharashtra — 400 021",
    phone:   "+91 22 6123 4567",
    email:   "mumbai@sisglobal.com",
    hours:   "Mon – Sat: 9:00 AM – 6:00 PM",
    mapUrl:  "https://maps.google.com/?q=Maker+Chambers+IV+Nariman+Point+Mumbai",
    primary: false,
    icon:    "🌊",
  },
  {
    city:    "Bengaluru",
    address: "3rd Floor, Prestige Atlanta, 80 Feet Road, Koramangala, Bengaluru — 560 034",
    phone:   "+91 80 4567 8901",
    email:   "bengaluru@sisglobal.com",
    hours:   "Mon – Sat: 9:00 AM – 6:00 PM",
    mapUrl:  "https://maps.google.com/?q=Prestige+Atlanta+Koramangala+Bengaluru",
    primary: false,
    icon:    "💻",
  },
  {
    city:    "Dubai (International)",
    address: "Office 2104, Jumeirah Bay X2 Tower, JLT, Dubai, UAE — PO Box 338822",
    phone:   "+971 4 567 8901",
    email:   "dubai@sisglobal.com",
    hours:   "Sun – Thu: 9:00 AM – 6:00 PM",
    mapUrl:  "https://maps.google.com/?q=Jumeirah+Bay+X2+Tower+JLT+Dubai",
    primary: false,
    icon:    "🌍",
  },
] as const;

export const FAQS = [
  { q: "How quickly can you deploy workforce?",   a: "For most roles we can shortlist candidates within 48 hours and deploy within 5–7 working days, depending on documentation." },
  { q: "What industries do you specialise in?",   a: "We serve Healthcare, Hospitality, Oil & Gas, Logistics, Engineering & MEP, IT, and more across India and internationally." },
  { q: "Do you provide payroll management?",      a: "Yes — our end-to-end payroll services cover salary processing, statutory compliance, and full-and-final settlement." },
  { q: "Which countries do you operate in?",      a: "India (pan-India), UAE, Singapore, UK, Australia, and the USA. We are actively expanding to more geographies." },
  { q: "How are candidates verified?",            a: "All candidates undergo background checks, reference verification, skill assessments, and document validation before placement." },
  { q: "Can I hire contract staff through you?",  a: "Absolutely. We offer flexible contract and temporary staffing with complete legal and statutory compliance managed by us." },
] as const;

// ── SEO metadata (server-only) ─────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "Contact Us | SIS Global Workforce Solutions",
  description: "Get in touch with SIS Global Workforce Solutions. Reach our offices in Gurugram, Mumbai, Bengaluru, or Dubai — or send us a message and we'll respond within 4 hours.",
  openGraph: {
    title:       "Contact SIS Global Workforce Solutions",
    description: "Hire workforce, explore job opportunities, or partner with us. Offices in India and UAE.",
    url:         "https://sisglobal.com/contact",
    siteName:    "SIS Global Workforce Solutions",
    type:        "website",
  },
};

// ── Server Component shell ─────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <>
      <Navbar />
      {/*
        All interactivity (form state, office accordion, submit handler)
        is delegated to the Client Component below.
        The static data arrays are passed as plain props — serialisable, zero JS overhead.
      */}
      <ContactClient offices={OFFICES} faqs={FAQS} />
      <Footer />
    </>
  );
}