"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogosStrip from "@/components/landing/LogosStrip";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductPreview from "@/components/landing/ProductPreview";
import StatsSection from "@/components/landing/StatsSection";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import CursorGlow from "@/components/landing/CursorGlow";
import { useAnimations } from "@/hooks/useAnimations";
import { UserProvider } from "@/hooks/useUser";

export default function LandingPage() {
  useAnimations();

  return (
    <UserProvider>
      <div className="landing-root">
        <CursorGlow />
        <Navbar />
        <main>
          <Hero />
          <LogosStrip />
          <Features />
          <HowItWorks />
          <ProductPreview />
          <StatsSection />
          <Testimonials />
          <FAQ />
          <CTASection />
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}

