import { useState, useRef } from 'react';
import { LANG } from '../data';
import type { Lang } from '../data';

interface HeroProps {
  lang: Lang;
  t: typeof LANG.de;
}

export default function Hero({ lang, t }: HeroProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <section id="hero" className="relative w-full bg-[#0D0D0D] text-white overflow-hidden border-b border-[#E8E6E1]">
      {/* CINEMATIC FULL-BLEED VIDEO BACKGROUND */}
      <div className="relative w-full min-h-[82vh] lg:min-h-[90vh] flex items-center justify-center">
        {/* Background Video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="https://www.macrown.org/wp-content/uploads/revslider/video-media/slid-rev-1_1.jpeg"
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="https://www.macrown.org/wp-content/uploads/2025/02/slid-rev-1.mp4" type="video/mp4" />
          {/* Fallback image */}
          <img
            src="https://www.macrown.org/wp-content/uploads/revslider/video-media/slid-rev-1_1.jpeg"
            alt="Macrown Hair Video Fallback"
            className="w-full h-full object-cover"
          />
        </video>

        {/* Dual Luxury Scrim Overlays for Pristine Legibility & Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/45 to-[#0D0D0D]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#0D0D0D]/30 to-[#0D0D0D]/70 pointer-events-none" />

        {/* Floating Atelier Controls (Bottom Right of Video) */}
        <div className="absolute bottom-6 right-4 sm:right-8 z-20 flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 sm:p-2.5 rounded-[2px] bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white/90 hover:text-[#DEA43E] transition-all text-xs"
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

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 sm:p-2.5 rounded-[2px] bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white/90 hover:text-[#DEA43E] transition-all text-xs flex items-center gap-1.5"
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

        {/* Centered Haute Couture Editorial Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          {/* Eyebrow badge with refined gold accents */}
          <div className="inline-flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-6 sm:w-10 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-xs font-display tracking-[0.32em] text-[#DEA43E] font-semibold uppercase">
              {lang === 'de' ? 'GODFIDENCE PERÜCKEN • ATELIER VIETNAM' : 'GODFIDENCE WIGS • ATELIER VIETNAM'}
            </span>
            <span className="w-6 sm:w-10 h-px bg-[#DEA43E]" />
          </div>

          {/* Grand Brand Headline (Lustria font, high-fashion statement) */}
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] text-white font-normal tracking-[0.06em] leading-[1.04] mb-3 select-none">
            MACROWN
          </h1>

          {/* Golden Hairline Divider */}
          <div className="w-12 h-[2px] bg-[#DEA43E] my-3 sm:my-4" />

          {/* Tagline ("Kröne Dich mit Gottvertrauen.") */}
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#DEA43E] font-normal italic tracking-wide mb-5">
            {lang === 'de' ? 'Kröne Dich mit Gottvertrauen.' : 'Crown yourself with Godfidence.'}
          </h2>

          {/* Subtitle description */}
          <p className="font-sans text-sm sm:text-base md:text-lg text-white/85 max-w-2xl mx-auto font-light leading-relaxed mb-9">
            {t.hero.sub}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
            <a
              href="#shop"
              className="w-full sm:w-auto inline-flex items-center justify-center px-9 py-4 bg-[#DEA43E] text-[#0D0D0D] text-[11px] font-display font-bold uppercase tracking-[0.25em] rounded-[2px] hover:bg-white hover:text-[#0D0D0D] transition-all duration-300 shadow-xl group"
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
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-black/40 backdrop-blur-md text-white border border-white/40 text-[11px] font-display font-semibold uppercase tracking-[0.25em] rounded-[2px] hover:bg-white hover:text-[#0D0D0D] hover:border-white transition-all duration-300"
            >
              <span>{t.hero.guideBtn}</span>
            </a>
          </div>

          {/* Trust Guarantee / Reviews Pill */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-[2px] bg-black/50 backdrop-blur-md border border-white/15 text-xs text-white/90">
            <div className="flex items-center gap-1 text-[#DEA43E] font-medium">
              <span>★★★★★</span>
              <span className="font-bold text-white ml-0.5">4.9 / 5.0</span>
            </div>
            <span className="text-white/30">•</span>
            <span className="text-[11px] font-light text-white/80">
              {lang === 'de' ? 'Über 500+ zufriedene Kundinnen' : 'Over 500+ satisfied clients'}
            </span>
          </div>

          {/* Smooth Scroll Down Indicator */}
          <a
            href="#categories"
            className="mt-10 inline-flex flex-col items-center text-white/60 hover:text-[#DEA43E] transition-colors group"
            aria-label="Nach unten scrollen"
          >
            <span className="text-[9px] font-display uppercase tracking-[0.25em] mb-1.5 opacity-80 group-hover:opacity-100 font-semibold">
              {lang === 'de' ? 'Entdecken' : 'Explore'}
            </span>
            <svg
              className="w-4 h-4 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </a>
        </div>
      </div>

      {/* 4 PILLARS TRUST BAR DIRECTLY BELOW HERO (Crisp Architecture) */}
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
