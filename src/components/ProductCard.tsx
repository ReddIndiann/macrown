import { useState } from 'react';
import type { Product, Lang } from '../data';

interface ProductCardProps {
  product: Product;
  lang: Lang;
  t: any;
  onPreview: (product: Product) => void;
  onAddToCart?: (product: Product, selectedLength: string) => void;
}

export default function ProductCard({
  product,
  lang,
  onPreview,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const name = product.name[lang];
  const priceFormatted = (product.price / 100).toFixed(2).replace('.', ',') + ' €';
  const originalPriceFormatted = product.originalPrice
    ? (product.originalPrice / 100).toFixed(2).replace('.', ',') + ' €'
    : null;

  const isOutOfStock =
    product.stockStatus === 'out_of_stock' ||
    (product.stockQuantity !== undefined && product.stockQuantity === 0);
  const isLowStock =
    product.stockStatus === 'low_stock' ||
    (product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 3);

  // Lengths range e.g. "20" – 30""
  const lengthsRange = product.lengths.length > 1
    ? `${product.lengths[0]} – ${product.lengths[product.lengths.length - 1]}`
    : product.lengths[0];

  return (
    <article
      onClick={() => onPreview(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-[#FFFFFF] rounded-[2px] overflow-hidden border border-[#E8E6E1] hover:border-[#D5D0C6] luxury-hover flex flex-col justify-between cursor-pointer h-full transition-all duration-300"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F3EF]">
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="text-[7.5px] sm:text-[9px] font-display uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold bg-rose-900 text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-[1px] shadow-sm">
              {lang === 'de' ? 'Ausverkauft' : 'Sold Out'}
            </span>
          ) : isLowStock ? (
            <span className="text-[7.5px] sm:text-[9px] font-display uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold bg-amber-700 text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-[1px] shadow-sm">
              {lang === 'de' ? 'Nur wenige' : 'Low Stock'}
            </span>
          ) : product.badge ? (
            <span className="text-[7.5px] sm:text-[9px] font-display uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold bg-[#0D0D0D]/90 text-[#DEA43E] border border-[#DEA43E]/40 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-[1px] shadow-sm backdrop-blur-xs">
              {product.badge[lang]}
            </span>
          ) : null}
        </div>

        {/* Top Right: Lace or Grade */}
        {product.laceType ? (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 pointer-events-none">
            <span className="text-[7.5px] sm:text-[8.5px] font-display uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold bg-white/95 backdrop-blur-xs text-[#0D0D0D] px-1.5 sm:px-2 py-0.5 rounded-[1px] border border-[#E8E6E1] shadow-xs">
              HD LACE
            </span>
          </div>
        ) : product.hairType ? (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 pointer-events-none">
            <span
              className={`text-[7.5px] sm:text-[8.5px] font-display uppercase tracking-[0.14em] sm:tracking-[0.16em] font-semibold px-1.5 sm:px-2 py-0.5 rounded-[1px] shadow-xs ${
                product.hairType === 'Lux Hair'
                  ? 'bg-[#FDF9F0] text-[#9E6F1E] border border-[#DEA43E]/40'
                  : 'bg-white/95 text-[#0D0D0D] border border-[#E8E6E1]'
              }`}
            >
              {product.hairType}
            </span>
          </div>
        ) : null}

        {/* Quick View Slide-up Overlay on Hover */}
        <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 z-10 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none hidden sm:block">
          <div className="w-full py-1.5 sm:py-2 bg-white/95 backdrop-blur-xs text-[#0D0D0D] text-[9px] sm:text-[10px] font-display uppercase tracking-widest font-bold text-center rounded-[1px] shadow-md border border-[#E8E6E1]">
            {lang === 'de' ? 'Schnellansicht' : 'Quick View'}
          </div>
        </div>

        {/* Hover Quick View Button */}
        <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
          <div className="w-full py-2 sm:py-2.5 px-2 sm:px-4 bg-white/95 backdrop-blur-xs text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#DEA43E] text-[9.5px] sm:text-[10.5px] font-display uppercase tracking-[0.18em] sm:tracking-[0.22em] font-bold rounded-[1px] shadow-md transition-all duration-200 border border-[#E8E6E1] flex items-center justify-center gap-1.5 sm:gap-2">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{lang === 'de' ? 'Schnellansicht' : 'Quick View'}</span>
          </div>
        </div>
      </div>

      {/* Clean Info Body */}
      <div className="p-2.5 sm:p-4 md:p-5 flex-1 flex flex-col justify-between bg-[#FFFFFF]">
        <div>
          {/* Category / Texture & Reviews */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-display text-[8px] sm:text-[9.5px] uppercase tracking-[0.14em] sm:tracking-[0.2em] font-semibold text-[#8B6B23] truncate mr-1">
              {product.hairType}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 text-[9.5px] sm:text-[11px] text-[#DEA43E] shrink-0">
              <span className="text-amber-500">★</span>
              <span className="font-semibold text-[#0D0D0D]">{product.rating.toFixed(1)}</span>
              <span className="text-[#8E8E8E] text-[8.5px] sm:text-[10px]">({product.reviews})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-[13px] sm:text-[16px] md:text-[17px] text-[#0D0D0D] font-normal leading-snug line-clamp-2 group-hover:text-[#DEA43E] transition-colors mb-1.5 sm:mb-2 min-h-[2.1rem] sm:min-h-[2.6rem]">
            {name}
          </h3>
        </div>

        {/* Price & Lengths Info Row */}
        <div className="pt-2 sm:pt-3 border-t border-[#F0EEE9] flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="font-serif text-sm sm:text-lg md:text-xl font-normal text-[#0D0D0D] tracking-tight whitespace-nowrap">
              {priceFormatted}
            </span>
            {originalPriceFormatted && (
              <span className="text-[10px] sm:text-xs text-[#9E9891] line-through font-light hidden sm:inline">
                {originalPriceFormatted}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[8.5px] sm:text-[10.5px] text-[#7A7A7A] font-display uppercase tracking-wider truncate">
            <span>{lengthsRange}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
