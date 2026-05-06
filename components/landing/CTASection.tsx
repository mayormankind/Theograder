import Link from "next/link";

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-card" data-animate="fade-up">
          <div className="cta-bg-pattern"></div>
          <div className="cta-content">
            <h2>Ready to transform how you grade?</h2>
            <p>
              Join 200+ Nigerian lecturers who are grading smarter, faster, and
              more consistently with TheoGrader.
            </p>
            <div className="cta-actions">
              <Link href="/auth/signup" className="btn-primary-lg btn-white">
                Create Your Free Account
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <span className="cta-note"
              >One account per lecturer • No credit card required • Full feature
              access</span
            >
          </div>
        </div>
      </div>
    </section>
  );
}
