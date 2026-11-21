import { useState, useEffect } from 'react';
import type { Lang } from '../data';

interface CookieBannerProps {
  lang: Lang;
}

export default function CookieBanner({ lang }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(true);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('macrown_cookie_consent');
      if (!consent) {
        // Show after a subtle delay for smooth entrance
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Error checking cookie consent', e);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        'macrown_cookie_consent',
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: true,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Error saving cookie consent', e);
    }
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(
        'macrown_cookie_consent',
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Error saving cookie consent', e);
    }
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(
        'macrown_cookie_consent',
        JSON.stringify({
          essential: true,
          analytics: analyticsConsent,
          marketing: marketingConsent,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Error saving cookie preferences', e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie & Privatsphäre-Einstellungen"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-50 animate-slide-up"
    >
      <div className="bg-[#0D0D0D] text-white border border-[#DEA43E]/40 rounded-[2px] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#DEA43E] text-xs font-serif">✦</span>
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-[#DEA43E] font-bold">
            {lang === 'de' ? 'Privatsphäre & Atelier Cookies' : 'Privacy & Atelier Cookies'}
          </span>
        </div>

        {/* Content */}
        <p className="text-xs text-white/80 font-light leading-relaxed mb-4">
          {lang === 'de' ? (
            <>
              Wir nutzen Cookies und Tracking-Technologien, um dir ein vollkommenes, sicheres Einkaufserlebnis in unserer Haute Coiffure Boutique zu gewährleisten und unsere Kollektionen stetig zu verfeinern. Weitere Details findest du in unserer{' '}
              <a
                href="https://www.macrown.org/datenschutzerklaerung/"
                target="_blank"
                rel="noreferrer"
                className="text-[#DEA43E] underline hover:text-white transition-colors"
              >
                Datenschutzerklärung
              </a>{' '}
              und im{' '}
              <a
                href="https://www.macrown.org/impressum/"
                target="_blank"
                rel="noreferrer"
                className="text-[#DEA43E] underline hover:text-white transition-colors"
              >
                Impressum
              </a>.
            </>
          ) : (
            <>
              We use cookies and essential technologies to provide an exquisite, secure browsing experience in our Haute Coiffure boutique and to continuously refine our collections. For complete details, see our{' '}
              <a
                href="https://www.macrown.org/datenschutzerklaerung/"
                target="_blank"
                rel="noreferrer"
                className="text-[#DEA43E] underline hover:text-white transition-colors"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://www.macrown.org/impressum/"
                target="_blank"
                rel="noreferrer"
                className="text-[#DEA43E] underline hover:text-white transition-colors"
              >
                Imprint
              </a>.
            </>
          )}
        </p>

        {/* Granular Preferences (Collapsible) */}
        {showDetails && (
          <div className="mb-4 pt-3 border-t border-white/10 space-y-2.5 text-xs">
            <label className="flex items-center justify-between text-white/90 cursor-default">
              <span>{lang === 'de' ? 'Technisch essenziell (Warenkorb & Session)' : 'Technically Essential (Cart & Session)'}</span>
              <span className="text-[10px] text-emerald-400 font-mono uppercase">{lang === 'de' ? 'Erforderlich' : 'Required'}</span>
            </label>

            <label className="flex items-center justify-between text-white/80 cursor-pointer">
              <span>{lang === 'de' ? 'Analyse & Performance (Firebase)' : 'Analytics & Performance (Firebase)'}</span>
              <input
                type="checkbox"
                checked={analyticsConsent}
                onChange={(e) => setAnalyticsConsent(e.target.checked)}
                className="accent-[#DEA43E] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-white/80 cursor-pointer">
              <span>{lang === 'de' ? 'Marketing & Concierge-Präferenzen' : 'Marketing & Concierge Preferences'}</span>
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="accent-[#DEA43E] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10.5px] text-white/50 hover:text-white text-left underline sm:no-underline font-display uppercase tracking-wider"
          >
            {showDetails
              ? (lang === 'de' ? 'Weniger anzeigen' : 'Hide details')
              : (lang === 'de' ? 'Einstellungen' : 'Customize')}
          </button>

          <div className="flex items-center gap-2">
            {showDetails ? (
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 border border-white/30 text-white hover:border-[#DEA43E] hover:text-[#DEA43E] text-[10px] font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors"
              >
                {lang === 'de' ? 'Auswahl speichern' : 'Save Selection'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="px-4 py-2 border border-white/30 text-white hover:border-[#DEA43E] hover:text-[#DEA43E] text-[10px] font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors"
              >
                {lang === 'de' ? 'Nur Essenziell' : 'Essential Only'}
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-5 py-2 bg-[#DEA43E] text-[#0D0D0D] hover:bg-white text-[10px] font-display uppercase tracking-wider font-bold rounded-[2px] transition-colors shadow-md"
            >
              {lang === 'de' ? 'Alle akzeptieren' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
