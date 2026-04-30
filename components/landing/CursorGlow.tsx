"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursorGlow = glowRef.current;
    if (!cursorGlow) return;

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const animateGlow = () => {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top = `${glowY}px`;
      requestAnimationFrame(animateGlow);
    };

    document.addEventListener("mousemove", onMouseMove);
    const animationFrame = requestAnimationFrame(animateGlow);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <div className="cursor-glow" id="cursorGlow" ref={glowRef}></div>;
}
