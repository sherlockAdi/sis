import { LucideIcon } from "lucide-react";

// Industry type
export interface Industry {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  href: string;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// Stats type
export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

// Recruitment step
export interface RecruitmentStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

// Country data
export interface CountryData {
  name: string;
  projects: number;
  coordinates: [number, number];
}

// Why SIS card
export interface WhyCard {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}