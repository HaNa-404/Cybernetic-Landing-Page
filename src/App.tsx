import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Menu, X } from 'lucide-react';
import {
  ARC_CENTER,
  ARC_STATS,
  buildArcPath,
  computeArcLength,
  computeParallaxTarget,
  lerp,
  polarToCartesian,
} from './utils/heroGeometry';

const BG_IMAGE_1 = '/src/assets/images/hero_base_f1f5ff_1795049841817.jpg';

const BG_IMAGE_2 = '/src/assets/images/hero_cyber_circuit_cobalt_1795050525558.jpg';

const NAV_LINKS = ['Module', 'Case Records', 'Biotech', 'Tiers', 'Live Demo'] as const;
type NavLink = (typeof NAV_LINKS)[number];

const LOGO_PATH =
  'M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z';

function BrandMark() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      className="text-white shrink-0"
    >
      <path d={LOGO_PATH} />
    </svg>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavLink>('Module');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'connect' | 'reserve' | null>(null);
  const [email, setEmail] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('Carbon Spine MK-IV');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const revealLayerRef = useRef<HTMLDivElement | null>(null);
  const gridPatternRef = useRef<SVGPatternElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const revealEl = revealLayerRef.current;
    if (!canvas || !revealEl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    syncCanvasSize();

    const targetCursor = { x: -999, y: -999 };
    const smoothCursor = { x: -999, y: -999 };
    const smoothGrid = { x: 0, y: 0 };
    let lastDrawnX = Number.NaN;
    let lastDrawnY = Number.NaN;
    let lastDrawnW = 0;
    let lastDrawnH = 0;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetCursor.x = e.clientX;
      targetCursor.y = e.clientY;
    };

    const handleMouseLeave = () => {
      targetCursor.x = -999;
      targetCursor.y = -999;
    };

    const handleResize = () => {
      syncCanvasSize();
      lastDrawnW = 0;
    };

    const renderFrame = () => {
      smoothCursor.x = lerp(smoothCursor.x, targetCursor.x, 0.1);
      smoothCursor.y = lerp(smoothCursor.y, targetCursor.y, 0.1);

      const targetGridX = computeParallaxTarget(targetCursor.x, window.innerWidth, 16);
      const targetGridY = computeParallaxTarget(targetCursor.y, window.innerHeight, 16);
      smoothGrid.x = lerp(smoothGrid.x, targetGridX, 0.06);
      smoothGrid.y = lerp(smoothGrid.y, targetGridY, 0.06);

      if (gridPatternRef.current) {
        gridPatternRef.current.setAttribute('x', smoothGrid.x.toFixed(2));
        gridPatternRef.current.setAttribute('y', smoothGrid.y.toFixed(2));
      }

      const dx = Math.abs(smoothCursor.x - lastDrawnX);
      const dy = Math.abs(smoothCursor.y - lastDrawnY);
      const sizeChanged = canvas.width !== lastDrawnW || canvas.height !== lastDrawnH;

      if (sizeChanged || Number.isNaN(lastDrawnX) || dx > 0.25 || dy > 0.25) {
        const radius = 260;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (
          smoothCursor.x > -radius &&
          smoothCursor.y > -radius &&
          smoothCursor.x < canvas.width + radius &&
          smoothCursor.y < canvas.height + radius
        ) {
          const gradient = ctx.createRadialGradient(
            smoothCursor.x,
            smoothCursor.y,
            0,
            smoothCursor.x,
            smoothCursor.y,
            radius,
          );
          gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
          gradient.addColorStop(0.4, 'rgba(0, 0, 0, 1)');
          gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.75)');
          gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.4)');
          gradient.addColorStop(0.88, 'rgba(0, 0, 0, 0.12)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(smoothCursor.x, smoothCursor.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        const dataUrl = canvas.toDataURL();
        const maskValue = `url("${dataUrl}")`;
        revealEl.style.maskImage = maskValue;
        revealEl.style.webkitMaskImage = maskValue;
        revealEl.style.maskSize = '100% 100%';
        revealEl.style.webkitMaskSize = '100% 100%';
        revealEl.style.maskRepeat = 'no-repeat';
        revealEl.style.webkitMaskRepeat = 'no-repeat';

        lastDrawnX = smoothCursor.x;
        lastDrawnY = smoothCursor.y;
        lastDrawnW = canvas.width;
        lastDrawnH = canvas.height;
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!modalMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalMode(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalMode]);

  const openModal = (mode: 'connect' | 'reserve') => {
    setFormError(null);
    setSubmittedConfirmation(null);
    setModalMode(mode);
    setMobileMenuOpen(false);
  };

  const handleNavClick = (link: NavLink) => {
    setActiveNav(link);
    setMobileMenuOpen(false);
  };

  const handleModalSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormError('Enter a valid email address to continue.');
      return;
    }
    setFormError(null);
    setSubmittedConfirmation(
      modalMode === 'reserve'
        ? `Reservation queued for ${selectedModule} (${trimmed}).`
        : `Connection request dispatched to ${trimmed}.`,
    );
    setEmail('');
  };

  return (
    <div
      className="min-h-screen bg-[#f1f5ff] tracking-[-0.02em]"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Fixed Navbar */}
      <nav
        aria-label="Primary navigation"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between md:justify-center p-4 sm:p-5"
      >
        {/* Desktop centered pill */}
        <div className="nav-drop hidden md:flex items-center gap-1 bg-[#071124]/90 backdrop-blur-md border border-[#1E3A8A]/40 shadow-lg shadow-[#071124]/15 rounded-full pl-3 pr-2 py-2">
          <button
            type="button"
            onClick={() => handleNavClick('Module')}
            aria-label="Aetheris Home"
            className="flex items-center justify-center p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer mr-1"
          >
            <BrandMark />
          </button>

          {NAV_LINKS.map((link) => {
            const isActive = activeNav === link;
            return (
              <button
                key={link}
                type="button"
                onClick={() => handleNavClick(link)}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#1D4ED8] text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => openModal('connect')}
            className="bg-white text-[#070E1A] text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-blue-50 ml-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Connect
          </button>
        </div>

        {/* Mobile left logo pill */}
        <button
          type="button"
          onClick={() => handleNavClick('Module')}
          aria-label="Aetheris Home"
          className="nav-drop md:hidden bg-[#071124]/90 backdrop-blur-md border border-[#1E3A8A]/40 rounded-full p-2.5 flex items-center justify-center cursor-pointer"
        >
          <BrandMark />
        </button>

        {/* Mobile right hamburger toggle pill */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="nav-drop md:hidden bg-[#071124]/90 backdrop-blur-md border border-[#1E3A8A]/40 rounded-full p-2.5 text-white flex items-center justify-center cursor-pointer"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white pt-16 pb-6 px-5 shadow-lg border-b border-slate-200">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const isActive = activeNav === link;
              return (
                <button
                  key={link}
                  type="button"
                  onClick={() => handleNavClick(link)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-3 border-b border-slate-100 text-left text-sm cursor-pointer ${
                    isActive
                      ? 'text-[#1D4ED8] font-semibold'
                      : 'text-[#070E1A] font-medium'
                  }`}
                >
                  {link}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => openModal('connect')}
              className="mt-5 bg-[#1D4ED8] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#1E40AF] transition-colors cursor-pointer"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Full-screen Hero Section */}
      <main>
        <section
          aria-label="Augmented enhancements hero"
          className="relative h-[100dvh] w-full overflow-hidden bg-[#f1f5ff]"
        >
          {/* Hidden canvas for radial cursor spotlight mask */}
          <canvas
            ref={canvasRef}
            data-testid="spotlight-canvas"
            className="hidden"
            aria-hidden="true"
          />

          {/* Layer 1: Grid background (parallax cobalt-blue blueprint lines over light set) */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 z-20 h-full w-full pointer-events-none mix-blend-multiply"
            style={{ opacity: 0.07 }}
          >
            <defs>
              <pattern
                ref={gridPatternRef}
                id="hero-grid-pattern"
                width="48"
                height="48"
                patternUnits="userSpaceOnUse"
                x="0"
                y="0"
              >
                <path
                  d="M 48 0 L 0 0 0 48"
                  fill="none"
                  stroke="#1E3A8A"
                  strokeWidth="0.7"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid-pattern)" />
          </svg>

          {/* Layer 2: Base image (z-10) with Ken Burns intro */}
          <div
            aria-hidden="true"
            className="ken-burns absolute inset-0 z-10 bg-center bg-cover"
            style={{ backgroundImage: `url("${BG_IMAGE_1}")` }}
          />

          {/* Layer 3: Cursor spotlight reveal layer (z-30) */}
          <div
            ref={revealLayerRef}
            data-testid="spotlight-reveal"
            aria-hidden="true"
            className="absolute inset-0 z-30 bg-center bg-cover pointer-events-none"
            style={{
              backgroundImage: `url("${BG_IMAGE_2}")`,
              maskImage: 'radial-gradient(circle 0px at -999px -999px, black, transparent)',
              WebkitMaskImage:
                'radial-gradient(circle 0px at -999px -999px, black, transparent)',
            }}
          />

          {/* Narrow left-margin scrim on desktop so black jacket & cobalt cybernetics stay sharp */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden sm:block absolute inset-y-0 left-0 w-[44%] z-40 bg-gradient-to-r from-[#f1f5ff]/90 via-[#f1f5ff]/45 to-transparent"
          />
          {/* Compact bottom scrim on mobile so portrait face stays sharp above text */}
          <div
            aria-hidden="true"
            className="pointer-events-none sm:hidden absolute inset-x-0 bottom-0 h-[52%] z-40 bg-gradient-to-t from-[#f1f5ff] via-[#f1f5ff]/90 to-transparent"
          />

          {/* Layer 4: Stats on a fading circular arc (z-50, hidden below sm) */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-y-0 right-0 z-50 pointer-events-none"
          >
            <svg
              viewBox="0 0 380 700"
              preserveAspectRatio="xMaxYMid meet"
              className="h-full w-auto"
            >
              <defs>
                {ARC_STATS.map((stat) => {
                  const start = polarToCartesian(ARC_CENTER, stat.r, stat.startAngle);
                  const end = polarToCartesian(ARC_CENTER, stat.r, stat.endAngle);
                  return (
                    <linearGradient
                      key={`grad-${stat.id}`}
                      id={`grad-${stat.id}`}
                      gradientUnits="userSpaceOnUse"
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                    >
                      <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0} />
                      <stop offset="22%" stopColor="#1D4ED8" stopOpacity={0.55} />
                      <stop offset="55%" stopColor="#0F172A" stopOpacity={0.5} />
                      <stop offset="85%" stopColor="#0F172A" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>

              {ARC_STATS.map((stat, i) => {
                const pathD = buildArcPath(
                  ARC_CENTER,
                  stat.r,
                  stat.startAngle,
                  stat.endAngle,
                );
                const arcLen = computeArcLength(
                  stat.r,
                  stat.startAngle,
                  stat.endAngle,
                );
                const dot = polarToCartesian(ARC_CENTER, stat.r, stat.dotAngle);

                const lineDelay = 0.4 + i * 0.22;
                const markDelay = lineDelay + 0.9;
                const ringDelay = markDelay + 0.3;
                const numberDelay = markDelay + 0.15;
                const labelDelay = numberDelay + 0.3;

                return (
                  <g key={stat.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={`url(#grad-${stat.id})`}
                      strokeWidth={1.1}
                      className="arc-line"
                      style={
                        {
                          '--len': arcLen,
                          '--delay': `${lineDelay}s`,
                        } as CSSProperties
                      }
                    />

                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={7}
                      fill="none"
                      stroke="#1D4ED8"
                      strokeOpacity={0.45}
                      strokeWidth={1.1}
                      className="arc-ring"
                      style={{ '--delay': `${ringDelay}s` } as CSSProperties}
                    />

                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={3.4}
                      fill="#1D4ED8"
                      className="arc-dot"
                      style={{ '--delay': `${markDelay}s` } as CSSProperties}
                    />

                    <text
                      x={dot.x + 16}
                      y={dot.y + 4}
                      fill="#070E1A"
                      fontSize="32"
                      fontWeight={500}
                      className="arc-text tabular-nums"
                      style={{ '--delay': `${numberDelay}s` } as CSSProperties}
                    >
                      {stat.value}
                      <tspan fontSize="19" dy="-10" letterSpacing="-1" fill="#1D4ED8">
                        {stat.suffix}
                      </tspan>
                    </text>

                    <text
                      x={dot.x + 18}
                      y={dot.y + 22}
                      fill="#1E3A8A"
                      fillOpacity={0.85}
                      fontSize="8.5"
                      fontWeight={600}
                      letterSpacing="2"
                      className="arc-text"
                      style={{ '--delay': `${labelDelay}s` } as CSSProperties}
                    >
                      {stat.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Layer 5: Hero text block (z-50) */}
          <div className="absolute bottom-12 sm:bottom-16 md:bottom-24 left-5 sm:left-8 md:left-12 z-50 max-w-[300px] sm:max-w-md">
            <p
              className="hero-rise text-[11px] sm:text-xs font-semibold tracking-[0.12em] text-[#1E40AF] mb-3"
              style={{ animationDelay: '0.15s' }}
            >
              Gateway to your <span className="italic text-[#070E1A]">augmented self</span>
            </p>

            <h1
              className="hero-rise text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-[-0.08em] text-[#070E1A] font-normal mb-4"
              style={{ animationDelay: '0.3s' }}
            >
              A window
              <br />
              of coming
              <br />
              enhancements
            </h1>

            <p
              className="hero-rise text-sm sm:text-base text-[#0F172A]/85 leading-relaxed mb-6 sm:mb-7"
              style={{ animationDelay: '0.5s' }}
            >
              A future where carbon fiber, titanium, and human instinct align. Not
              machine. Not human. Something wonderfully poised between.
            </p>

            <div className="hero-rise" style={{ animationDelay: '0.7s' }}>
              <button
                type="button"
                onClick={() => openModal('reserve')}
                className="group relative overflow-hidden bg-[#1D4ED8] text-white text-sm font-semibold px-7 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg shadow-[#1D4ED8]/25 hover:bg-[#1E40AF] hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />
                <span className="relative z-10">Reserve Now</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Modal for Reserve Now / Connect */}
      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-heading"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#071124]/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalMode(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 text-[#070E1A] shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-[#1D4ED8] uppercase mb-1">
                  {activeNav}
                </p>
                <h2 id="modal-heading" className="text-xl font-semibold tracking-tight text-[#070E1A]">
                  {modalMode === 'reserve'
                    ? 'Reserve your enhancement slot'
                    : 'Connect with our lab'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                aria-label="Close modal"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-[#070E1A] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {submittedConfirmation ? (
              <div className="space-y-4">
                <p className="text-sm text-[#0F172A] leading-relaxed">
                  {submittedConfirmation}
                </p>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="w-full bg-[#071124] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-[#0F172A] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="space-y-4" noValidate>
                {modalMode === 'reserve' && (
                  <div>
                    <label
                      htmlFor="module-select"
                      className="block text-xs font-medium text-[#0F172A] mb-1.5"
                    >
                      Enhancement Module
                    </label>
                    <select
                      id="module-select"
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-slate-300 px-3 py-2.5 text-sm text-[#070E1A] focus:outline-none focus:border-[#1D4ED8]"
                    >
                      <option value="Carbon Spine MK-IV">Carbon Spine MK-IV</option>
                      <option value="Titanium Optic Array">Titanium Optic Array</option>
                      <option value="Neural Reflex Bridge">Neural Reflex Bridge</option>
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-[#0F172A] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-lg bg-[#F8FAFC] border border-slate-300 px-3 py-2.5 text-sm text-[#070E1A] placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                {formError && (
                  <p role="alert" className="text-xs text-red-600">
                    {formError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-[#070E1A] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1D4ED8] text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-[#1E40AF] transition-colors cursor-pointer"
                  >
                    {modalMode === 'reserve' ? 'Confirm Slot' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
