import { CATEGORIES_DATA } from '../data';
import type { Lang } from '../data';

interface CategoriesProps {
  lang: Lang;
  t: any;
  onSelectCategory: (categoryId: string) => void;
}

export default function Categories({ lang, t, onSelectCategory }: CategoriesProps) {
  return (
    <section id="categories" className="py-20 lg:py-24 bg-[#F9F8F6] border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-[11px] font-display tracking-[0.28em] text-[#DEA43E] font-semibold uppercase">
              {t.categoriesSection.badge}
            </span>
            <span className="w-6 h-px bg-[#DEA43E]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0D0D0D] font-normal tracking-tight">
            {t.categoriesSection.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#666666] font-light">
            {t.categoriesSection.sub}
          </p>
        </div>

        {/* Categories 4-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group cursor-pointer relative rounded-[2px] overflow-hidden bg-[#FFFFFF] border border-[#E8E6E1] shadow-xs luxury-hover"
            >
              {/* Aspect Ratio 4:5 image container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F3EF]">
                <img
                  src={cat.image}
                  alt={cat.title[lang]}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-106"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/85 via-[#0D0D0D]/25 to-transparent transition-opacity group-hover:opacity-90" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-left text-white">
                  <span className="text-[9.5px] font-display uppercase tracking-[0.25em] text-[#DEA43E] block mb-1 font-semibold">
                    {cat.subtitle[lang]}
                  </span>
                  <h3 className="font-serif text-xl font-normal text-white group-hover:text-[#DEA43E] transition-colors leading-snug">
                    {cat.title[lang]}
                  </h3>
                  <div className="mt-3 inline-flex items-center text-[11px] font-display tracking-[0.18em] uppercase text-white/80 group-hover:text-[#DEA43E] transition-colors">
                    <span>{lang === 'de' ? 'Kategorie entdecken' : 'Explore Category'}</span>
                    <svg className="w-3 h-3 ml-1.5 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
