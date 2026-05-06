import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-grad2)" />
                  <path
                    d="M8 16L13 21L24 10"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient
                      id="logo-grad2"
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
            <p className="footer-desc">
              Intelligent assessment grading system built specifically for
              Nigerian universities.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h5>Product</h5>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#preview">Preview</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <a href="#">About</a>
              <a href="#">Research Paper</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">NDPR Compliance</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} TheoGrader. All rights reserved.
          </span>
          <div className="footer-social">
            <a href="#">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="#">
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
