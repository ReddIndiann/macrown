import type { Lang } from '../data';

interface HairGuideProps {
  lang: Lang;
  t: any;
}

export default function HairGuide({ lang, t }: HairGuideProps) {
  const guide = t.guideSection;

  return (
    <section id="guide" className="py-20 lg:py-28 bg-[#F9F8F6] border-b border-[#E8E6E1] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 reveal-on-scroll">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-[11px] font-display tracking-[0.28em] text-[#DEA43E] font-semibold uppercase">
              {guide.badge}
            </span>
            <span className="w-6 h-px bg-[#DEA43E]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#0D0D0D] font-normal tracking-tight">
            {guide.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#666666] font-light max-w-2xl mx-auto leading-relaxed">
            {guide.sub}
          </p>
        </div>

        {/* 3 Pillars Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Virgin Hair */}
          <div className="bg-[#FFFFFF] rounded-[2px] p-8 border border-[#E8E6E1] shadow-xs flex flex-col justify-between luxury-hover reveal-on-scroll">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9.5px] font-display uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-[1px] bg-[#F4F3EF] text-[#0D0D0D] font-semibold">
                  {guide.virginCard.badge}
                </span>
                <span className="text-xs text-[#DEA43E] font-bold font-display uppercase tracking-wider">100% Raw Base</span>
              </div>
              <h3 className="font-serif text-2xl text-[#0D0D0D] font-normal mb-3">
                {guide.virginCard.title}
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed mb-6 font-light">
                {guide.virginCard.desc}
              </p>

              <div className="pt-6 border-t border-[#E8E6E1] space-y-3">
                {guide.virginCard.points.map((pt: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#2A2522]">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span className="font-light">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E8E6E1] flex items-center justify-between text-xs text-[#666666]">
              <span className="font-display uppercase tracking-wider text-[10px]">{lang === 'de' ? 'Haltbarkeit:' : 'Longevity:'}</span>
              <span className="font-medium text-[#0D0D0D]">{lang === 'de' ? '1–2 Jahre bei guter Pflege' : '1–2 Years with proper care'}</span>
            </div>
          </div>

          {/* Card 2: Lux Hair (Flagship Atelier Card) */}
          <div className="bg-[#0D0D0D] text-[#FFFFFF] rounded-[2px] p-8 border-2 border-[#DEA43E] shadow-xl flex flex-col justify-between relative transform md:-translate-y-2 reveal-on-scroll delay-150">
            {/* Top Recommended Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#DEA43E] text-[#0D0D0D] text-[9.5px] font-display uppercase tracking-[0.25em] px-4 py-1 rounded-[1px] font-bold shadow-md">
              {lang === 'de' ? 'UNSERE FLAGSHIP QUALITÄT' : 'OUR CROWN ATELIER GRADE'}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <span className="text-[9.5px] font-display uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-[1px] bg-white/10 text-[#DEA43E] font-semibold border border-[#DEA43E]/40">
                  {guide.luxCard.badge}
                </span>
                <span className="text-xs text-[#DEA43E] font-bold font-display uppercase tracking-wider">★ Atelier Tier</span>
              </div>
              <h3 className="font-serif text-2xl text-[#DEA43E] font-normal mb-3">
                {guide.luxCard.title}
              </h3>
              <p className="text-xs text-[#B5B5B5] leading-relaxed mb-6 font-light">
                {guide.luxCard.desc}
              </p>

              <div className="pt-6 border-t border-white/15 space-y-3">
                {guide.luxCard.points.map((pt: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-white">
                    <span className="text-[#DEA43E] font-bold shrink-0">✦</span>
                    <span className="font-light">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#B5B5B5]">
              <span className="font-display uppercase tracking-wider text-[10px]">{lang === 'de' ? 'Färbbarkeit:' : 'Color Potential:'}</span>
              <span className="font-semibold text-[#DEA43E]">{lang === 'de' ? 'Bis Platin/Dunkelblond (#27)' : 'Up to Dark Blonde (#27)'}</span>
            </div>
          </div>

          {/* Card 3: HD Lace */}
          <div className="bg-[#FFFFFF] rounded-[2px] p-8 border border-[#E8E6E1] shadow-xs flex flex-col justify-between luxury-hover reveal-on-scroll delay-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9.5px] font-display uppercase tracking-[0.22em] px-2.5 py-0.5 rounded-[1px] bg-[#FDF9F0] text-[#9E6F1E] border border-[#DEA43E]/40 font-semibold">
                  {guide.hdLaceCard.badge}
                </span>
                <span className="text-xs text-[#DEA43E] font-bold font-display uppercase tracking-wider">Swiss Ultra-Fine</span>
              </div>
              <h3 className="font-serif text-2xl text-[#0D0D0D] font-normal mb-3">
                {guide.hdLaceCard.title}
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed mb-6 font-light">
                {guide.hdLaceCard.desc}
              </p>

              <div className="pt-6 border-t border-[#E8E6E1] space-y-3">
                {guide.hdLaceCard.points.map((pt: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#2A2522]">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span className="font-light">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E8E6E1] flex items-center justify-between text-xs text-[#666666]">
              <span className="font-display uppercase tracking-wider text-[10px]">{lang === 'de' ? 'Optischer Effekt:' : 'Visual Effect:'}</span>
              <span className="font-medium text-[#0D0D0D]">{lang === 'de' ? '100% Unsichtbare Haarlinie' : '100% Invisible Melt Hairline'}</span>
            </div>
          </div>
        </div>

        {/* Studio Craftsmanship Feature */}
        <div className="mt-16 bg-[#FFFFFF] rounded-[2px] p-8 sm:p-10 border border-[#E8E6E1] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xs reveal-on-scroll">
          <div className="lg:col-span-7">
            <span className="text-[10px] font-display uppercase tracking-[0.25em] text-[#DEA43E] font-bold block mb-2">
              {lang === 'de' ? 'ATELIER-EINBLICK' : 'ATELIER SPOTLIGHT'}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#0D0D0D] font-normal mb-4">
              {lang === 'de'
                ? 'Warum vietnamesisches Echthaar als Goldstandard gilt'
                : 'Why Vietnamese Human Hair is the Global Gold Standard'}
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] font-light leading-relaxed mb-6">
              {lang === 'de'
                ? 'Vietnamesisches Haar ist weltberühmt für seine dicken, runden Haarfasern mit intakter Schuppenschicht. Es ist von Natur aus kräftig, splittert kaum und bewahrt seinen gesunden, seidigen Glanz über Jahre hinweg – im Gegensatz zu industriell chemisch geätztem Haar.'
                : 'Vietnamese hair is celebrated for its dense, naturally round keratin shaft and perfectly aligned cuticles. Unlike acid-stripped mass market hair, it retains natural strength, movement, and a mirror-like shine for years.'}
            </p>
            <div className="flex flex-wrap gap-5 text-xs font-display uppercase tracking-wider text-[#0D0D0D]">
              <div className="flex items-center gap-2">
                <span className="text-[#DEA43E]">✦</span>
                <span className="font-medium">{lang === 'de' ? 'Single Donor Auslese' : 'Single Donor Selection'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#DEA43E]">✦</span>
                <span className="font-medium">{lang === 'de' ? 'Kein Silikonüberzug' : 'Zero Silicone Coating'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#DEA43E]">✦</span>
                <span className="font-medium">{lang === 'de' ? 'Hitze- & Styling-resistent' : 'Heat & Style Resistant'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-[2px] overflow-hidden aspect-[16/10] bg-[#F4F3EF] border border-[#E8E6E1]">
              <img
                src="/images/MRDC2126.jpg"
                alt="Macrown Atelier Craftsmanship"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
