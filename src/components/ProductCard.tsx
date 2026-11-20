import { useState } from 'react';
import type { Product, Lang } from '../data';

interface ProductCardProps {
  product: Product;
  lang: Lang;
  t: any;
  onAddToCart: (product: Product, selectedLength: string) => void;
}

export default function ProductCard({ product, lang, t, onAddToCart }: ProductCardProps) {
  const [selectedLength, setSelectedLength] = useState(product.lengths[0]);
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const name = product.name[lang];
  const priceFormatted = (product.price / 100).toFixed(2).replace('.', ',') + ' €';
  const originalPriceFormatted = product.originalPrice
    ? (product.originalPrice / 100).toFixed(2).replace('.', ',') + ' €'
    : null;

  const isOutOfStock = product.stockStatus === 'out_of_stock' || (product.stockQuantity !== undefined && product.stockQuantity === 0);
  const isLowStock = product.stockStatus === 'low_stock' || (product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 3);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedLength);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1400);
  };

  return (
    <article
      className="group relative bg-[#FFFFFF] rounded-[2px] overflow-hidden border border-[#E8E6E1] shadow-xs luxury-hover flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F3EF]">
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={name}
          className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-104"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {isOutOfStock ? (
            <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold bg-rose-900 text-white px-2 py-0.5 rounded-[1px] shadow-xs">
              {lang === 'de' ? 'Ausverkauft' : 'Sold Out'}
            </span>
          ) : isLowStock ? (
            <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-[1px] shadow-xs">
              {lang === 'de' ? 'Nur noch wenige' : 'Low Stock'}
            </span>
          ) : product.badge ? (
            <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold bg-[#0D0D0D] text-[#DEA43E] px-2 py-0.5 rounded-[1px] shadow-xs">
              {product.badge[lang]}
            </span>
          ) : null}
          {product.hairType && (
            <span
              className={`text-[8.5px] font-display uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-[1px] ${
                product.hairType === 'Lux Hair'
                  ? 'bg-[#FDF9F0] text-[#9E6F1E] border border-[#DEA43E]/40'
                  : 'bg-[#FFFFFF] text-[#0D0D0D] border border-[#E8E6E1]'
              }`}
            >
              {product.hairType}
            </span>
          )}
        </div>

        {/* Lace Type Pill */}
        {product.laceType && (
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[8.5px] font-display uppercase tracking-[0.2em] font-bold bg-white/95 backdrop-blur-xs text-[#0D0D0D] px-2 py-0.5 rounded-[1px] border border-[#E8E6E1]">
              HD LACE
            </span>
          </div>
        )}
      </div>

      {/* Product Information Details */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-[#FFFFFF]">
        <div>
          {/* Reviews & Texture Bar */}
          <div className="flex items-center justify-between text-xs text-[#7A7A7A] mb-2">
            <span className="font-display tracking-[0.18em] uppercase text-[9.5px] text-[#DEA43E] font-semibold">
              {product.texture}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#DEA43E]">
              <span>★</span>
              <span className="font-medium text-[#0D0D0D]">{product.rating.toFixed(1)}</span>
              <span className="text-[#8E8E8E] text-[10px]">({product.reviews})</span>
            </div>
          </div>

          {/* Product Name in Lustria serif */}
          <h3 className="font-serif text-lg text-[#0D0D0D] font-normal leading-snug line-clamp-2 mb-2 group-hover:text-[#DEA43E] transition-colors">
            {name}
          </h3>

          {/* Description */}
          <p className="font-sans text-xs text-[#666666] line-clamp-2 font-light leading-relaxed mb-4">
            {product.description[lang]}
          </p>
        </div>

        <div>
          {/* Length Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] text-[#7A7A7A] mb-1.5 font-display uppercase tracking-wider">
              <span>{t.shopSection.lengthsLabel}</span>
              <span className="font-semibold text-[#0D0D0D]">{selectedLength}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {product.lengths.map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setSelectedLength(len)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-[1px] transition-all font-mono ${
                    selectedLength === len
                      ? 'bg-[#0D0D0D] text-white font-medium'
                      : 'bg-[#F9F8F6] text-[#4A4A4A] border border-[#E8E6E1] hover:border-[#0D0D0D]'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Add to Bag Row */}
          <div className="pt-3 border-t border-[#E8E6E1] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-xl font-normal text-[#0D0D0D]">
                  {priceFormatted}
                </span>
                {originalPriceFormatted && (
                  <span className="text-[11px] text-[#9E9891] line-through font-light">
                    {originalPriceFormatted}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock || addedAnimation}
              className={`px-3.5 py-2 rounded-[2px] text-[10px] font-display uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                isOutOfStock
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                  : addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D]'
              }`}
            >
              {isOutOfStock ? (
                <span>{lang === 'de' ? 'Ausverkauft' : 'Sold Out'}</span>
              ) : addedAnimation ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{lang === 'de' ? 'Hinzugefügt' : 'Added'}</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>{lang === 'de' ? 'In die Tasche' : 'Add to Bag'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
