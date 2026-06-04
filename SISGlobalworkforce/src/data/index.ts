import type { Industry, NavItem, Stat, RecruitmentStep, CountryData, WhyCard } from "@/types";
import {
  HeartPulse,
  Hotel,
  Cog,
  Truck,
  Wrench,
  MonitorSmartphone,
  RefreshCcw,
  Bot,
  BarChart3,
  Zap,
  ShieldCheck,
  Building2,
  ClipboardList,
  Search,
  Target,
  Bookmark,
  Handshake,
  PartyPopper,
} from "lucide-react";
export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/",children: [
      { label: "SIS Global", href: "/sis-global" },
      { label: "SIS India Group", href: "/sis-india-group" },
    ], },
  {
    label: "Solutions",
    href: "/solutions",
    children: [
      { label: "Permanent Staffing", href: "/" },
      { label: "Contract Staffing", href: "/" },
      { label: "Payroll Management", href: "/" },
      { label: "HR Consulting", href: "/" },
    ],
  },
  // { label: "Industries", href: "/industries" },
  { label: "Verticals", href: "/industries" },
   { label: "Employer", href: "/employers" },
  { label: "Jobs", href: "/jobs" },
  { label: "Contact Us",  href: "/contact" },
];

export const stats: Stat[] = [
  { value: 9317, label: "Live Jobs" },
  { value: 1253, label: "Companies" },
  { value: 5624, label: "Candidates" },
  { value: 2918, label: "Placements" },
];

export const industries = [
  {
    id: "healthcare",
    title: "Healthcare",
    description:
      "Reliable healthcare staffing solutions for hospitals, clinics, elderly care, and home healthcare.",
    icon: HeartPulse,
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80",
    href: "/industries/healthcare",
  },

  {
    id: "hospitality",
    title: "Hospitality",
    description:
      "Supporting hospitality brands with trained professionals for hotels, resorts, restaurants, and catering services.",
    icon: Hotel,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    href: "/industries/hospitality",
  },

  {
    id: "oil-gas",
    title: "Oil & Gas",
    description:
      "Technical workforce solutions for EPC, shutdowns, refineries, and industrial plants.",
    icon: Cog,
    image:
      "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&q=80",
    href: "/industries/oil-gas",
  },

  {
    id: "logistics",
    title: "Logistics & Warehousing",
    description:
      "Workforce solutions for warehouses, e-commerce, supply chain companies, and distribution centers.",
    icon: Truck,
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80",
    href: "/industries/logistics",
  },

  {
    id: "engineering-mep",
    title: "Engineering & MEP",
    description:
      "Technical staffing support for MEP projects, facility management, commercial buildings, and industrial operations.",
    icon: Wrench,
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80",
    href: "/industries/engineering-mep",
  },

  {
    id: "it-technology",
    title: "IT & Technology",
    description:
      "Skilled technology professionals for software development, infrastructure, and digital transformation projects.",
    icon: MonitorSmartphone,
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",
    href: "/industries/it-technology",
  },
];

export const whyCards: WhyCard[] = [
  {
    id: 1,
    title: "End-to-End Solutions",
    description:
      "We handle the entire workforce lifecycle — from sourcing and screening to onboarding and compliance — so you can focus on growing your business.",
    icon: RefreshCcw,
  },
  {
    id: 2,
    title: "Technology Driven",
    description:
      "Our proprietary platform uses AI-powered matching and real-time analytics to connect you with verified candidates faster than traditional methods.",
    icon: Bot,
  },
  {
    id: 3,
    title: "Structured & Transparent",
    description:
      "Clear SLAs, regular reporting, and dedicated account managers ensure you always have full visibility into your workforce deployment.",
    icon: BarChart3,
  },
  {
    id: 4,
    title: "Faster Turnaround",
    description:
      "Our pre-verified talent pool and streamlined processes mean critical positions are filled in days, not weeks.",
    icon: Zap,
  },
  {
    id: 5,
    title: "Compliance Guaranteed",
    description:
      "We stay ahead of labor regulations, ensuring full legal compliance across all geographies and industry sectors.",
    icon: ShieldCheck,
  },
  {
    id: 6,
    title: "Backed by SIS India",
    description:
      "As a venture of SIS India Ltd., we bring decades of operational excellence and a national network to every engagement.",
    icon: Building2,
  },
];

export const recruitmentSteps: RecruitmentStep[] = [
  {
    id: 1,
    title: "Requirement Analysis",
    description:
      "We deep-dive into your business needs, culture, and specific role requirements to define the ideal candidate profile.",
    icon: ClipboardList,
  },
  {
    id: 2,
    title: "Talent Sourcing",
    description:
      "Our team leverages multiple channels — database, job boards, referrals, and headhunting — to identify qualified candidates.",
    icon: Search,
  },
  {
    id: 3,
    title: "Screening & Assessment",
    description:
      "Rigorous multi-stage screening including skill tests, background verification, and structured interviews.",
    icon: Target,
  },
  {
    id: 4,
    title: "Shortlisting",
    description:
      "Only the top-matched candidates are presented to you with detailed profiles and assessment reports.",
    icon: Bookmark,
  },
  {
    id: 5,
    title: "Client Interview",
    description:
      "We coordinate and facilitate interviews, providing support to both clients and candidates throughout the process.",
    icon: Handshake,
  },
  {
    id: 6,
    title: "Offer & Onboarding",
    description:
      "Seamless offer management, document verification, and a structured onboarding process for smooth joining.",
    icon: PartyPopper,
  },
];

export const countriesData: CountryData[] = [
  { name: "United States", projects: 128, coordinates: [-95, 38] },
  { name: "United Kingdom", projects: 84, coordinates: [-2, 54] },
  { name: "India", projects: 246, coordinates: [78, 22] },
  { name: "Singapore", projects: 63, coordinates: [103.8, 1.3] },
  { name: "Australia", projects: 52, coordinates: [133, -25] },
  { name: "UAE", projects: 41, coordinates: [54, 24] },
];
