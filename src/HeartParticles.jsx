import { useEffect, useRef } from "react";

const TWO_PI = Math.PI * 2;

const heartPoint = (t) => {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x, y };
};

const createParticles = (width, height) => {
  const area = width * height;
  const total = Math.max(4000, Math.min(4000, Math.round(area / 320)));
  console.log(total);
  const outerCount = Math.round(total * 0.1);
  const rimCount = Math.round(total * 0.15);
  const borderCount = Math.round(total * 0.52);
  const particles = [];

  const addParticle = (type) => {
    const t = Math.random() * TWO_PI;
    const s =
      type === "outer"
        ? 1.02 + Math.random() * 0.18
        : type === "rim"
        ? 0.9 + Math.random() * 0.16
        : type === "border"
          ? 0.8 + Math.random() * 0.26
          : Math.pow(Math.random(), 0.45) * 0.86;
    const z =
      type === "outer"
        ? 0.35 + Math.random() * 0.55
        : type === "rim"
        ? 0.5 + Math.random() * 0.5
        : type === "border"
          ? 0.15 + Math.random() * 0.95
          : 0.1 + Math.random() * 0.9;

    particles.push({
      type,
      t,
      s,
      z,
      size:
        type === "outer"
          ? 0.8 + Math.random() * 1.4
          : type === "rim"
          ? 0.7 + Math.random() * 1.3
          : type === "border"
            ? 0.6 + Math.random() * 1.2
            : 0.6 + Math.random() * 1.1,
      offsetX: (Math.random() - 0.5) * 1.8,
      offsetY: (Math.random() - 0.5) * 1.8,
      twinkleSeed: Math.random() * TWO_PI,
      bumpSeed: Math.random() * TWO_PI,
    });
  };

  for (let i = 0; i < outerCount; i += 1) addParticle("outer");
  for (let i = 0; i < rimCount; i += 1) addParticle("rim");
  for (let i = 0; i < borderCount; i += 1) addParticle("border");
  for (let i = outerCount + rimCount + borderCount; i < total; i += 1) {
    addParticle("inner");
  }

  return particles;
};

export default function HeartParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = createParticles(width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const cx = width * 0.5;
      const cy = height * 0.52;
      const baseScale = Math.min(width, height) * 0.0185;
      // Heartbeat: sharper pulse every ~900ms with a subtle secondary bump.
      const beatT = (time % 900) / 900;
      const primary = Math.max(0, 1 - Math.pow(beatT / 0.38, 2));
      const secondaryPhase = ((time + 140) % 900) / 900;
      const secondary = Math.max(0, 1 - Math.pow(secondaryPhase / 0.22, 2));
      const heartBeatScale = 1 + primary * 0.08 + secondary * 0.035;
      const outerBreath = 1 + Math.sin(time * 0.003) * 0.18;
      const heartScale = baseScale * heartBeatScale;
      const particles = particlesRef.current;

      // Inner glow layer
      ctx.shadowColor = "rgba(255, 90, 135, 0.5)";
      ctx.shadowBlur = 8;

      for (const particle of particles) {
        if (particle.type !== "inner") continue;
        const base = heartPoint(particle.t);
        const pulse = 1 + Math.sin(time * 0.0022 + particle.bumpSeed) * 0.05;
        const scale = heartScale * particle.s * pulse;
        const depthScale = 1 + particle.z * 0.2;
        const x = cx + base.x * scale * depthScale + particle.offsetX;
        const y = cy - base.y * scale * depthScale + particle.offsetY;
        const twinkle = Math.sin(time * 0.006 + particle.twinkleSeed) * 0.5 + 0.5;
        const depth = 1 + particle.z * 0.55 + twinkle * 0.12;
        const lightness = 46 + depth * 15;
        const alpha = 0.18 + twinkle * 0.35 + particle.s * 0.2;
        const size = particle.size * (1 + depth * 0.55);

        ctx.fillStyle = `hsla(344, 88%, ${lightness}%, ${Math.min(alpha, 0.9)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TWO_PI);
        ctx.fill();
      }

      // Border sparkle layer
      ctx.shadowColor = "rgba(255, 115, 150, 0.75)";
      ctx.shadowBlur = 14;

      for (const particle of particles) {
        if (particle.type !== "border") continue;
        const base = heartPoint(particle.t);
        const scale = heartScale * particle.s;
        const depthScale = 1 + particle.z * 0.28;
        const x = cx + base.x * scale * depthScale + particle.offsetX;
        const y = cy - base.y * scale * depthScale + particle.offsetY;
        const twinkle = Math.sin(time * 0.006 + particle.twinkleSeed) * 0.3 + 0.3;
        const sparkle = twinkle > 0.92 ? 0.3 : 0;
        const depth = 1 + particle.z * 0.65 + twinkle * 0.15;
        const lightness = 55 + depth * 18 + sparkle * 8;
        const alpha = 0.52 + twinkle * 0.35 + sparkle;
        const size = particle.size * (0.95 + depth * 1 + sparkle * 1);

        ctx.fillStyle = `hsla(346, 90%, ${lightness}%, ${Math.min(alpha, 0.98)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TWO_PI);
        ctx.fill();
      }

      // Rim highlights for 3D density
      ctx.shadowColor = "rgba(255, 135, 170, 0.9)";
      ctx.shadowBlur = 18;

      for (const particle of particles) {
        if (particle.type !== "rim") continue;
        const base = heartPoint(particle.t);
        const scale = heartScale * particle.s;
        const depthScale = 1 + particle.z * 0.35;
        const x = cx + base.x * scale * depthScale + particle.offsetX;
        const y = cy - base.y * scale * depthScale + particle.offsetY;
        const twinkle = Math.sin(time * 0.007 + particle.twinkleSeed) * 0.3 + 0.3;
        const sparkle = twinkle > 0.9 ? 0.35 : 0;
        const depth = 1 + particle.z * 0.85 + twinkle * 0.18;
        const lightness = 60 + depth * 20 + sparkle * 10;
        const alpha = 0.62 + twinkle * 0.35 + sparkle;
        const size = particle.size * (1 + depth * 0.85 + sparkle * 0.75);

        ctx.fillStyle = `hsla(347, 92%, ${lightness}%, ${Math.min(alpha, 0.99)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TWO_PI);
        ctx.fill();
      }

      // Outer blurred border breathing independently from the heartbeat
      ctx.shadowColor = "rgba(255, 120, 155, 0.45)";
      ctx.shadowBlur = 26;

      for (const particle of particles) {
        if (particle.type !== "outer") continue;
        const base = heartPoint(particle.t);
        const scale = heartScale * particle.s * outerBreath * 1.08;
        const depthScale = 1 + particle.z * 0.2;
        const x = cx + base.x * scale * depthScale + particle.offsetX;
        const y = cy - base.y * scale * depthScale + particle.offsetY;
        const twinkle = Math.sin(time * 0.004 + particle.twinkleSeed) * 0.5 + 0.5;
        const depth = 1 + particle.z * 0.35 + twinkle * 0.12;
        const lightness = 56 + depth * 14;
        const alpha = 0.32 + twinkle * 0.35;
        const size = particle.size * (1.35 + depth * 0.55);

        ctx.fillStyle = `hsla(345, 88%, ${lightness}%, ${Math.min(alpha, 0.65)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TWO_PI);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      frameRef.current = window.requestAnimationFrame(render);
    };

    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="heart-canvas" aria-hidden="true" />;
}
