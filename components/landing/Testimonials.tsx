export default function Testimonials() {
  const testimonials = [
    {
      text: "I used to spend 3 weeks grading 200 scripts for BIO 301. With TheoGrader, I reviewed everything in 2 days. The semantic analysis is shockingly accurate.",
      author: "Dr. Oluwaseun Adeyemi",
      role: "Senior Lecturer, University of Lagos",
      initials: "OA",
      color: "#1a6b3c",
    },
    {
      text: "The confidence scores give me peace of mind. I know exactly which scripts need my close attention and which ones the AI handled perfectly. This is the future.",
      author: "Prof. Ngozi Kalu",
      role: "HOD Computer Science, UNN",
      initials: "NK",
      color: "#2563eb",
      featured: true,
    },
    {
      text: "The override feature is crucial. I'm not handing control to AI — I'm using AI to amplify my expertise. The rubric mapping is beautifully done.",
      author: "Dr. Fatima Abubakar",
      role: "Lecturer II, ABU Zaria",
      initials: "FA",
      color: "#7c3aed",
    },
  ];

  return (
    <section className="testimonials">
      <div className="container">
        <div className="section-header" data-animate="fade-up">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">What lecturers are saying</h2>
        </div>
        <div className="testimonial-grid" data-animate="fade-up" data-delay="200">
          {testimonials.map((t, i) => (
            <div key={i} className={`testimonial-card ${t.featured ? "featured" : ""}`}>
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&quot;{t.text}&quot;</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: t.color }}>{t.initials}</div>
                <div className="author-info">
                  <span className="author-name">{t.author}</span>
                  <span className="author-role">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
