"use client";

import { useEffect, useRef } from "react";
import { Brain, Check, FileText, ListChecks, Pen, ShieldCheck, UserPen } from "lucide-react";

export default function Features() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>(".bento-card");
    if (!cards) return;

    const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mouse-x", `${x}%`);
      card.style.setProperty("--mouse-y", `${y}%`);
    };

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => handleMouseMove(e, card));
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("mousemove", (e) => handleMouseMove(e, card));
      });
    };
  }, []);

  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header" data-animate="fade-up">
          <span className="section-tag">Features</span>
          <h2 className="section-title">
            Everything you need to
            <br />
            grade with intelligence
          </h2>
          <p className="section-desc">
            Five powerful capabilities working together to transform how
            Nigerian universities assess theory examinations.
          </p>
        </div>
        <div
          className="bento-grid"
          data-animate="fade-up"
          data-delay="200"
          ref={gridRef}
        >
          {/* Large card: OCR */}
          <div className="bento-card bento-large">
            <div className="bento-card-inner">
              <div className="bento-visual ocr-visual">
                <div className="ocr-demo">
                  <div className="ocr-page">
                    <div className="ocr-line" style={{ width: "90%" }}></div>
                    <div className="ocr-line" style={{ width: "75%" }}></div>
                    <div className="ocr-line" style={{ width: "85%" }}></div>
                    <div className="ocr-line" style={{ width: "60%" }}></div>
                    <div className="ocr-line" style={{ width: "80%" }}></div>
                    <div className="ocr-line" style={{ width: "45%" }}></div>
                    <div className="ocr-scan-line"></div>
                  </div>
                  <div className="ocr-arrow">
                    <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                      <path
                        d="M0 12H36M36 12L26 2M36 12L26 22"
                        stroke="#2dd4a8"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="ocr-output">
                    <div className="ocr-text-line">
                      <span className="ocr-highlight">The mitochondria</span> is
                      the
                    </div>
                    <div className="ocr-text-line">powerhouse of the cell.</div>
                    <div className="ocr-text-line">
                      It produces <span className="ocr-highlight">ATP</span>{" "}
                      through
                    </div>
                    <div className="ocr-text-line">
                      oxidative
                      <span className="ocr-highlight">phosphorylation</span>
                    </div>
                    <div className="ocr-cursor"></div>
                  </div>
                </div>
              </div>
              <div className="bento-info">
                <div className="bento-icon-wrap">
                  <FileText size={18} />
                </div>
                <h3>OCR Script Processing</h3>
                <p>
                  Advanced optical character recognition trained on Nigerian
                  handwriting styles. Handles cursive, print, and mixed scripts
                  across English examination papers.
                </p>
              </div>
            </div>
          </div>

          {/* Medium card: Rubric-Based */}
          <div className="bento-card bento-medium">
            <div className="bento-card-inner">
              <div className="bento-visual rubric-visual">
                <div className="rubric-demo">
                  <div className="rubric-row">
                    <span className="rubric-criterion">Definition</span>
                    <div className="rubric-dots">
                      <span className="dot active"></span>
                      <span className="dot active"></span>
                      <span className="dot active"></span>
                      <span className="dot"></span>
                    </div>
                    <span className="rubric-score">3/4</span>
                  </div>
                  <div className="rubric-row">
                    <span className="rubric-criterion">Examples</span>
                    <div className="rubric-dots">
                      <span className="dot active"></span>
                      <span className="dot active"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                    <span className="rubric-score">2/4</span>
                  </div>
                  <div className="rubric-row">
                    <span className="rubric-criterion">Analysis</span>
                    <div className="rubric-dots">
                      <span className="dot active"></span>
                      <span className="dot active"></span>
                      <span className="dot active"></span>
                      <span className="dot active"></span>
                    </div>
                    <span className="rubric-score">4/4</span>
                  </div>
                </div>
              </div>
              <div className="bento-info">
                <div className="bento-icon-wrap icon-blue">
                  <ListChecks size={18} />
                </div>
                <h3>Rubric-Based Grading</h3>
                <p>
                  Define your marking scheme once. TheoGrader maps every answer to
                  your rubric criteria automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Medium card: Semantic Similarity */}
          <div className="bento-card bento-medium">
            <div className="bento-card-inner">
              <div className="bento-visual semantic-visual">
                <div className="semantic-demo">
                  <div className="semantic-node node-center">
                    <span>SBERT</span>
                  </div>
                  <div className="semantic-node node-1">
                    <span>Student Answer</span>
                  </div>
                  <div className="semantic-node node-2">
                    <span>Model Answer</span>
                  </div>
                  <div className="semantic-node node-3">
                    <span>0.87</span>
                  </div>
                  <svg className="semantic-lines" viewBox="0 0 300 200">
                    <line
                      x1="150"
                      y1="100"
                      x2="50"
                      y2="40"
                      stroke="#2dd4a8"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                    <line
                      x1="150"
                      y1="100"
                      x2="250"
                      y2="40"
                      stroke="#2563eb"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                    <line
                      x1="150"
                      y1="100"
                      x2="150"
                      y2="170"
                      stroke="#7c3aed"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                  </svg>
                </div>
              </div>
              <div className="bento-info">
                <div className="bento-icon-wrap icon-purple">
                  <Brain size={18} />
                </div>
                <h3>Semantic Similarity</h3>
                <p>
                  Powered by SBERT, we compare meaning — not just keywords.
                  Students get credit for correct concepts expressed
                  differently.
                </p>
              </div>
            </div>
          </div>

          {/* Small card: Confidence */}
          <div className="bento-card bento-small">
            <div className="bento-card-inner">
              <div className="bento-visual confidence-visual">
                <div className="confidence-gauge">
                  <svg viewBox="0 0 120 120" className="gauge-svg">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="var(--border-color)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="url(#gauge-grad)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="314"
                      strokeDashoffset="31"
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      className="gauge-progress"
                    />
                    <defs>
                      <linearGradient
                        id="gauge-grad"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop stopColor="#1a6b3c" />
                        <stop offset="1" stopColor="#2dd4a8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="gauge-value">
                    <span className="gauge-number">91</span>
                    <span className="gauge-percent">%</span>
                  </div>
                </div>
              </div>
              <div className="bento-info">
                <div className="bento-icon-wrap icon-amber">
                  <ShieldCheck size={18} />
                </div>
                <h3>Confidence & Explainability</h3>
                <p>
                  Every score comes with a confidence rating and detailed
                  explanation of why marks were awarded or deducted.
                </p>
              </div>
            </div>
          </div>

          {/* Small card: Lecturer Review */}
          <div className="bento-card bento-small">
            <div className="bento-card-inner">
              <div className="bento-visual review-visual">
                <div className="review-demo">
                  <div className="review-item">
                    <div className="review-q">
                      Q3. Score: <span className="review-score">6/10</span>
                    </div>
                    <div className="review-actions-mini">
                      <button
                        title="approve button"
                        className="review-btn approve"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        title="review button"
                        className="review-btn override"
                      >
                        <Pen size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="review-override-panel">
                    <span className="override-label">Override to:</span>
                    <input
                      title="overide input"
                      type="text"
                      defaultValue="8"
                      className="override-input"
                      readOnly
                    />
                    <span className="override-label">/10</span>
                  </div>
                </div>
              </div>
              <div className="bento-info">
                <div className="bento-icon-wrap icon-red">
                  <UserPen size={18} />
                </div>
                <h3>Lecturer Review & Override</h3>
                <p>
                  You&apos;re always in control. Accept, adjust, or override any
                  AI-generated score with full audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
