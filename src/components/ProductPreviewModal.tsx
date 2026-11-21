import { useState, useEffect } from 'react';
import type { Product, Lang } from '../data';

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  t: any;
  onAddToCart: (product: Product, selectedLength: string) => void;
}

export default function ProductPreviewModal({
  product,
  isOpen,
  onClose,
  lang,
  t,
  onAddToCart,
}: ProductPreviewModalProps) {
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Sync state when product changes during render
  if (product && product.id !== currentProductId) {
    setCurrentProductId(product.id);
    setSelectedLength(product.lengths[0]);
    setSelectedImage(product.image);
    setQuantity(1);
    setAddedSuccess(false);
  }

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const name = product.name[lang];
  const priceFormatted = (product.price / 100).toFixed(2).replace('.', ',') + ' €';
  const originalPriceFormatted = product.originalPrice
    ? (product.originalPrice / 100).toFixed(2).replace('.', ',') + ' €'
    : null;

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const isOutOfStock = product.stockStatus === 'out_of_stock' || (product.stockQuantity !== undefined && product.stockQuantity === 0);
  const isLowStock = product.stockStatus === 'low_stock' || (product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 3);

  const images = [product.image, product.hoverImage].filter(Boolean) as string[];

  const handleAdd = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedLength);
    }
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0D0D0D]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className="relative bg-[#FFFFFF] w-full max-w-4xl rounded-[3px] shadow-2xl border border-[#E8E6E1] overflow-hidden my-8 z-10 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-[#0D0D0D] hover:text-white text-[#0D0D0D] border border-[#E8E6E1] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="bg-[#F4F3EF] p-6 lg:p-8 flex flex-col justify-between">
              {/* Main Image Stage */}
              <div className="relative aspect-[4/5] rounded-[2px] overflow-hidden bg-white shadow-xs border border-[#E8E6E1]">
                <img
                  src={selectedImage}
                  alt={name}
                  className="w-full h-full object-cover object-center"
                />

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  {isOutOfStock ? (
                    <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold bg-rose-900 text-white px-2.5 py-1 rounded-[1px] shadow-sm">
                      {lang === 'de' ? 'Ausverkauft' : 'Sold Out'}
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold bg-amber-700 text-white px-2.5 py-1 rounded-[1px] shadow-sm">
                      {lang === 'de' ? 'Nur noch wenige' : 'Low Stock'}
                    </span>
                  ) : product.badge ? (
                    <span className="text-[9px] font-display uppercase tracking-[0.2em] font-bold bg-[#0D0D0D] text-[#DEA43E] border border-[#DEA43E]/40 px-2.5 py-1 rounded-[1px] shadow-sm">
                      {product.badge[lang]}
                    </span>
                  ) : null}
                </div>

                {product.laceType && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[8.5px] font-display uppercase tracking-[0.2em] font-bold bg-white/95 backdrop-blur-xs text-[#0D0D0D] px-2 py-0.5 rounded-[1px] border border-[#E8E6E1]">
                      HD LACE
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2.5 mt-4 justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-20 rounded-[2px] overflow-hidden border transition-all cursor-pointer ${
                        selectedImage === img
                          ? 'border-[#0D0D0D] ring-1 ring-[#0D0D0D]'
                          : 'border-[#E8E6E1] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Configuration Details Column */}
            <div className="p-6 lg:p-8 flex flex-col justify-between bg-white max-h-[85vh] overflow-y-auto">
              <div>
                {/* Texture, Grade & Rating Header */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-display tracking-[0.2em] uppercase text-[10px] text-[#8B6B23] font-semibold">
                    {product.hairType} • {product.texture}
                  </span>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#DEA43E]">
                    <span>★</span>
                    <span className="font-semibold text-[#0D0D0D]">{product.rating.toFixed(1)}</span>
                    <span className="text-[#8E8E8E] text-[11px]">({product.reviews} {lang === 'de' ? 'Bewertungen' : 'Reviews'})</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="font-serif text-2xl lg:text-3xl text-[#0D0D0D] font-normal leading-tight mb-3">
                  {name}
                </h2>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 pb-4 mb-4 border-b border-[#F0EEE9]">
                  <span className="font-serif text-2xl lg:text-3xl font-normal text-[#0D0D0D]">
                    {priceFormatted}
                  </span>
                  {originalPriceFormatted && (
                    <span className="text-sm text-[#9E9891] line-through font-light">
                      {originalPriceFormatted}
                    </span>
                  )}
                  {discountPercentage ? (
                    <span className="text-[10px] font-display uppercase tracking-wider font-bold bg-[#FDF5E8] text-[#9E6F1E] border border-[#DEA43E]/40 px-2 py-0.5 rounded-[1px]">
                      -{discountPercentage}%
                    </span>
                  ) : null}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-[10.5px] font-display uppercase tracking-widest text-[#7A7A7A] mb-1.5 font-semibold">
                    {lang === 'de' ? 'Atelier Beschreibung' : 'Atelier Description'}
                  </h4>
                  <p className="font-sans text-xs text-[#555555] font-light leading-relaxed">
                    {product.description[lang]}
                  </p>
                </div>

                {/* Length Selector */}
                <div className="mb-6 pt-4 border-t border-[#F0EEE9]">
                  <div className="flex items-center justify-between text-xs mb-2 font-display uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#7A7A7A]">{lang === 'de' ? 'Länge wählen:' : 'Select Length:'}</span>
                      <span className="font-bold text-[#0D0D0D] font-sans text-sm">{selectedLength}</span>
                    </span>
                    <span className="text-[10px] text-[#8E8E8E] lowercase tracking-normal">
                      {lang === 'de' ? '100% echthaar-länge' : 'true-to-length guarantee'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {product.lengths.map((len) => {
                      const isSelected = selectedLength === len;
                      return (
                        <button
                          key={len}
                          type="button"
                          onClick={() => setSelectedLength(len)}
                          className={`py-2 px-3 text-center rounded-[2px] text-xs font-sans transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0D0D0D] text-[#DEA43E] border border-[#0D0D0D] font-bold shadow-xs'
                              : 'bg-[#F9F8F6] text-[#4A4A4A] border border-[#E8E6E1] hover:border-[#0D0D0D] hover:bg-white'
                          }`}
                        >
                          {len}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-6 text-xs">
                  <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                  <span className="font-light text-[#555555]">
                    {isOutOfStock
                      ? (lang === 'de' ? 'Derzeit ausverkauft' : 'Currently Sold Out')
                      : (lang === 'de' ? 'Auf Lager – Fertig für den DHL Expressversand' : 'In Stock – Ready for DHL Express')}
                  </span>
                </div>
              </div>

              {/* Action Area: Quantity & Add to Cart */}
              <div className="pt-4 border-t border-[#E8E6E1]">
                <div className="flex items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-[#E8E6E1] rounded-[2px] bg-[#F9F8F6]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3 py-2 text-xs text-[#0D0D0D] hover:bg-white disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      −
                    </button>
                    <span className="px-3 py-2 text-xs font-semibold text-[#0D0D0D] min-w-[2rem] text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={isOutOfStock}
                      className="px-3 py-2 text-xs text-[#0D0D0D] hover:bg-white disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Bag Button */}
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isOutOfStock || addedSuccess}
                    className={`flex-1 py-3.5 px-6 rounded-[2px] text-xs font-display uppercase tracking-[0.25em] font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isOutOfStock
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                        : addedSuccess
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D]'
                    }`}
                  >
                    {isOutOfStock ? (
                      <span>{lang === 'de' ? 'Ausverkauft' : 'Sold Out'}</span>
                    ) : addedSuccess ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{lang === 'de' ? 'In der Tasche!' : 'Added to Bag!'}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>{lang === 'de' ? 'In die Tasche' : (t?.shopSection?.addToBag || 'Add to Bag')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* VIP WhatsApp Consultation Shortcut */}
                <a
                  href={`https://wa.me/491728123222?text=${encodeURIComponent(
                    lang === 'de'
                      ? `Hallo Macrown Atelier ✨ Ich interessiere mich für "${name}" in Länge ${selectedLength}. Könnt ihr mich dazu beraten?`
                      : `Hello Macrown Atelier ✨ I am interested in "${name}" in length ${selectedLength}. Could you advise me?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full mt-3 py-2.5 px-4 rounded-[2px] text-[10.5px] font-display uppercase tracking-wider font-semibold border border-[#DEA43E]/50 text-[#0D0D0D] hover:bg-[#FDF9F0] transition-colors flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'de' ? 'VIP WhatsApp Beratung zu diesem Modell' : 'VIP WhatsApp Consultation for this piece'}</span>
                </a>

                {/* Atelier Guarantees micro-strip */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[#F0EEE9] text-[10px] text-[#7A7A7A] font-display uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#DEA43E]">✓</span>
                    <span>100% Reines Echthaar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#DEA43E]">✓</span>
                    <span>Schweizer HD-Lace</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#DEA43E]">✓</span>
                    <span>DHL Express Versand</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#DEA43E]">✓</span>
                    <span>Atelier-Zertifiziert</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
