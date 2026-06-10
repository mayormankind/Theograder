"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/providers/ThemeProvider";

interface IllustrationItem {
  type: "card" | "score" | "progress";
  content?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
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

  return (
    <div className="auth-body">
      <div className="auth-layout">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-left-top">
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
            </div>

            <div className="auth-illustration">
              {illustration.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                <div key={index} className={`auth-float-card afc-${index + 1}`}>
                  {item.type === "card" && (
                    <div className="afc-row">
                      {item.dotColor && (
                        <div className={`afc-dot ${item.dotColor}`}></div>
                      )}
                      {ItemIcon && <ItemIcon size={16} />}
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
                );
              })}
              <div className="auth-circle c1"></div>
              <div className="auth-circle c2"></div>
              <div className="auth-circle c3"></div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-right-top"></div>
          <div className="auth-form-container">{children}</div>
        </div>
      </div>
    </div>
  );
}
