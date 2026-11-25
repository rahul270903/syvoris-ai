'use client';

import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label?: string;
  isHub?: boolean;
  pulsePhase: number;
}

interface Pulse {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
}

export function EnterpriseTelemetryBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates for interactive field
    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialize Enterprise CRM Nodes
    const hubLabels = ['TENANT RLS', 'PIPELINE CPQ', 'CUSTOMER 360', 'AI WORKFORCE'];
    const totalNodes = Math.max(20, Math.min(38, Math.floor(width / 45)));
    const nodes: Node[] = [];

    for (let i = 0; i < totalNodes; i++) {
      const isHub = i < hubLabels.length;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isHub ? 0.15 : 0.28),
        vy: (Math.random() - 0.5) * (isHub ? 0.15 : 0.28),
        radius: isHub ? 3.5 : Math.random() * 1.5 + 1.2,
        label: isHub ? hubLabels[i] : undefined,
        isHub,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Active data pulses traveling across network
    const pulses: Pulse[] = [];
    const maxPulses = 10;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Architectural Grid
      const gridSize = 48;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Proximity Connections & Line Pulses
      const maxDistance = 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (nodes[i].isHub || nodes[j].isHub ? 0.22 : 0.12);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = nodes[i].isHub || nodes[j].isHub ? 1.2 : 0.8;
            ctx.stroke();

            // Randomly spawn pulses between connected nodes
            if (pulses.length < maxPulses && Math.random() < 0.008) {
              pulses.push({
                fromIdx: i,
                toIdx: j,
                progress: 0,
                speed: 0.012 + Math.random() * 0.015,
              });
            }
          }
        }
      }

      // 3. Render and Update Pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const from = nodes[pulse.fromIdx];
        const to = nodes[pulse.toIdx];
        if (!from || !to) {
          pulses.splice(p, 1);
          continue;
        }

        const px = from.x + (to.x - from.x) * pulse.progress;
        const py = from.y + (to.y - from.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Render and Update Nodes
      for (const node of nodes) {
        if (!isReduced) {
          node.x += node.vx;
          node.y += node.vy;

          // Mouse subtle repulsion
          const mdx = node.x - mouseX;
          const mdy = node.y - mouseY;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 100 && mdist > 0) {
            const force = (1 - mdist / 100) * 0.8;
            node.x += (mdx / mdist) * force;
            node.y += (mdy / mdist) * force;
          }

          // Boundary bounce
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;

          node.pulsePhase += 0.03;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        if (node.isHub) {
          ctx.fillStyle = '#38BDF8';
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Pulsing halo for Hubs
          const haloRadius = node.radius + 4 + Math.sin(node.pulsePhase) * 2.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Hub Monospace Label
          if (node.label && width > 640) {
            ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
            ctx.fillText(node.label, node.x + 8, node.y + 3);
          }
        } else {
          ctx.fillStyle = 'rgba(248, 250, 252, 0.45)';
          ctx.fill();
        }
      }

      if (!isReduced) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden ${className}`}>
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" aria-hidden="true" />
      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-radial-[at_top_right] from-[#38BDF8]/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06070A]/50 to-[#06070A] pointer-events-none" />
    </div>
  );
}

export default EnterpriseTelemetryBackground;
