// src/app/faq/page.tsx  ← SERVER COMPONENT (no "use client")
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FAQClient from "./FAQClient";

// ── Static data (never ships to the browser bundle) ────────────────────────

export const CATEGORIES = [
  { id: "all",       label: "All Questions",     icon: "📋", count: 24 },
  { id: "general",   label: "General",            icon: "💡", count: 5  },
  { id: "seekers",   label: "For Job Seekers",    icon: "👤", count: 7  },
  { id: "employers", label: "For Employers",      icon: "🏢", count: 6  },
  { id: "billing",   label: "Billing & Payments", icon: "💳", count: 3  },
  { id: "account",   label: "Account & Security", icon: "🔒", count: 3  },
] as const;

export interface FAQ {
  id:       number;
  category: string;
  question: string;
  answer:   string;
}

export const FAQS: FAQ[] = [
  // General
  { id: 1,  category: "general",   question: "What is SIS Global Workforce Solutions?",                answer: "SIS Global Workforce Solutions Private Limited is a venture of SIS India Ltd., designed to deliver structured and scalable workforce outsourcing solutions. We connect skilled, verified talent with trusted employers through a technology-enabled ecosystem — ensuring transparency, efficiency, and reliability." },
  { id: 2,  category: "general",   question: "Which industries does SIS Global serve?",                answer: "We serve a wide range of industries including Healthcare, Hospitality, Oil & Gas, Logistics & Warehousing, Engineering & MEP, IT & Technology, Facility Management, Retail, BFSI, and more. Our pre-vetted talent pools are organised by sector so we can respond fast with relevant candidates." },
  { id: 3,  category: "general",   question: "In which countries does SIS Global operate?",            answer: "We currently operate in India (pan-India across 22+ states), UAE, Singapore, United Kingdom, Australia, and the USA. We are actively expanding to additional geographies to serve our global clients." },
  { id: 4,  category: "general",   question: "Is SIS Global Workforce Solutions a listed company?",    answer: "SIS Global Workforce Solutions is a subsidiary of SIS India Ltd., which is listed on both the NSE and BSE. The parent group generates over ₹10,000 Crore in annual revenue and employs 2,50,000+ professionals across its verticals." },
  { id: 5,  category: "general",   question: "How is SIS Global different from other staffing firms?", answer: "Unlike traditional staffing agencies, SIS Global uses a technology-driven platform with AI-powered candidate matching, real-time compliance management, and a pre-verified talent database built over decades. Backed by SIS India Ltd.'s legacy, we offer structured SLAs, dedicated account managers, and end-to-end workforce lifecycle management." },

  // For Job Seekers
  { id: 6,  category: "seekers",   question: "How do I apply for a job on SIS Global?",               answer: "You can browse all open positions on our Find Jobs page. Click on any listing, review the job description, and click 'Apply Now'. You'll be asked to fill a short application form and upload your resume. Our team will review your application and reach out within 2–3 business days." },
  { id: 7,  category: "seekers",   question: "Is it free to apply for jobs?",                         answer: "Yes, completely free. SIS Global Workforce Solutions never charges candidates any registration, application, or placement fee. If anyone asks you for money on our behalf, please report it to info@sisglobal.com immediately." },
  { id: 8,  category: "seekers",   question: "How long does the recruitment process take?",           answer: "Timelines vary by role. For most positions, shortlisting happens within 48 hours, client interviews are scheduled within 3–5 days, and successful candidates can expect an offer within 7–10 working days. Urgent roles can be processed faster." },
  { id: 9,  category: "seekers",   question: "What documents do I need to apply?",                    answer: "Typically you'll need an updated resume/CV, a valid government-issued photo ID (Aadhaar, Passport, or PAN), educational certificates, and experience letters. Specific roles may require additional documents such as a medical fitness certificate or trade license." },
  { id: 10, category: "seekers",   question: "Can I apply for multiple jobs at once?",                answer: "Yes, you can apply for as many jobs as you are genuinely interested in and qualified for. We recommend tailoring your application for each role rather than applying to all listings indiscriminately, as this improves your chances of success." },
  { id: 11, category: "seekers",   question: "Will I receive feedback after an interview?",           answer: "We strive to provide timely feedback after every interview stage. Your dedicated recruitment consultant will inform you of the outcome. If you have not heard back within 5 business days of an interview, please reach out to your assigned consultant or email seekers@sisglobal.com." },
  { id: 12, category: "seekers",   question: "Do you offer contract and temporary roles too?",        answer: "Yes. We place candidates in permanent, contract, temporary, and project-based roles. Contract placements come with full payroll management, statutory compliance, and benefit administration handled by SIS Global on your behalf." },

  // For Employers
  { id: 13, category: "employers", question: "How quickly can you deploy workforce?",                 answer: "For most roles, we can shortlist qualified candidates within 48 hours and deploy within 5–7 working days, subject to documentation and onboarding requirements. For bulk or specialised deployments, timelines are discussed and agreed upon at the outset via a Service Level Agreement." },
  { id: 14, category: "employers", question: "How are candidates verified before placement?",         answer: "Every candidate undergoes a multi-stage verification process: identity and address verification, educational and professional qualification checks, employment history and reference checks, criminal background screening (where required), and role-specific skill assessments. Only verified candidates are presented to clients." },
  { id: 15, category: "employers", question: "Do you handle payroll and compliance?",                 answer: "Yes. Our payroll management service covers salary processing, statutory deductions (PF, ESI, TDS), Form 16 issuance, full-and-final settlement, and labour law compliance across all states. We act as the employer of record for contract staff, taking complete liability off your books." },
  { id: 16, category: "employers", question: "What are your service charges?",                        answer: "Our fees depend on the engagement model (permanent placement, contract staffing, or payroll management), the volume of requirements, and the industry sector. We offer transparent, competitive pricing with no hidden charges. Contact our sales team at employers@sisglobal.com for a customised quote." },
  { id: 17, category: "employers", question: "Can you handle large-scale or bulk hiring?",            answer: "Absolutely. We have successfully executed bulk hiring drives for 500+ positions simultaneously across industries such as Logistics, Retail, Healthcare, and Security. Dedicated project teams are assigned for large mandates with weekly reporting and SLA-backed delivery commitments." },
  { id: 18, category: "employers", question: "Do you offer a replacement guarantee?",                 answer: "Yes. For permanent placements, we offer a free replacement guarantee period (typically 60–90 days depending on the seniority of the role). If a placed candidate exits during the guarantee period for performance reasons, we will source and place a suitable replacement at no additional charge." },

  // Billing
  { id: 19, category: "billing",   question: "What payment methods do you accept?",                   answer: "We accept NEFT/RTGS bank transfers, cheques, and major corporate credit/debit cards. For international clients, we support wire transfers in USD, GBP, AED, and SGD. All invoices are issued within 3 working days of milestone completion." },
  { id: 20, category: "billing",   question: "How do I access my invoices and payment history?",      answer: "Registered employer accounts can access all invoices, receipts, and payment history from the Employer Dashboard under the Billing section. If you do not have dashboard access, email finance@sisglobal.com with your company name and registered email." },
  { id: 21, category: "billing",   question: "What is your refund and cancellation policy?",          answer: "Service fees for completed placements are non-refundable. For contracts cancelled before commencement, any pre-paid amounts (less administrative costs) are refunded within 15 working days. Please refer to your Master Service Agreement for full terms." },

  // Account
  { id: 22, category: "account",   question: "How do I create an employer account?",                  answer: "Visit the Employers page and click 'Create Account'. You'll need to provide your company name, CIN/GSTIN, registered address, and primary contact details. Our team verifies all employer accounts within 24 hours before granting full access." },
  { id: 23, category: "account",   question: "How do I reset my password?",                           answer: "Click 'Forgot Password' on the login page and enter your registered email address. You will receive a password reset link valid for 30 minutes. If you do not receive the email, check your spam folder or contact support@sisglobal.com." },
  { id: 24, category: "account",   question: "How is my data protected on SIS Global?",               answer: "We take data security seriously. All personal and business data is encrypted in transit (TLS 1.3) and at rest (AES-256). We comply with India's Digital Personal Data Protection Act 2023. We never sell or share your data with third parties. Read our full Privacy Policy for details." },
];

// ── SEO metadata (server-only) ─────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "FAQ | SIS Global Workforce Solutions",
  description: "Find answers to common questions about SIS Global Workforce Solutions — for job seekers, employers, billing, and account management.",
  openGraph: {
    title:       "Frequently Asked Questions | SIS Global",
    description: "Everything you need to know about hiring, job applications, payroll, compliance, and more.",
    url:         "https://sisglobal.com/faq",
    siteName:    "SIS Global Workforce Solutions",
    type:        "website",
  },
};

// ── Server Component shell ─────────────────────────────────────────────────

export default function FAQPage() {
  return (
    <>
      <Navbar />
      {/*
        Static data is passed as plain serialisable props.
        All interactivity (search, category filter, accordion) lives in FAQClient.
      */}
      <FAQClient categories={CATEGORIES} faqs={FAQS} />
      <Footer />
    </>
  );
}