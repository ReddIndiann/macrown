import { useState, useEffect } from 'react';
import { LANG } from '../data';
import type { Lang } from '../data';

interface NavbarProps {
  lang: Lang;
  t: typeof LANG.de;
  setLang: (lng: Lang) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentPage?: 'home' | 'shop';
  onNavigate?: (page: 'home' | 'shop') => void;
}

export default function Navbar({
  lang,
  t,
  setLang,
  cartCount,
  onOpenCart,
  currentPage = 'home',
  onNavigate,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* TOP UTILITY BAR: VIP Concierge (Left) • Announcement (Center) • Language Switcher (Right) */}
      <div className="bg-[#0D0D0D] text-[#DEA43E] border-b border-[#DEA43E]/20 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-4 h-6">
            {/* LEFT: VIP Concierge with Live Status Pulse */}
            <div className="flex items-center shrink-0">
              <a
                href="https://wa.me/491728123222"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/90 hover:text-[#DEA43E] transition-colors group"
                title="VIP WhatsApp Beratung"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-display text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-white/90 group-hover:text-[#DEA43E] transition-colors">
                  VIP Concierge
                </span>
                <span className="hidden md:inline font-mono text-[#DEA43E] text-[10.5px] font-normal pl-1 border-l border-white/20 ml-1">
                  +49 172 812 3222
                </span>
              </a>
            </div>

            {/* CENTER: Free Shipping & Manufacture Guarantee (Desktop/Tablet) */}
            <div className="hidden sm:flex flex-1 justify-center items-center text-center px-4 overflow-hidden">
              <span className="truncate font-display text-[10px] sm:text-[10.5px] uppercase tracking-[0.22em] text-white/80 font-medium">
                {t.topBanner}
              </span>
            </div>

            {/* RIGHT: Language Switcher (DE | EN) */}
            <div className="flex items-center shrink-0">
              <div className="flex items-center bg-[#1A1A1A] border border-white/15 rounded-[2px] p-0.5">
                <button
                  type="button"
                  onClick={() => setLang('de')}
                  className={`px-2 py-0.5 text-[9.5px] font-display font-bold uppercase tracking-wider transition-all rounded-[1px] ${
                    lang === 'de'
                      ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label="Deutsche Sprache wählen"
                >
                  DE
                </button>
                <span className="text-white/20 text-[9px] px-0.5 select-none">/</span>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 text-[9.5px] font-display font-bold uppercase tracking-wider transition-all rounded-[1px] ${
                    lang === 'en'
                      ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label="Select English language"
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE SUB-BAR: Subtle continuous announcement ticker for small viewports (< 640px) */}
        <div className="sm:hidden bg-[#141414] py-1 overflow-hidden border-t border-white/5 font-display text-[9px] uppercase tracking-[0.2em] text-[#DEA43E]">
          <div className="animate-ticker flex items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-6 px-4 whitespace-nowrap">
                <span>✦ {t.topBanner}</span>
                <span className="text-[#DEA43E]/40">•</span>
                <span>100% REMY ECHTHAAR</span>
                <span className="text-[#DEA43E]/40">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E8E6E1] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* LEFT SECTION */}
            <div className="flex items-center w-16 sm:w-24 lg:w-auto">
              {/* Mobile Menu Opener Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 -ml-1 text-[#0D0D0D] hover:text-[#DEA43E] transition-colors focus:outline-none flex items-center gap-1.5 group"
                aria-label="Menü öffnen"
              >
                <div className="w-4.5 h-3 flex flex-col justify-between">
                  <span className="w-4.5 h-[1.5px] bg-[#0D0D0D] group-hover:bg-[#DEA43E] transition-colors"></span>
                  <span className="w-3 h-[1.5px] bg-[#0D0D0D] group-hover:bg-[#DEA43E] transition-colors"></span>
                  <span className="w-4.5 h-[1.5px] bg-[#0D0D0D] group-hover:bg-[#DEA43E] transition-colors"></span>
                </div>
                <span className="hidden sm:inline font-display text-[9px] uppercase tracking-[0.2em] font-semibold text-[#0D0D0D] group-hover:text-[#DEA43E] transition-colors">
                  Menü
                </span>
              </button>

              {/* Desktop Logo & Wordmark */}
              <div className="hidden lg:flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate('home');
                  }}
                  className="flex items-center gap-3.5 group cursor-pointer text-left"
                >
                  <img
                    src="/images/logo-dark-3.png"
                    alt="Macrown Hair Logo"
                    className="h-10 xl:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-cinzel text-xl xl:text-2xl tracking-[0.24em] font-medium text-[#0D0D0D] leading-none">
                      MACROWN
                    </span>
                    <span className="font-display text-[8.5px] tracking-[0.38em] text-[#DEA43E] uppercase mt-1 font-semibold">
                      HAIR ATELIER
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* CENTER SECTION */}
            {/* Mobile / Tablet Centered Logo */}
            <div className="flex lg:hidden flex-1 justify-center items-center">
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('home');
                }}
                className="flex items-center gap-2 cursor-pointer text-left"
              >
                <img
                  src="/images/logo-dark-3.png"
                  alt="Macrown Hair Logo"
                  className="h-7 sm:h-9 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex flex-col text-left">
                  <span className="font-cinzel text-base sm:text-xl tracking-[0.2em] sm:tracking-[0.22em] font-medium text-[#0D0D0D] leading-none">
                    MACROWN
                  </span>
                  <span className="font-display text-[7px] sm:text-[7.5px] tracking-[0.3em] sm:tracking-[0.35em] text-[#DEA43E] uppercase font-semibold">
                    HAIR ATELIER
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7 xl:space-x-9 text-xs font-display uppercase tracking-[0.2em] text-[#1E1E1E] font-medium">
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('home');
                }}
                className={`transition-colors py-1 relative group cursor-pointer ${
                  currentPage === 'home' ? 'text-[#DEA43E] font-bold' : 'hover:text-[#DEA43E]'
                }`}
              >
                {t.nav.home}
                <span
                  className={`absolute bottom-0 left-0 h-px bg-[#DEA43E] transition-all duration-300 ${
                    currentPage === 'home' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </button>
              <a href="#categories" className="hover:text-[#DEA43E] transition-colors py-1 relative group">
                {t.nav.categories}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#DEA43E] transition-all duration-300 group-hover:w-full" />
              </a>
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('shop');
                }}
                className={`transition-colors py-1 relative group cursor-pointer ${
                  currentPage === 'shop' ? 'text-[#DEA43E] font-bold' : 'hover:text-[#DEA43E]'
                }`}
              >
                {t.nav.shop}
                <span
                  className={`absolute bottom-0 left-0 h-px bg-[#DEA43E] transition-all duration-300 ${
                    currentPage === 'shop' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </button>
              <a href="#guide" className="hover:text-[#DEA43E] transition-colors py-1 flex items-center gap-1.5 relative group">
                <span>{t.nav.guide}</span>
                <span className="text-[8.5px] bg-[#FDF9F0] text-[#9E6F1E] border border-[#DEA43E]/40 px-1.5 py-0.2 rounded-xs uppercase tracking-wider font-bold">
                  Expertise
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#DEA43E] transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#testimonials" className="hover:text-[#DEA43E] transition-colors py-1 relative group">
                {lang === 'de' ? 'Referenzen' : 'Reviews'}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#DEA43E] transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#faq" className="hover:text-[#DEA43E] transition-colors py-1 relative group">
                FAQs
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#DEA43E] transition-all duration-300 group-hover:w-full" />
              </a>
            </nav>

            {/* RIGHT SECTION: Cart Drawer Trigger with Badge */}
            <div className="flex items-center justify-end w-16 sm:w-24 lg:w-auto">
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-1.5 sm:p-2 text-[#0D0D0D] hover:text-[#DEA43E] transition-colors focus:outline-none flex items-center gap-2 group"
                aria-label="Einkaufstasche öffnen"
              >
                <div className="relative">
                  <svg className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.3}
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] sm:h-4 sm:min-w-[16px] px-1 items-center justify-center rounded-full bg-[#DEA43E] text-[#0D0D0D] text-[8.5px] sm:text-[9px] font-bold font-mono shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline font-display text-[11px] uppercase tracking-[0.18em] font-medium text-[#0D0D0D] group-hover:text-[#DEA43E] transition-colors">
                  {lang === 'de' ? 'Tasche' : 'Bag'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* LUXURY MOBILE SLIDE-OVER DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0D0D0D]/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeMenu}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-xs sm:max-w-sm w-full bg-[#FFFFFF] shadow-2xl flex flex-col justify-between border-r border-[#E8E6E1] transform transition-transform duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FFFFFF]">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/logo-dark-3.png"
                  alt="Macrown Logo"
                  className="h-8 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="font-cinzel text-lg tracking-[0.22em] font-medium text-[#0D0D0D] leading-none">
                    MACROWN
                  </span>
                  <span className="font-display text-[7.5px] tracking-[0.35em] text-[#DEA43E] uppercase font-semibold mt-0.5">
                    HAIR ATELIER
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeMenu}
                className="p-1.5 text-[#0D0D0D] hover:text-[#DEA43E] transition-colors focus:outline-none"
                aria-label="Menü schließen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
              {/* Navigation Links */}
              <div className="space-y-3">
                <span className="text-[9px] font-display uppercase tracking-[0.25em] text-[#DEA43E] font-bold block mb-2">
                  {lang === 'de' ? 'NAVIGATION' : 'NAVIGATION'}
                </span>
                {[
                  { id: 'home', href: '#hero', label: t.nav.home },
                  { id: 'shop', href: '#shop', label: t.nav.shop },
                  { href: '#categories', label: t.nav.categories },
                  { href: '#guide', label: t.nav.guide, badge: 'Expertise' },
                  { href: '#testimonials', label: lang === 'de' ? 'Referenzen' : 'Reviews' },
                  { href: '#faq', label: 'FAQs' },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    onClick={() => {
                      closeMenu();
                      if (item.id && onNavigate) {
                        onNavigate(item.id as 'home' | 'shop');
                      }
                    }}
                    className={`flex items-center justify-between py-2 text-xl font-serif transition-colors border-b border-[#F0EEE9] ${
                      (item.id === 'home' && currentPage === 'home') || (item.id === 'shop' && currentPage === 'shop')
                        ? 'text-[#DEA43E] font-medium'
                        : 'text-[#0D0D0D] hover:text-[#DEA43E]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="text-[9px] font-display uppercase tracking-wider font-bold bg-[#FDF9F0] text-[#9E6F1E] border border-[#DEA43E]/40 px-2 py-0.5 rounded-[1px]">
                        {item.badge}
                      </span>
                    ) : (
                      <svg className="w-4 h-4 text-[#C5BDB5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>

              {/* Collections Quick Links */}
              <div className="pt-2">
                <span className="text-[9px] font-display uppercase tracking-[0.25em] text-[#DEA43E] font-bold block mb-3">
                  {lang === 'de' ? 'PRODUKTLINIEN' : 'COLLECTIONS'}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'GODFIDENCE Perücken', href: '#shop' },
                    { label: 'HD Closure & Frontal', href: '#shop' },
                    { label: 'Haarbündel (Lux & Virgin)', href: '#shop' },
                    { label: 'Ponytail Extensions', href: '#shop' },
                  ].map((sub, i) => (
                    <a
                      key={i}
                      href={sub.href}
                      onClick={closeMenu}
                      className="px-3.5 py-2.5 bg-[#F9F8F6] hover:bg-[#F4F3EF] border border-[#E8E6E1] rounded-[2px] text-xs font-display tracking-wider uppercase text-[#0D0D0D] flex items-center justify-between"
                    >
                      <span>{sub.label}</span>
                      <span className="text-[#DEA43E]">→</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* VIP WhatsApp Concierge Card in Drawer */}
              <div className="bg-[#0D0D0D] text-white p-4.5 rounded-[2px] border border-[#DEA43E]/40 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-display uppercase tracking-[0.22em] text-[#DEA43E] font-bold">
                    VIP CONCIERGE
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <h4 className="font-serif text-base font-normal text-white mb-1">
                  {lang === 'de' ? 'Persönliche Haarberatung' : 'Personal Hair Concierge'}
                </h4>
                <p className="text-[11px] text-[#B5B5B5] font-light mb-3">
                  {lang === 'de' ? 'Direkt via WhatsApp mit unseren Spezialistinnen' : 'Direct WhatsApp chat with our styling experts'}
                </p>
                <a
                  href="https://wa.me/491728123222"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#DEA43E] text-[#0D0D0D] text-[10px] font-display uppercase tracking-[0.2em] font-bold rounded-[2px] hover:bg-[#C79237] transition-colors"
                >
                  <span>WhatsApp Chat starten</span>
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-[#E8E6E1] bg-[#F9F8F6] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#666666]">
                <span className="font-display uppercase tracking-wider text-[10.5px]">
                  {lang === 'de' ? 'Sprache / Language:' : 'Language / Sprache:'}
                </span>
                <div className="flex items-center border border-[#E8E6E1] rounded-[2px] p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setLang('de')}
                    className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase ${
                      lang === 'de' ? 'bg-[#0D0D0D] text-white' : 'text-[#7A7A7A]'
                    }`}
                  >
                    DE
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase ${
                      lang === 'en' ? 'bg-[#0D0D0D] text-white' : 'text-[#7A7A7A]'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E6E1]/60 flex items-center justify-between text-[10px] text-[#7A7A7A] font-light">
                <span>© 2026 Macrown Hair</span>
                <span className="text-[#DEA43E]">Handcrafted in Vietnam</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
