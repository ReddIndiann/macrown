import { useState } from 'react';
import ProductCard from './ProductCard';
import { PRODUCTS } from '../data';
import type { Product, Lang } from '../data';

interface ProductGridProps {
  products?: Product[];
  lang: Lang;
  t: any;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onAddToCart: (product: Product, length: string) => void;
  onViewMore?: () => void;
  previewLimit?: number;
}

export default function ProductGrid({
  products = PRODUCTS,
  lang,
  t,
  activeCategory,
  onSelectCategory,
  onAddToCart,
  onViewMore,
  previewLimit = 4,
}: ProductGridProps) {
  const [hairTypeFilter, setHairTypeFilter] = useState<'all' | 'Lux Hair' | 'Virgin Hair'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Filter products by category & hair grade
  let filtered = products.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) {
      return false;
    }
    if (hairTypeFilter !== 'all' && p.hairType !== hairTypeFilter) {
      return false;
    }
    return true;
  });

  // Sort products
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <section id="shop" className="py-20 lg:py-24 bg-[#FFFFFF] border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#DEA43E]" />
            <span className="text-[10px] sm:text-[11px] font-display tracking-[0.28em] text-[#DEA43E] font-semibold uppercase">
              {t.shopSection.badge}
            </span>
            <span className="w-6 h-px bg-[#DEA43E]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0D0D0D] font-normal tracking-tight">
            {t.shopSection.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#666666] font-light">
            {t.shopSection.sub}
          </p>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-[#E8E6E1]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: t.shopSection.filters.all },
              { id: 'wigs', label: t.shopSection.filters.wigs },
              { id: 'bundles', label: t.shopSection.filters.bundles },
              { id: 'closure-frontal', label: t.shopSection.filters['closure-frontal'] },
              { id: 'ponytail', label: t.shopSection.filters.ponytail },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                className={`px-4 py-2 rounded-[2px] text-[11px] font-display uppercase tracking-[0.2em] font-medium transition-all ${
                  activeCategory === tab.id
                    ? 'bg-[#0D0D0D] text-white shadow-xs'
                    : 'bg-[#FFFFFF] text-[#4A4A4A] hover:text-[#0D0D0D] border border-[#E8E6E1] hover:border-[#0D0D0D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub Filters: Hair Grade & Sorting */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Hair Grade Pill Filter */}
            <div className="flex items-center bg-[#F9F8F6] p-0.5 rounded-[2px] border border-[#E8E6E1] text-[10.5px] font-display uppercase tracking-wider font-semibold">
              <button
                type="button"
                onClick={() => setHairTypeFilter('all')}
                className={`px-2.5 py-1 rounded-[1px] transition-all ${
                  hairTypeFilter === 'all'
                    ? 'bg-[#0D0D0D] text-white'
                    : 'text-[#666666] hover:text-[#0D0D0D]'
                }`}
              >
                {lang === 'de' ? 'Alle' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setHairTypeFilter('Lux Hair')}
                className={`px-2.5 py-1 rounded-[1px] transition-all ${
                  hairTypeFilter === 'Lux Hair'
                    ? 'bg-[#DEA43E] text-[#0D0D0D]'
                    : 'text-[#666666] hover:text-[#0D0D0D]'
                }`}
              >
                Lux Hair
              </button>
              <button
                type="button"
                onClick={() => setHairTypeFilter('Virgin Hair')}
                className={`px-2.5 py-1 rounded-[1px] transition-all ${
                  hairTypeFilter === 'Virgin Hair'
                    ? 'bg-[#0D0D0D] text-white'
                    : 'text-[#666666] hover:text-[#0D0D0D]'
                }`}
              >
                Virgin
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FFFFFF] border border-[#E8E6E1] rounded-[2px] px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
            >
              <option value="featured">{lang === 'de' ? 'Empfohlen' : 'Featured'}</option>
              <option value="price-asc">{lang === 'de' ? 'Preis: Aufsteigend' : 'Price: Low to High'}</option>
              <option value="price-desc">{lang === 'de' ? 'Preis: Absteigend' : 'Price: High to Low'}</option>
              <option value="rating">{lang === 'de' ? 'Beste Bewertung' : 'Top Rated'}</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#7A7A7A] font-light">
              {lang === 'de'
                ? 'Keine Produkte gefunden. Bitte wähle eine andere Filterkombination.'
                : 'No products match the selected criteria.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.slice(0, previewLimit).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  t={t}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>

            {/* View Full Collection / More Button */}
            {onViewMore && (
              <div className="mt-14 text-center flex flex-col items-center">
                <div className="flex items-center gap-2 text-xs text-[#7A7A7A] mb-4 font-display uppercase tracking-widest">
                  <span className="w-8 h-px bg-[#E8E6E1]" />
                  <span>
                    {lang === 'de'
                      ? `Atelier-Vorschau: ${Math.min(previewLimit, filtered.length)} von ${products.length} Kollektionsstücken`
                      : `Atelier Preview: ${Math.min(previewLimit, filtered.length)} of ${products.length} Collection Pieces`}
                  </span>
                  <span className="w-8 h-px bg-[#E8E6E1]" />
                </div>

                <button
                  type="button"
                  onClick={onViewMore}
                  className="inline-flex items-center gap-3 px-10 py-4 bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-xs font-display uppercase tracking-[0.25em] font-bold rounded-[2px] transition-all duration-300 shadow-md group cursor-pointer"
                >
                  <span>
                    {lang === 'de'
                      ? `Gesamten Shop ansehen (${products.length} Artikel)`
                      : `View Full Shop Collection (${products.length} Items)`}
                  </span>
                  <svg
                    className="w-4 h-4 transform transition-transform group-hover:translate-x-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
