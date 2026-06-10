// components/landing/ProductPreview.tsx
import { Check, CheckCircle2, ExternalLink, Lock, MessageSquare, MinusCircle, Pen, ShieldCheck, XCircle } from "lucide-react";

export default function ProductPreview() {
  return (
    <section className="preview" id="preview">
      <div className="container">
        <div className="section-header" data-animate="fade-up">
          <span className="section-tag">Product Preview</span>
          <h2 className="section-title">
            See the grading
            <br />
            engine in action
          </h2>
          <p className="section-desc">
            A detailed breakdown of how TheoGrader scores and explains every
            answer.
          </p>
        </div>
        <div className="preview-window" data-animate="fade-up" data-delay="200">
          <div className="preview-topbar">
            <div className="preview-dots">
              <span className="dot-red"></span>
              <span className="dot-yellow"></span>
              <span className="dot-green"></span>
            </div>
            <div className="preview-url">
              <Lock size={12} />
              app.theograder.ng/grading/BIO301/scripts/247
            </div>
            <div className="preview-actions-top">
              <ExternalLink size={14} />
            </div>
          </div>
          <div className="preview-body">
            <div className="preview-sidebar">
              <div className="sidebar-header">
                <div className="sidebar-course">BIO 301</div>
                <div className="sidebar-meta">Cell Biology — 2024/2025</div>
              </div>
              <div className="sidebar-student">
                <div className="student-avatar">AO</div>
                <div className="student-info">
                  <span className="student-name">Adewale Okonkwo</span>
                  <span className="student-matric">BIO/2021/047</span>
                </div>
              </div>
              <div className="sidebar-nav">
                <div className="sidebar-item active">
                  <span className="item-num">Q1</span>
                  <span className="item-label">Cell Structure</span>
                  <span className="item-score">8/10</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-num">Q2</span>
                  <span className="item-label">Mitosis Phases</span>
                  <span className="item-score">6/10</span>
                </div>
                <div className="sidebar-item current">
                  <span className="item-num">Q3</span>
                  <span className="item-label">ATP Synthesis</span>
                  <span className="item-score scoring">—</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-num">Q4</span>
                  <span className="item-label">DNA Replication</span>
                  <span className="item-score pending">—</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-num">Q5</span>
                  <span className="item-label">Protein Synth.</span>
                  <span className="item-score pending">—</span>
                </div>
              </div>
              <div className="sidebar-total">
                <span>Running Total</span>
                <span className="total-score">
                  14<span className="total-of">/50</span>
                </span>
              </div>
            </div>
            <div className="preview-main">
              <div className="main-header">
                <div className="main-title-row">
                  <h3>Question 3: ATP Synthesis</h3>
                  <div className="confidence-badge high">
                    <ShieldCheck size={12} />
                    91% Confident
                  </div>
                </div>
                <p className="main-question-text">
                  &quot;Describe the process of ATP synthesis in the
                  mitochondria, including the role of the electron transport
                  chain.&quot;
                </p>
              </div>
              <div className="grading-breakdown">
                <div className="breakdown-header">
                  <h4>Grading Breakdown</h4>
                  <div className="score-display">
                    <span className="score-big">7</span>
                    <span className="score-total">/10</span>
                  </div>
                </div>
                <div className="concept-matches">
                  <div className="concept-item matched">
                    <div className="concept-status">
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="concept-detail">
                      <span className="concept-name">
                        Electron Transport Chain
                      </span>
                      <span className="concept-explanation">
                        Student correctly described the ETC as a series of
                        protein complexes in the inner mitochondrial membrane.
                      </span>
                    </div>
                    <div className="concept-sim">
                      <div className="sim-bar">
                        <div
                          className="sim-fill"
                          style={{ width: "92%" }}
                        ></div>
                      </div>
                      <span className="sim-value">0.92</span>
                    </div>
                    <span className="concept-points">+2</span>
                  </div>
                  <div className="concept-item matched">
                    <div className="concept-status">
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="concept-detail">
                      <span className="concept-name">Chemiosmosis</span>
                      <span className="concept-explanation">
                        Mentioned proton gradient and ATP synthase enzyme
                        correctly.
                      </span>
                    </div>
                    <div className="concept-sim">
                      <div className="sim-bar">
                        <div
                          className="sim-fill"
                          style={{ width: "87%" }}
                        ></div>
                      </div>
                      <span className="sim-value">0.87</span>
                    </div>
                    <span className="concept-points">+2</span>
                  </div>
                  <div className="concept-item matched">
                    <div className="concept-status">
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="concept-detail">
                      <span className="concept-name">
                        Oxidative Phosphorylation
                      </span>
                      <span className="concept-explanation">
                        Correctly linked oxygen as final electron acceptor.
                      </span>
                    </div>
                    <div className="concept-sim">
                      <div className="sim-bar">
                        <div
                          className="sim-fill"
                          style={{ width: "78%" }}
                        ></div>
                      </div>
                      <span className="sim-value">0.78</span>
                    </div>
                    <span className="concept-points">+2</span>
                  </div>
                  <div className="concept-item partial">
                    <div className="concept-status">
                      <MinusCircle size={14} />
                    </div>
                    <div className="concept-detail">
                      <span className="concept-name">ATP Yield</span>
                      <span className="concept-explanation">
                        Mentioned ATP production but stated 40 ATP instead of
                        34-38 ATP per glucose molecule.
                      </span>
                    </div>
                    <div className="concept-sim">
                      <div className="sim-bar">
                        <div
                          className="sim-fill partial-fill"
                          style={{ width: "54%" }}
                        ></div>
                      </div>
                      <span className="sim-value">0.54</span>
                    </div>
                    <span className="concept-points">+1</span>
                  </div>
                  <div className="concept-item missed">
                    <div className="concept-status">
                      <XCircle size={14} />
                    </div>
                    <div className="concept-detail">
                      <span className="concept-name">NADH/FADH2 Carriers</span>
                      <span className="concept-explanation">
                        No mention of electron carriers NADH and FADH2 and their
                        role in donating electrons.
                      </span>
                    </div>
                    <div className="concept-sim">
                      <div className="sim-bar">
                        <div
                          className="sim-fill missed-fill"
                          style={{ width: "12%" }}
                        ></div>
                      </div>
                      <span className="sim-value">0.12</span>
                    </div>
                    <span className="concept-points">+0</span>
                  </div>
                </div>
                <div className="breakdown-actions">
                  <button className="action-approve">
                    <Check size={12} /> Accept Score
                  </button>
                  <button className="action-override">
                    <Pen size={12} /> Override
                  </button>
                  <button className="action-comment">
                    <MessageSquare size={12} /> Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
