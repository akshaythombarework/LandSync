import React from 'react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/hero_bg.jpg';
import { ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  // Enhanced mouse-movement parallax for desktop devices (disabled on touch)
  const [parallax, setParallax] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Enhanced 3D depth response: ~2.5x stronger with differential X and Y intensities
      const x = ((clientX / innerWidth) - 0.5) * 44; // max ±22px
      const y = ((clientY / innerHeight) - 0.5) * 28; // max ±14px
      setParallax({ x, y });
    }
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  return (
    <div className="h-screen w-full bg-[#031c15] text-white flex flex-col overflow-hidden antialiased select-none">
      {/* Hero Section - Full Viewport Immersive Experience */}
      <section 
        className="relative w-full h-full overflow-hidden bg-[#031c15] text-white flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Layer 1: Stylized 3D Topographic Terrain View with Cinematic Zoom & Enhanced Parallax */}
        <div 
          className="absolute inset-[-60px] overflow-hidden pointer-events-none select-none"
          style={{
            transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
            transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <img
            src={heroBg}
            alt="3D Topographic Terrain of India with Cadastral Boundaries"
            className="w-full h-full object-cover object-[58%_38%] sm:object-[55%_34%] lg:object-[50%_30%] animate-cinematic-zoom filter brightness-[1.05] contrast-[1.12] saturate-[1.22]"
          />
        </div>

        {/* Layer 2: Deep Emerald / Forest-Green Atmospheric Overlay & Central Readability Shadow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#031c15]/75 via-[#031c15]/40 to-[#02130e]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031c15]/80 via-transparent to-[#031c15]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_46%,rgba(2,19,14,0.68)_0%,rgba(3,24,18,0.42)_55%,rgba(3,28,21,0.12)_80%,transparent_100%)] pointer-events-none" />

        {/* Layer 3: Subtle GIS Topographic Contours & Cadastral Map Overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="gis-grid-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.14" />
                <circle cx="80" cy="80" r="1.5" fill="#34d399" fillOpacity="0.25" />
                <circle cx="0" cy="0" r="1.5" fill="#34d399" fillOpacity="0.25" />
              </pattern>
            </defs>

            {/* Micro Coordinate Grid */}
            <rect width="100%" height="100%" fill="url(#gis-grid-pattern)" />

            {/* Dynamic Cadastral Contours & Parcel Boundary Curves */}
            <g className="animate-contour-motion" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="6, 8" opacity="0.45">
              <path d="M -100,280 Q 300,120 700,320 T 1500,240 T 2200,380" />
              <path d="M -100,360 Q 250,220 750,420 T 1600,320 T 2200,490" opacity="0.6" />
              <path d="M -100,440 Q 350,300 800,500 T 1650,400 T 2200,580" opacity="0.35" />
            </g>
          </svg>
        </div>

        {/* Layer 4: Satellite Cadastral Scanning Laser Beam */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-emerald-400/5 to-emerald-400/20 border-b border-emerald-400/35 shadow-[0_2px_12px_rgba(52,211,153,0.12)] animate-scan-sweep" />
        </div>

        {/* Layer 5: Subtle GIS Map Beacons / Geographic Coordinate Nodes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {[
            { top: '30%', left: '34%', delay: '0s' },
            { top: '44%', left: '66%', delay: '1.2s' },
            { top: '62%', left: '28%', delay: '2.4s' },
            { top: '74%', left: '56%', delay: '3.3s' },
            { top: '38%', left: '52%', delay: '1.8s' },
          ].map((node, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
              style={{ top: node.top, left: node.left }}
            >
              <span
                className="absolute w-5 h-5 rounded-full border border-emerald-400/35 gis-beacon-ring"
                style={{ animationDelay: node.delay }}
              />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300/80 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            </div>
          ))}
        </div>

        {/* Hero Content Container: Center contains ONLY the 3 requested elements */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center justify-center">
          {/* Subtle atmospheric ambient glow behind the title */}
          <div className="absolute w-[320px] sm:w-[520px] h-[140px] sm:h-[180px] bg-emerald-400/20 rounded-full blur-[80px] -z-10 pointer-events-none hero-ambient-aura" />

          {/* Element 1: LANDSYNC */}
          <h1 className="hero-title-styled text-5xl sm:text-7xl lg:text-8xl font-black uppercase select-none">
            LANDSYNC
          </h1>

          {/* Element 2: National Land Record Digitization & Validation System */}
          <p className="hero-subtitle-styled mt-4 sm:mt-6 text-xs sm:text-base lg:text-lg font-semibold text-emerald-100/90 uppercase tracking-[0.14em] max-w-3xl mx-auto">
            National Land Record Digitization & Validation System
          </p>

          {/* Element 3: Portal Login */}
          <div className="hero-entrance-btn mt-8 sm:mt-11 flex justify-center">
            <Link
              to="/login"
              className="hero-btn-glow group px-9 py-4 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-950/80 hover:shadow-emerald-500/30 border border-emerald-300/40 hover:border-emerald-200 transition-all duration-300 flex items-center space-x-3 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="tracking-wide">Portal Login</span>
              <ArrowRight className="w-4 h-4 text-emerald-100 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
