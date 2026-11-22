import { CATEGORIES_DATA } from '../data';
import type { Lang } from '../data';

interface CategoriesProps {
  lang: Lang;
  t: any;
  onSelectCategory: (categoryId: string) => void;
}

export default function Categories({ lang, t, onSelectCategory }: CategoriesProps) {
  return (
    <section id="categories" className="py-12 sm:py-20 lg:py-24 bg-[#F9F8F6] border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 reveal-on-scroll">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
            <span className="w-4 sm:w-6 h-px bg-[#DEA43E]" />
            <span className="text-[9.5px] sm:text-[11px] font-display tracking-[0.24em] sm:tracking-[0.28em] text-[#DEA43E] font-semibold uppercase">
              {t.categoriesSection.badge}
            </span>
            <span className="w-4 sm:w-6 h-px bg-[#DEA43E]" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D0D0D] font-normal tracking-tight">
            {t.categoriesSection.title}
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[#666666] font-light">
            {t.categoriesSection.sub}
          </p>
        </div>

        {/* Categories 4-Card Grid: Chic 2-Col on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {CATEGORIES_DATA.map((cat, index) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group cursor-pointer relative rounded-[2px] overflow-hidden bg-[#FFFFFF] border border-[#E8E6E1] shadow-xs luxury-hover reveal-on-scroll"
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {/* Aspect Ratio 3:4 on Mobile, 4:5 on Desktop */}
              <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-[#F4F3EF]">
                <img
                  src={cat.image}
                  alt={cat.title[lang]}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-106"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/90 via-[#0D0D0D]/30 to-transparent transition-opacity group-hover:opacity-90" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-left text-white">
                  <span className="text-[8px] sm:text-[9.5px] font-display uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#DEA43E] block mb-0.5 sm:mb-1 font-semibold truncate">
                    {cat.subtitle[lang]}
                  </span>
                  <h3 className="font-serif text-sm sm:text-xl font-normal text-white group-hover:text-[#DEA43E] transition-colors leading-tight sm:leading-snug line-clamp-1 sm:line-clamp-none">
                    {cat.title[lang]}
                  </h3>
                  <div className="mt-1.5 sm:mt-3 inline-flex items-center text-[9px] sm:text-[11px] font-display tracking-[0.14em] sm:tracking-[0.18em] uppercase text-white/80 group-hover:text-[#DEA43E] transition-colors">
                    <span>{lang === 'de' ? 'Entdecken' : 'Explore'}</span>
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
