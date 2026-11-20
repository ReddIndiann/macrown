import { useState, useRef, useEffect } from 'react';
import { LANG } from '../data';
import type { Lang } from '../data';

interface HeroProps {
  lang: Lang;
  t: typeof LANG.de;
  onNavigateShop?: () => void;
}

interface Slide {
  id: number;
  type: 'video' | 'image';
  src: string;
  poster?: string;
  eyebrowDe: string;
  eyebrowEn: string;
  title: string;
  taglineDe: string;
  taglineEn: string;
  subDe: string;
  subEn: string;
}

export default function Hero({ lang, t, onNavigateShop }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const slides: Slide[] = [
    {
      id: 0,
      type: 'video',
      src: 'https://cdn.coverr.co/videos/coverr-woman-running-her-fingers-through-her-hair-4283/1080p.mp4',
      poster: 'https://cdn.coverr.co/videos/coverr-woman-running-her-fingers-through-her-hair-4283/thumbnail.jpg',
      eyebrowDe: 'GODFIDENCE PERÜCKEN • ATELIER VIETNAM',
      eyebrowEn: 'GODFIDENCE WIGS • ATELIER VIETNAM',
      title: 'MACROWN',
      taglineDe: 'Kröne Dich mit Gottvertrauen.',
      taglineEn: 'Crown yourself with Godfidence.',
      subDe: 'Erlebe handgefertigte Haute Coiffure Perücken mit hauchdünnem Schweizer HD-Lace für deinen majestätischen Auftritt.',
      subEn: 'Experience handcrafted Haute Coiffure wigs with ultra-thin Swiss HD lace engineered for your divine presence.',
    },
    {
      id: 1,
      type: 'image',
      src: 'https://www.macrown.org/wp-content/uploads/2025/03/mel-scaled-1.jpg',
      eyebrowDe: '100% UNBEHANDELTES ROHHAAR • PURE RAW EXCELLENCE',
      eyebrowEn: '100% UNTREATED RAW HAIR • PURE EXCELLENCE',
      title: 'ROYAL SILK',
      taglineDe: 'Höchste vietnamesische Haarkunst.',
      taglineEn: 'Finest Vietnamese hair craftsmanship.',
      subDe: 'Reines Einzelspenderhaar mit vollkommen intakter Schuppenschicht für seidigen Naturglanz und jahrelange Haltbarkeit.',
      subEn: 'Pure single-donor raw hair with perfectly intact cuticles for silky radiance and multi-year longevity.',
    },
    {
      id: 2,
      type: 'image',
      src: 'https://www.macrown.org/wp-content/uploads/2025/01/MRDC1845.jpg',
      eyebrowDe: 'SCHWEIZER SPITZENTECHNOLOGIE • INVISIBLE MELT',
      eyebrowEn: 'SWISS LACE TECHNOLOGY • INVISIBLE MELT',
      title: 'SWISS HD LACE',
      taglineDe: 'Die Kunst der unsichtbaren Haarlinie.',
      taglineEn: 'The art of the undetectable hairline.',
      subDe: 'Ultra-feine Schweizer HD-Spitze, die sich nahtlos mit jedem Hautton verbindet – ohne aufwendiges Tönen.',
      subEn: 'Ultra-thin Swiss HD lace that melts seamlessly into any skin tone without tedious tinting.',
    },
  ];

  const activeSlide = slides[currentSlide];

  // Auto advance slides every 8.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleShopClick = (e: React.MouseEvent) => {
    if (onNavigateShop) {
      e.preventDefault();
      onNavigateShop();
    }
  };

  return (
    <section id="hero" className="relative w-full bg-[#0D0D0D] text-white overflow-hidden border-b border-[#E8E6E1]">
      {/* CINEMATIC FULL-BLEED STAGE */}
      <div className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center">
        {/* Background Visual Layer */}
        {activeSlide.type === 'video' ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            poster={activeSlide.poster}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
          >
            <source src={activeSlide.src} type="video/mp4" />
            <img
              src={activeSlide.poster}
              alt="Macrown Hair Video Fallback"
              className="w-full h-full object-cover"
            />
          </video>
        ) : (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={activeSlide.src}
              alt={activeSlide.title}
              className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[8000ms]"
              loading="eager"
            />
          </div>
        )}

        {/* Luxury Cinema Scrim Overlays for Pristine Legibility & Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-black/45 to-[#0D0D0D]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        {/* Video Audio/Play Controls (when Slide 0 is active) */}
        {activeSlide.type === 'video' && (
          <div className="absolute bottom-6 right-4 sm:right-8 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 sm:p-2.5 rounded-[2px] bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white/90 hover:text-[#DEA43E] transition-all text-xs"
              aria-label={isPlaying ? 'Video pausieren' : 'Video abspielen'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="p-2 sm:p-2.5 rounded-[2px] bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white/90 hover:text-[#DEA43E] transition-all text-xs flex items-center gap-1.5"
              aria-label={isMuted ? 'Ton einschalten' : 'Stummschalten'}
              title={isMuted ? 'Ton an' : 'Stumm'}
            >
              {isMuted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-7.5l-4.5 4.5H2.25v6h2.25l4.5 4.5V4.5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#DEA43E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.5-4.5v16.5l-4.5-4.5H2.25v-7.5h4.5z" />
                </svg>
              )}
              <span className="hidden sm:inline font-display text-[9px] uppercase tracking-wider font-semibold">
                {isMuted ? (lang === 'de' ? 'Ton an' : 'Sound') : (lang === 'de' ? 'Stumm' : 'Mute')}
              </span>
            </button>
          </div>
        )}

        {/* Slide Carousel Next / Prev Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-[2px] bg-black/40 hover:bg-[#DEA43E] text-white hover:text-[#0D0D0D] border border-white/20 transition-all flex items-center justify-center cursor-pointer shadow-lg"
          aria-label="Vorherige Kampagne"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-[2px] bg-black/40 hover:bg-[#DEA43E] text-white hover:text-[#0D0D0D] border border-white/20 transition-all flex items-center justify-center cursor-pointer shadow-lg"
          aria-label="Nächste Kampagne"
        >
          ›
        </button>

        {/* Centered Editorial Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-3 mb-5 sm:mb-6 animate-fade-in">
            <span className="w-6 sm:w-10 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-xs font-display tracking-[0.32em] text-[#DEA43E] font-semibold uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {lang === 'de' ? activeSlide.eyebrowDe : activeSlide.eyebrowEn}
            </span>
            <span className="w-6 sm:w-10 h-px bg-[#DEA43E]" />
          </div>

          {/* Grand Brand Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] !text-white font-normal tracking-[0.06em] leading-[1.04] mb-3 select-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
            {activeSlide.title}
          </h1>

          {/* Golden Hairline Divider */}
          <div className="w-12 h-[2px] bg-[#DEA43E] my-3 sm:my-4 shadow-sm" />

          {/* Tagline */}
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl !text-[#DEA43E] font-normal italic tracking-wide mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            „{lang === 'de' ? activeSlide.taglineDe : activeSlide.taglineEn}“
          </h2>

          {/* Subtitle description */}
          <p className="font-sans text-sm sm:text-base md:text-lg !text-white max-w-2xl mx-auto font-normal leading-relaxed mb-9 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {lang === 'de' ? activeSlide.subDe : activeSlide.subEn}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <a
              href="#shop"
              onClick={handleShopClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 bg-[#DEA43E] text-[#0D0D0D] text-[11px] font-display font-bold uppercase tracking-[0.25em] rounded-[2px] hover:bg-white hover:text-[#0D0D0D] transition-all duration-300 shadow-[0_6px_24px_rgba(0,0,0,0.5)] group cursor-pointer"
            >
              <span>{t.hero.shopBtn}</span>
              <svg
                className="w-3.5 h-3.5 ml-2 transform transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>

            <a
              href="#guide"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-black/60 backdrop-blur-md text-white border border-white/60 text-[11px] font-display font-semibold uppercase tracking-[0.25em] rounded-[2px] hover:bg-white hover:text-[#0D0D0D] hover:border-white transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            >
              <span>{t.hero.guideBtn}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4 PILLARS TRUST BAR DIRECTLY BELOW HERO */}
      <div className="bg-[#FFFFFF] border-t border-[#E8E6E1] py-8 text-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {t.trust.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[2px] border border-[#DEA43E]/40 bg-[#FDF9F0] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#DEA43E] text-xs font-serif font-bold">✦</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-display uppercase tracking-[0.18em] font-semibold text-[#0D0D0D]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#666666] mt-0.5 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
