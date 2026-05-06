"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How accurate is the OCR for Nigerian handwriting?",
      a: "Our OCR model has been specifically fine-tuned on thousands of Nigerian examination scripts, covering various handwriting styles. We achieve 92%+ character accuracy, and uncertain readings are flagged for review.",
    },
    {
      q: "Can I customize the rubric for my course?",
      a: "Absolutely. You define your own marking scheme, model answers, and grading criteria for each question. TheoGrader adapts to your rubric — not the other way around.",
    },
    {
      q: "What is SBERT and why do you use it?",
      a: "SBERT (Sentence-BERT) is a state-of-the-art language model that understands meaning, not just keywords. If a student explains a concept correctly using different words, they still get credit.",
    },
    {
      q: "Can I override the AI's scores?",
      a: "Yes — every score can be accepted, adjusted, or completely overridden. All changes are logged in an audit trail. You are always the final authority.",
    },
    {
      q: "Is my data secure?",
      a: "All data is encrypted at rest and in transit. We comply with NDPR. Your data is never shared with third parties. Each lecturer has their own isolated account.",
    },
    {
      q: "How much does it cost?",
      a: "TheoGrader is currently in early access. Each lecturer gets one free account with full feature access. Sign up now to lock in early adopter benefits.",
    },
  ];

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-header" data-animate="fade-up">
          <span className="section-tag">FAQ</span>
          <h2 className="section-title">Common questions</h2>
        </div>
        <div className="faq-list" data-animate="fade-up" data-delay="100">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item ${openIndex === i ? "active" : ""}`}>
              <button className="faq-trigger" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span>{faq.q}</span>
                <i className={`fas ${openIndex === i ? "fa-minus" : "fa-plus"}`}></i>
              </button>
              <div className="faq-content">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
