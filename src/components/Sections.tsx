import { useState } from 'react';
import { REAL_REVIEWS, LANG } from '../data';
import type { Lang } from '../data';

export function Testimonials({ t }: { t: typeof LANG.de }) {
  const sec = t.testimonialsSection;

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-[11px] font-display tracking-[0.28em] text-[#DEA43E] font-semibold uppercase">
              {sec.badge}
            </span>
            <span className="w-6 h-px bg-[#DEA43E]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0D0D0D] font-normal tracking-tight">
            {sec.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#666666] font-light">
            {sec.sub}
          </p>
        </div>

        {/* Testimonials 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REAL_REVIEWS.map((rev, index) => (
            <div
              key={index}
              className="bg-[#FFFFFF] rounded-[2px] p-8 border border-[#E8E6E1] flex flex-col justify-between shadow-xs luxury-hover"
            >
              <div>
                {/* 5 Warm Gold Stars */}
                <div className="flex items-center gap-1 text-[#DEA43E] text-sm mb-4">
                  {'★'.repeat(rev.stars)}
                </div>
                {/* Quote */}
                <blockquote className="font-serif text-base text-[#0D0D0D] leading-relaxed italic mb-6">
                  “{rev.quote}”
                </blockquote>
              </div>

              {/* Author & Product Info */}
              <div className="pt-6 border-t border-[#E8E6E1] flex items-center gap-3.5">
                <img
                  src={rev.avatar}
                  alt={rev.author}
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-[#DEA43E]/40"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-serif text-sm font-normal text-[#0D0D0D]">
                    {rev.author}
                  </h4>
                  <p className="text-[11px] text-[#7A7A7A] font-light">
                    {rev.city} • <span className="text-emerald-700 font-medium">{sec.verified}</span>
                  </p>
                  <p className="text-[10px] text-[#DEA43E] font-mono mt-0.5">
                    {rev.product}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConsultationBanner({ t }: { t: typeof LANG.de }) {
  const consult = t.consultationSection;

  return (
    <section className="py-16 bg-[#0D0D0D] text-white relative overflow-hidden border-b border-[#DEA43E]/20">
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('/images/MRDC2119.jpg')] bg-cover bg-center opacity-15 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <span className="text-[10px] font-display uppercase tracking-[0.28em] text-[#DEA43E] font-bold block mb-3">
            {consult.badge}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white mb-4">
            {consult.title}
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#B5B5B5] font-light leading-relaxed mb-8">
            {consult.sub}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href="https://wa.me/491728123222"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#DEA43E] text-[#0D0D0D] text-[11px] font-display uppercase tracking-[0.25em] font-bold rounded-[2px] hover:bg-[#C79237] transition-all shadow-md"
            >
              <span>{consult.btn}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <div className="flex items-center gap-2 text-xs text-white/80 justify-center sm:justify-start font-display tracking-wider">
              <span>Direktkontakt:</span>
              <span className="font-mono text-[#DEA43E] font-medium">{consult.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQ({ t }: { t: typeof LANG.de }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faq = t.faqSection;

  return (
    <section id="faq" className="py-20 lg:py-28 bg-[#F9F8F6] border-b border-[#E8E6E1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-[11px] font-display tracking-[0.28em] text-[#DEA43E] font-semibold uppercase">
              {faq.badge}
            </span>
            <span className="w-6 h-px bg-[#DEA43E]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0D0D0D] font-normal tracking-tight">
            {faq.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#666666] font-light">
            {faq.sub}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faq.items.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={i}
                className="border border-[#E8E6E1] rounded-[2px] overflow-hidden bg-[#FFFFFF] shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-[#FAF9F7] transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-lg font-normal text-[#0D0D0D] pr-4">
                    {item.q}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-[2px] flex items-center justify-center shrink-0 border border-[#E8E6E1] transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#0D0D0D] text-[#DEA43E]' : 'text-[#7A7A7A]'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#555555] font-light leading-relaxed border-t border-[#E8E6E1] bg-[#FDFDFD]">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Footer({ lang, t, onOpenAdmin }: { lang: Lang; t: typeof LANG.de; onOpenAdmin?: () => void }) {
  const f = t.footer;
  const [newsletterSent, setNewsletterSent] = useState(false);

  return (
    <footer className="bg-[#0D0D0D] text-white pt-20 pb-12 border-t border-[#DEA43E]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand Manifesto & Emblem */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3.5 mb-6">
              <img
                src="/images/macrown-light-logo.png"
                alt="Macrown"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <span className="font-cinzel text-xl tracking-[0.24em] font-medium text-white block">
                  MACROWN
                </span>
                <span className="font-display text-[8.5px] tracking-[0.38em] text-[#DEA43E] uppercase block font-semibold mt-0.5">
                  HAIR ATELIER
                </span>
              </div>
            </div>

            <p className="text-xs text-[#B5B5B5] leading-relaxed mb-6 font-light max-w-sm">
              {f.aboutText}
            </p>

            <blockquote className="font-serif italic text-sm text-[#DEA43E] border-l border-[#DEA43E] pl-3 py-1">
              „{f.tagline}“
            </blockquote>
          </div>

          {/* Quick Legal Links */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-[11px] uppercase tracking-[0.25em] font-semibold text-[#DEA43E] mb-5">
              {f.legalTitle}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#B5B5B5]">
              {f.links.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="hover:text-[#DEA43E] transition-colors inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care & Concierge */}
          <div className="lg:col-span-2">
            <h4 className="font-display text-[11px] uppercase tracking-[0.25em] font-semibold text-[#DEA43E] mb-5">
              {f.customerCare}
            </h4>
            <ul className="space-y-3 text-xs text-[#B5B5B5]">
              <li>
                <span className="block text-[9.5px] text-[#7A7A7A] uppercase tracking-[0.2em] mb-0.5">
                  WhatsApp Concierge
                </span>
                <a
                  href="https://wa.me/491728123222"
                  className="font-mono text-white hover:text-[#DEA43E] transition-colors"
                >
                  {f.phone}
                </a>
              </li>
              <li>
                <span className="block text-[9.5px] text-[#7A7A7A] uppercase tracking-[0.2em] mb-0.5">
                  E-Mail
                </span>
                <a
                  href={`mailto:${f.email}`}
                  className="hover:text-[#DEA43E] transition-colors"
                >
                  {f.email}
                </a>
              </li>
              <li>
                <span className="block text-[9.5px] text-[#7A7A7A] uppercase tracking-[0.2em] mb-0.5">
                  Service-Zeiten
                </span>
                <span>{f.hours}</span>
              </li>
            </ul>
          </div>

          {/* Privé Newsletter Signup */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-[11px] uppercase tracking-[0.25em] font-semibold text-[#DEA43E] mb-3">
              {f.newsletterTitle}
            </h4>
            <p className="text-xs text-[#B5B5B5] font-light leading-relaxed mb-4">
              {f.newsletterSub}
            </p>

            {newsletterSent ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-[2px] text-emerald-300 text-xs">
                {lang === 'de' ? 'Vielen Dank! Bitte prüfe deinen Posteingang.' : 'Thank you! Please check your inbox.'}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewsletterSent(true);
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  required
                  placeholder={f.newsletterPlaceholder}
                  className="w-full bg-[#181818] border border-white/15 rounded-[2px] px-3.5 py-2.5 text-xs text-white placeholder-[#7A7A7A] focus:outline-none focus:border-[#DEA43E]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#DEA43E] text-[#0D0D0D] font-display text-[10px] uppercase tracking-[0.25em] font-bold rounded-[2px] hover:bg-[#C79237] transition-colors"
                >
                  {f.newsletterBtn}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A7A7A] font-light gap-4">
          <div className="flex items-center gap-4">
            <p>{f.copyright}</p>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-[10px] font-display uppercase tracking-wider text-[#DEA43E]/70 hover:text-[#DEA43E] transition-colors underline decoration-[#DEA43E]/30"
              >
                🔐 Admin & Inventar
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-[10.5px] font-display uppercase tracking-wider">
            <span>Deutschland • Österreich • Schweiz</span>
            <span>•</span>
            <span className="text-[#DEA43E]">Handcrafted in Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
