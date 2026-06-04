import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import StatsBar from "@/components/sections/StatsBar";
import AboutSection from "@/components/sections/AboutSection";
import IndustriesSection from "@/components/sections/IndustriesSection";
import WhySISSection from "@/components/sections/WhySISSection";
import RecruitmentSection from "@/components/sections/RecruitmentSection";
import WorldMapSection from "@/components/sections/WorldMapSection";
import CTASection from "@/components/sections/CTASection";
import QuickForm from "@/components/ui/QuickForm";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <AboutSection />
        <IndustriesSection />
        <WhySISSection />
        <RecruitmentSection />
        <WorldMapSection />
        <CTASection />
      </main>
      <Footer />
      {/* <QuickForm /> */}
    </>
  );
}
