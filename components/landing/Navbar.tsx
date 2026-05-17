"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem("theograder-theme") as
        | "dark"
        | "light"
        | null;
      const initialTheme =
        savedTheme ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");

      if (initialTheme !== activeTheme) {
        setActiveTheme(initialTheme);
      }
      document.documentElement.setAttribute("data-theme", initialTheme);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeTheme]);

  const toggleTheme = () => {
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    setActiveTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theograder-theme", newTheme);
  };

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
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#how-it-works" className="nav-link">
              How It Works
            </a>
            <a href="#preview" className="nav-link">
              Preview
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
          </div>
          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <div className="theme-toggle-track">
                {mounted ? (
                  <>
                    <i className="fas fa-sun theme-icon-light"></i>
                    <i className="fas fa-moon theme-icon-dark"></i>
                  </>
                ) : (
                  <div className="theme-toggle-loader"></div>
                )}
                <div className="theme-toggle-thumb"></div>
              </div>
            </button>
            <Link href="/auth/login" className="btn-ghost">
              Log in
            </Link>
            <Link href="/auth/signup" className="btn-primary-sm">
              Get Started <i className="fas fa-arrow-right"></i>
            </Link>
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
          <div className="mobile-theme-toggle">
            <button
              className="theme-toggle-mobile"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted && (
                <i
                  className={`fas ${activeTheme === "dark" ? "fa-moon" : "fa-sun"} theme-icon-${activeTheme}`}
                ></i>
              )}
            </button>
          </div>
          <div className="mobile-actions">
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
          </div>
        </div>
      </div>
    </>
  );
}
