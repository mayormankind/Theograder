"use client";

import { useEffect, useRef, useState } from "react";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let step = 0;
          const interval = setInterval(() => {
            if (step < 5) {
              setActiveStep(step + 1);
              step++;
            } else {
              clearInterval(interval);
            }
          }, 500);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (flowRef.current) {
      observer.observe(flowRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      title: "Upload Scripts",
      icon: "fa-cloud-arrow-up",
      desc: "Scan or photograph exam scripts. Upload individually or in bulk — we accept PDF, PNG, JPG.",
    },
    {
      title: "OCR Extraction",
      icon: "fa-expand",
      desc: "Our engine reads each student's handwriting, extracting text answer-by-answer with region detection.",
    },
    {
      title: "SBERT Analysis",
      icon: "fa-microchip",
      desc: "Sentence-BERT compares each answer semantically against your model answers and rubric criteria.",
    },
    {
      title: "Intelligent Scoring",
      icon: "fa-chart-simple",
      desc: "Scores are generated per question with concept matches, confidence levels, and detailed breakdowns.",
    },
    {
      title: "Review & Finalize",
      icon: "fa-clipboard-check",
      desc: "Review each graded script, override where needed, add comments, and export final results.",
    },
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-header" data-animate="fade-up">
          <span className="section-tag">How It Works</span>
          <h2 className="section-title">
            From script to score<br />in five simple steps
          </h2>
          <p className="section-desc">
            A streamlined workflow designed for the way Nigerian lecturers
            actually work.
          </p>
        </div>
        <div className="process-flow" data-animate="fade-up" data-delay="200" ref={flowRef}>
          <div className="process-line">
            <div 
              className="process-line-fill" 
              style={{ height: `${(activeStep / steps.length) * 100}%` }}
            ></div>
          </div>
          {steps.map((step, index) => (
            <div key={index} className={`process-step ${activeStep >= index + 1 ? "active" : ""}`} data-step={index + 1}>
              <div className="step-node">
                <div className="step-icon"><i className={`fas ${step.icon}`}></i></div>
                <div className="step-pulse"></div>
              </div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
