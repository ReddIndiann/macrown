import { useState, useMemo } from 'react';
import type { Product, Lang } from '../data';
import { LANG } from '../data';
import ProductCard from './ProductCard';

interface ShopPageProps {
  products: Product[];
  lang: Lang;
  onAddToCart: (product: Product, selectedLength: string) => void;
  onNavigateHome: () => void;
}

export default function ShopPage({
  products,
  lang,
  onAddToCart,
  onNavigateHome,
}: ShopPageProps) {
  const t = LANG[lang];

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHairType, setSelectedHairType] = useState<string>('all');
  const [selectedTexture, setSelectedTexture] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [gridCols, setGridCols] = useState<3 | 4>(3);

  // Available categories with counts
  const categories = useMemo(() => [
    { id: 'all', labelDe: 'Alle Kollektionen', labelEn: 'All Collections' },
    { id: 'wigs', labelDe: 'Perücken (Wigs)', labelEn: 'Wigs' },
    { id: 'bundles', labelDe: 'Haarbündel (Bundles)', labelEn: 'Hair Bundles' },
    { id: 'closure-frontal', labelDe: 'Closure & Frontal', labelEn: 'Closure & Frontal' },
    { id: 'ponytail', labelDe: 'Ponytails', labelEn: 'Ponytails' },
  ], []);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.name.de.toLowerCase().includes(q) ||
          p.name.en.toLowerCase().includes(q) ||
          p.texture.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.lengths.some((len) => len.toLowerCase().includes(q));

        // Category filter
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        // Hair type filter
        const matchesHairType = selectedHairType === 'all' || p.hairType === selectedHairType;

        // Texture filter
        const matchesTexture = selectedTexture === 'all' || p.texture.toLowerCase().includes(selectedTexture.toLowerCase());

        return matchesSearch && matchesCategory && matchesHairType && matchesTexture;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default: featured / bestseller (reviews count)
        return b.reviews - a.reviews;
      });
  }, [products, searchQuery, selectedCategory, selectedHairType, selectedTexture, sortBy]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedHairType !== 'all' ||
    selectedTexture !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedHairType('all');
    setSelectedTexture('all');
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D]">
      {/* SHOP PAGE HERO BANNER */}
      <div className="bg-[#0D0D0D] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#DEA43E]/30 relative overflow-hidden">
        {/* Ambient subtle Gold Glow */}
        <div className="absolute top-0 right-1/4 -z-0 w-96 h-96 bg-[#DEA43E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-white/50 mb-6 font-display uppercase tracking-wider">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-[#DEA43E] transition-colors"
            >
              {lang === 'de' ? 'Startseite' : 'Home'}
            </button>
            <span>/</span>
            <span className="text-[#DEA43E] font-semibold">
              {lang === 'de' ? 'Online-Shop' : 'Shop'}
            </span>
            {selectedCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="text-white/80 capitalize">
                  {categories.find((c) => c.id === selectedCategory)?.[lang === 'de' ? 'labelDe' : 'labelEn']}
                </span>
              </>
            )}
          </nav>

          {/* Heading */}
          <div className="max-w-3xl">
            <span className="text-[10px] sm:text-xs font-display tracking-[0.3em] uppercase text-[#DEA43E] font-semibold block mb-2">
              {lang === 'de' ? 'HAUTE COIFFURE KATALOG • 100% ECHTHAAR' : 'HAUTE COIFFURE CATALOG • 100% HUMAN HAIR'}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-normal tracking-[0.03em] leading-tight mb-4">
              {lang === 'de' ? 'Die Atelier Kollektion' : 'The Atelier Collection'}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-white/70 font-light leading-relaxed max-w-2xl">
              {lang === 'de'
                ? 'Handverlesenes, 100% chemiefreies Rohhaar & HD-Lace Perücken aus unserer vietnamesischen Partnermanufaktur. Höchste Schuppenschicht-Intaktheit für unvergleichlichen Seidenglanz.'
                : 'Masterfully curated, 100% non-chemical raw hair and HD lace wigs directly from our atelier in Vietnam. Intact cuticles for incomparable natural silk sheen.'}
            </p>
          </div>

          {/* Category Quick Selector Pills */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = cat.id === 'all'
                ? products.length
                : products.filter((p) => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#DEA43E] text-[#0D0D0D] font-bold shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                  }`}
                >
                  <span>{lang === 'de' ? cat.labelDe : cat.labelEn}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-[1px] ${
                    isActive ? 'bg-[#0D0D0D] text-[#DEA43E]' : 'bg-black/40 text-white/70'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E1] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={lang === 'de' ? 'Kollektion durchsuchen (Name, Textur, Länge)...' : 'Search collection (name, texture, length)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] pl-9 pr-8 py-2 text-xs text-[#0D0D0D] placeholder-[#888888] focus:outline-none focus:border-[#DEA43E]"
            />
            <svg
              className="w-4 h-4 text-[#888888] absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#888888] hover:text-black text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Granular Filters & Sorters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Hair Grade Filter (Lux vs Virgin) */}
            <select
              value={selectedHairType}
              onChange={(e) => setSelectedHairType(e.target.value)}
              className="bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-1.5 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
            >
              <option value="all">{lang === 'de' ? 'Haarqualität: Alle' : 'Grade: All'}</option>
              <option value="Lux Hair">Lux Hair</option>
              <option value="Virgin Hair">Virgin Hair</option>
            </select>

            {/* Texture Filter */}
            <select
              value={selectedTexture}
              onChange={(e) => setSelectedTexture(e.target.value)}
              className="bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-1.5 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
            >
              <option value="all">{lang === 'de' ? 'Textur: Alle' : 'Texture: All'}</option>
              <option value="Straight">Silky Straight</option>
              <option value="Body Wave">Body Wave</option>
              <option value="Deep Wave">Deep Wave</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-1.5 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E] font-medium"
            >
              <option value="featured">{lang === 'de' ? 'Sortierung: Bestseller' : 'Sort: Bestsellers'}</option>
              <option value="price-asc">{lang === 'de' ? 'Preis: Aufsteigend' : 'Price: Low to High'}</option>
              <option value="price-desc">{lang === 'de' ? 'Preis: Absteigend' : 'Price: High to Low'}</option>
              <option value="rating">{lang === 'de' ? 'Beste Bewertung' : 'Top Rated'}</option>
            </select>

            {/* Grid Column Selector (Desktop) */}
            <div className="hidden lg:flex items-center border border-[#E8E6E1] rounded-[2px] bg-[#F9F8F6] p-0.5">
              <button
                type="button"
                onClick={() => setGridCols(3)}
                className={`p-1.5 rounded-[1px] text-xs transition-colors ${
                  gridCols === 3 ? 'bg-white text-[#0D0D0D] shadow-2xs' : 'text-[#7A7A7A] hover:text-[#0D0D0D]'
                }`}
                title="3 Spalten"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h4v16H4V4zm6 0h4v16h-4V4zm6 0h4v16h-4V4z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setGridCols(4)}
                className={`p-1.5 rounded-[1px] text-xs transition-colors ${
                  gridCols === 4 ? 'bg-white text-[#0D0D0D] shadow-2xs' : 'text-[#7A7A7A] hover:text-[#0D0D0D]'
                }`}
                title="4 Spalten"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h3v16H3V4zm5 0h3v16H8V4zm5 0h3v16h-3V4zm5 0h3v16h-3V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Bar if active */}
        {hasActiveFilters && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex items-center justify-between text-xs text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0D0D0D]">
                {filteredProducts.length} {lang === 'de' ? 'Ergebnisse gefunden' : 'results found'}
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-rose-600 hover:underline font-display text-[11px] uppercase tracking-wider font-semibold cursor-pointer"
            >
              {lang === 'de' ? '✕ Filter zurücksetzen' : '✕ Reset all filters'}
            </button>
          </div>
        )}
      </div>

      {/* PRODUCTS MAIN STAGE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {filteredProducts.length > 0 ? (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            } gap-6 lg:gap-8`}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                t={t}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="py-24 text-center max-w-md mx-auto">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="font-serif text-2xl text-[#0D0D0D] mb-2">
              {lang === 'de' ? 'Keine passenden Produkte gefunden' : 'No matching products found'}
            </h3>
            <p className="text-xs text-[#7A7A7A] mb-6">
              {lang === 'de'
                ? 'Versuche deine Suchbegriffe oder Filterkriterien anzupassen, um die gesamte Kollektion zu sehen.'
                : 'Try adjusting your search terms or filters to view the full atelier collection.'}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-xs font-display uppercase tracking-widest font-semibold rounded-[2px] transition-colors"
            >
              {lang === 'de' ? 'Alle Kollektionen anzeigen' : 'View All Collections'}
            </button>
          </div>
        )}
      </div>

      {/* ATELIER TRUST PILLARS */}
      <div className="border-t border-[#E8E6E1] bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <span className="text-2xl mb-2 block">✨</span>
            <h4 className="font-serif text-sm font-semibold text-[#0D0D0D] mb-1">
              100% Rohhaar
            </h4>
            <p className="text-[11px] text-[#7A7A7A]">
              {lang === 'de' ? 'Unverarbeitetes Einzelspenderhaar' : 'Untreated single-donor hair'}
            </p>
          </div>
          <div className="p-4">
            <span className="text-2xl mb-2 block">💎</span>
            <h4 className="font-serif text-sm font-semibold text-[#0D0D0D] mb-1">
              Swiss Melt HD Lace
            </h4>
            <p className="text-[11px] text-[#7A7A7A]">
              {lang === 'de' ? 'Unsichtbare Haarlinie für alle Hauttöne' : 'Seamless hairline for all skin tones'}
            </p>
          </div>
          <div className="p-4">
            <span className="text-2xl mb-2 block">🚚</span>
            <h4 className="font-serif text-sm font-semibold text-[#0D0D0D] mb-1">
              Gratis Versand ab 150 €
            </h4>
            <p className="text-[11px] text-[#7A7A7A]">
              {lang === 'de' ? 'Sicherer DHL Express Versand' : 'Insured DHL Express delivery'}
            </p>
          </div>
          <div className="p-4">
            <span className="text-2xl mb-2 block">👑</span>
            <h4 className="font-serif text-sm font-semibold text-[#0D0D0D] mb-1">
              VIP Atelier Beratung
            </h4>
            <p className="text-[11px] text-[#7A7A7A]">
              +49 172 812 3222 (WhatsApp)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
