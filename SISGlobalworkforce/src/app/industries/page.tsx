import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import IndustriesSection from "@/components/sections/IndustriesSection";
import CTASection from "@/components/sections/CTASection";
import Link from "next/link";

export const metadata = {
  title: "Industries We Serve | SIS Global Workforce Solutions",
  description: "SIS Global provides specialized workforce solutions across Healthcare, Hospitality, Oil & Gas, Logistics, Engineering, and more.",
};

export default function IndustriesPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        {/* <section className="py-16 red-gradient-section text-white text-center">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">Industries</span>
            </div>
            <h1
              className="text-5xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Industries We Serve
            </h1>
            <p className="text-white/80 mt-4 max-w-xl mx-auto">
              Specialized workforce solutions tailored to your sector&apos;s unique demands.
            </p>
          </div>
        </section> */}

        <IndustriesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
