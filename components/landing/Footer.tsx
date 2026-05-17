import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
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
