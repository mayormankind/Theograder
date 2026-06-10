"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Brain, Check, PlayCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const floatingCards = rootRef.current?.querySelectorAll<HTMLElement>(".floating-card");
      if (floatingCards && window.innerWidth > 1024) {
        floatingCards.forEach((card, index) => {
          card.style.transform = `translateY(${-scrollY * (index + 1) * 0.05}px)`;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="hero" ref={rootRef}>
      <div className="hero-bg-elements">
        <div className="hero-grid-overlay"></div>
        <div className="hero-gradient-orb orb-1"></div>
        <div className="hero-gradient-orb orb-2"></div>
        <div className="floating-card card-1" id="floatCard1">
          <div className="fc-icon fc-green"><Check size={12} /></div>
          <div className="fc-content">
            <span className="fc-label">Script #247</span>
            <span className="fc-value">Graded — 67/100</span>
          </div>
        </div>
        <div className="floating-card card-2" id="floatCard2">
          <div className="fc-bar">
            <div className="fc-bar-fill" style={{ width: "94%" }}></div>
          </div>
          <span className="fc-stat">94% Confidence</span>
        </div>
        <div className="floating-card card-3" id="floatCard3">
          <div className="fc-icon fc-blue"><Brain size={12} /></div>
          <span className="fc-label">SBERT Analysis</span>
          <span className="fc-value fc-active">Processing...</span>
        </div>
      </div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge" data-animate="fade-up">
            <span className="badge-dot"></span>
            Built for Nigerian Universities
          </div>
          <h1 className="hero-title" data-animate="fade-up" data-delay="100">
            Grade examination<br />
            scripts with
            <span className="title-highlight">
              <span className="highlight-text">AI precision</span>
              <svg className="highlight-underline" viewBox="0 0 200 12" fill="none">
                <path
                  d="M2 8C30 3 60 2 100 4C140 6 170 3 198 7"
                  stroke="url(#underline-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="underline-grad"
                    x1="0"
                    y1="0"
                    x2="200"
                    y2="0"
                  >
                    <stop stopColor="#1a6b3c" />
                    <stop offset="1" stopColor="#2dd4a8" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>
          <p className="hero-subtitle" data-animate="fade-up" data-delay="200">
            Upload handwritten theory scripts, and let our SBERT-powered engine
            analyze, score, and explain every mark — so you review with
            confidence, not fatigue.
          </p>
          <div className="hero-cta" data-animate="fade-up" data-delay="300">
            {!loading && user ? (
              <Link href="/dashboard" className="btn-primary-lg">
                Go to Dashboard
                <div className="btn-shimmer"></div>
              </Link>
            ) : (
              <Link href="/auth/signup" className="btn-primary-lg">
                Start Grading Smarter
                <div className="btn-shimmer"></div>
              </Link>
            )}
            <a href="#how-it-works" className="btn-outline-lg">
              <PlayCircle size={16} />
              See How It Works
            </a>
          </div>
          <div className="hero-proof" data-animate="fade-up" data-delay="400">
            <div className="proof-avatars">
              <div className="proof-avatar" style={{ background: "#1a6b3c", zIndex: 5 }}>
                OA
              </div>
              <div className="proof-avatar" style={{ background: "#2563eb", zIndex: 4 }}>
                NK
              </div>
              <div className="proof-avatar" style={{ background: "#7c3aed", zIndex: 3 }}>
                FA
              </div>
              <div className="proof-avatar" style={{ background: "#dc2626", zIndex: 2 }}>
                IB
              </div>
              <div className="proof-avatar" style={{ background: "#f59e0b", zIndex: 1 }}>
                +
              </div>
            </div>
            <span className="proof-text"
              >Trusted by <strong>200+ lecturers</strong> across 15 Nigerian
              universities</span
            >
          </div>
        </div>
      </div>
    </section>
  );
}
