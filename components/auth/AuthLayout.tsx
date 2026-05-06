"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";

interface IllustrationItem {
  type: "card" | "score" | "progress";
  content?: string;
  icon?: string;
  dotColor?: "green" | "blue" | "yellow" | "red";
  score?: string;
  progress?: number;
  progressTotal?: number;
  iconStyle?: React.CSSProperties;
}

interface AuthLayoutProps {
  children: ReactNode;
  illustration: IllustrationItem[];
}

export default function AuthLayout({
  children,
  illustration,
}: AuthLayoutProps) {
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const saved = localStorage.getItem("theograder-theme") as
        | "dark"
        | "light"
        | null;
      const initial =
        saved ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");

      if (initial !== activeTheme) {
        setActiveTheme(initial);
      }
      document.documentElement.setAttribute("data-theme", initial);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeTheme]);

  const toggleTheme = () => {
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    setActiveTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theograder-theme", newTheme);
  };

  return (
    <div className="auth-body">
      <div className="auth-layout">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-left-top">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#lg_auth)" />
                    <path
                      d="M8 16L13 21L24 10"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient
                        id="lg_auth"
                        x1="0"
                        y1="0"
                        x2="32"
                        y2="32"
                      >
                        <stop stopColor="#1a6b3c" />
                        <stop offset="1" stopColor="#2dd4a8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="logo-text">
                  Theo<span className="logo-accent">Grader</span>
                </span>
              </Link>
            </div>

            <div className="auth-illustration">
              {illustration.map((item, index) => (
                <div key={index} className={`auth-float-card afc-${index + 1}`}>
                  {item.type === "card" && (
                    <div className="afc-row">
                      {item.dotColor && (
                        <div className={`afc-dot ${item.dotColor}`}></div>
                      )}
                      {item.icon && <i className={`fas ${item.icon}`}></i>}
                      {item.content && <span>{item.content}</span>}
                    </div>
                  )}
                  {item.type === "score" && item.score && (
                    <div className="afc-score">{item.score}</div>
                  )}
                  {item.type === "progress" && (
                    <>
                      <div className="afc-row">
                        <div className="afc-bar">
                          <div
                            className="afc-bar-fill"
                            style={{
                              width: item.progress
                                ? `${(item.progress / (item.progressTotal || 1)) * 100}%`
                                : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                      <span>
                        Processing {item.progress || 0}/
                        {item.progressTotal || 0} scripts...
                      </span>
                    </>
                  )}
                </div>
              ))}
              <div className="auth-circle c1"></div>
              <div className="auth-circle c2"></div>
              <div className="auth-circle c3"></div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-right-top">
            <button
              type="button"
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
          </div>
          <div className="auth-form-container">{children}</div>
        </div>
      </div>
    </div>
  );
}
