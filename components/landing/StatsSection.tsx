"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 },
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const end = target;
    const totalFrames = (duration / 1000) * 60;
    let frame = 0;

    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  return { count, elementRef };
}

function StatCard({
  target,
  label,
  suffix,
}: {
  target: number;
  label: string;
  suffix: string;
}) {
  const { count, elementRef } = useCountUp(target);
  return (
    <div className="stat-card" ref={elementRef}>
      <div className="stat-number">{count.toLocaleString()}</div>
      <div className="stat-suffix">{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const stats = [
    { target: 12000, label: "Scripts Graded", suffix: "+" },
    { target: 94, label: "Average Accuracy", suffix: "%" },
    { target: 85, label: "Time Saved", suffix: "%" },
    { target: 200, label: "Active Lecturers", suffix: "+" },
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid" data-animate="fade-up">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
