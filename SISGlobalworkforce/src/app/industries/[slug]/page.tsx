
//version 2

import { notFound } from "next/navigation";
import { industries } from "@/data";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

interface IndustryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.id }));
}

export async function generateMetadata({
  params,
}: IndustryPageProps) {
  const { slug } = await params;

  const industry = industries.find((i) => i.id === slug);

  if (!industry) {
    return { title: "Industry Not Found" };
  }

  return {
    title: `${industry.title} Staffing | SIS Global Workforce Solutions`,
    description: industry.description,
  };
}

export default async function IndustryPage({
  params,
}: IndustryPageProps) {
  const { slug } = await params;

  const industry = industries.find((i) => i.id === slug);

  if (!industry) notFound();

  const related = industries
    .filter((i) => i.id !== industry.id)
    .slice(0, 3);

  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative h-72 flex items-end pb-12 overflow-hidden">
          <img
            src={industry.image}
            alt={industry.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Link
                href="/"
                className="hover:text-white transition-colors"
              >
                Home
              </Link>

              <span>/</span>

              <Link
                href="/industries"
                className="hover:text-white transition-colors"
              >
                Industries
              </Link>

              <span>/</span>

              <span className="text-white">
                {industry.title}
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {(() => {
  const Icon = industry.icon;

  return (
    <>
      <Icon className="w-10 h-10 inline-block mr-3 text-white" />
      {industry.title}
    </>
  );
})()}
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2
                className="text-2xl font-bold text-brand-grey-900 mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {industry.title} Workforce Solutions
              </h2>

              <div className="section-divider section-divider-left mb-6" />

              <p className="text-brand-grey-600 leading-relaxed mb-6">
                {industry.description}
              </p>

              <p className="text-brand-grey-600 leading-relaxed mb-8">
                SIS Global provides end-to-end staffing and workforce
                management solutions tailored specifically for the{" "}
                {industry.title.toLowerCase()} sector.
              </p>

              <Link
                href="/"
                className="btn-primary"
              >
                Get Industry Staffing
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}