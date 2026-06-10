"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const { user, loading } = useUser();

  useEffect(() => {
    const sectionIds = ["features", "how-it-works", "preview", "faq"];
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (window.scrollY < 100) setActiveSection("");
    };
    window.addEventListener("scroll", handleScroll);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  return (
    <>
      <nav className={`nav ${isScrolled ? "scrolled" : ""}`} id="navbar">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <Image
              src="/logo.png"
              alt="TheoGrader Logo"
              width={50}
              height={50}
            />
            <span className="logo-text">
              Theo<span className="logo-accent">Grader</span>
            </span>
          </Link>
          <div className="nav-links" id="navLinks">
            <a href="#features" className={`nav-link ${activeSection === "features" ? "active" : ""}`}>
              Features
            </a>
            <a href="#how-it-works" className={`nav-link ${activeSection === "how-it-works" ? "active" : ""}`}>
              How It Works
            </a>
            <a href="#preview" className={`nav-link ${activeSection === "preview" ? "active" : ""}`}>
              Preview
            </a>
            <a href="#faq" className={`nav-link ${activeSection === "faq" ? "active" : ""}`}>
              FAQ
            </a>
          </div>
          <div className="nav-actions">
            {!loading && user ? (
              <Link href="/dashboard" className="btn-primary-sm">
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">
                  Log in
                </Link>
                <Link href="/auth/signup" className="btn-primary-sm">
                  Get Started <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
          <button
            className={`mobile-toggle ${isMobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div
        className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}
        id="mobileMenu"
      >
        <div className="mobile-menu-inner">
          <a href="#features" className="mobile-link" onClick={closeMobileMenu}>
            Features
          </a>
          <a
            href="#how-it-works"
            className="mobile-link"
            onClick={closeMobileMenu}
          >
            How It Works
          </a>
          <a href="#preview" className="mobile-link" onClick={closeMobileMenu}>
            Preview
          </a>
          <a href="#faq" className="mobile-link" onClick={closeMobileMenu}>
            FAQ
          </a>
          <div className="mobile-actions">
            {!loading && user ? (
              <Link
                href="/dashboard"
                className="btn-primary-full"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="btn-ghost-full"
                  onClick={closeMobileMenu}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary-full"
                  onClick={closeMobileMenu}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
