export default function LogosStrip() {
  const institutions = [
    "University of Lagos",
    "University of Ibadan",
    "OAU Ile-Ife",
    "University of Nigeria",
    "ABU Zaria",
    "FUTA",
    "LASU",
    "Covenant University",
  ];

  return (
    <section className="logos-strip">
      <div className="container">
        <p className="logos-label">Piloted across leading Nigerian institutions</p>
        <div className="logos-track">
          <div className="logos-slide">
            {institutions.concat(institutions).map((name, i) => (
              <div key={i} className="logo-item">{name}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
