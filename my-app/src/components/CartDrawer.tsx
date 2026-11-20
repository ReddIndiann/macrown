import type { Product, Lang } from '../data';

export interface CartItem {
  product: Product;
  selectedLength: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, selectedLength: string, delta: number) => void;
  onRemoveItem: (productId: string, selectedLength: string) => void;
  lang: Lang;
  t: any;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  lang,
  t,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalCents = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalFormatted = (totalCents / 100).toFixed(2).replace('.', ',') + ' €';

  const threshold = t.cart.freeShippingThreshold || 15000;
  const remainingForFreeShipping = Math.max(0, threshold - totalCents);
  const progressPercent = Math.min(100, (totalCents / threshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0D0D0D]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFFFFF] shadow-2xl flex flex-col justify-between border-l border-[#E8E6E1]">
          {/* Header */}
          <div className="p-6 border-b border-[#E8E6E1] bg-[#FFFFFF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                  {t.cart.title}
                </span>
                <span className="text-[10px] font-mono bg-[#DEA43E]/20 text-[#9E6F1E] font-bold px-2 py-0.5 rounded-[2px]">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#7A7A7A] hover:text-[#0D0D0D] transition-colors"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="mt-4 pt-3 border-t border-[#E8E6E1]">
              <div className="flex justify-between text-xs mb-1.5 font-display tracking-wider">
                <span className="text-[#0D0D0D] text-[11px]">
                  {remainingForFreeShipping === 0
                    ? t.cart.freeShippingUnlocked
                    : t.cart.freeShippingRemaining(remainingForFreeShipping)}
                </span>
                <span className="text-[#DEA43E] font-bold text-xs">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-[#E8E6E1] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#DEA43E] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9F8F6]">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto mb-4 rounded-[2px] bg-white border border-[#E8E6E1] flex items-center justify-center text-[#DEA43E]">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.2}
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z"
                    />
                  </svg>
                </div>
                <p className="text-xs text-[#7A7A7A] mb-6 font-light">{t.cart.empty}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#0D0D0D] text-white text-[10px] font-display uppercase tracking-[0.25em] font-semibold rounded-[2px] hover:bg-[#DEA43E] hover:text-[#0D0D0D] transition-colors"
                >
                  {t.cart.startShopping}
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const itemPriceFormatted =
                  ((item.product.price * item.quantity) / 100).toFixed(2).replace('.', ',') + ' €';

                return (
                  <div
                    key={`${item.product.id}-${item.selectedLength}-${index}`}
                    className="flex gap-4 p-3.5 bg-white rounded-[2px] border border-[#E8E6E1] shadow-xs"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name[lang]}
                      className="w-18 h-22 object-cover rounded-[1px] bg-[#F4F3EF] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-sm font-normal text-[#0D0D0D] line-clamp-1">
                            {item.product.name[lang]}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product.id, item.selectedLength)}
                            className="text-[#9E9891] hover:text-rose-600 transition-colors ml-2"
                            title="Entfernen"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[11px] text-[#7A7A7A] mt-0.5 font-display tracking-wider">
                          {lang === 'de' ? 'Länge:' : 'Length:'} <span className="font-semibold text-[#0D0D0D]">{item.selectedLength}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-[#E8E6E1] rounded-[1px] bg-[#FFFFFF]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.selectedLength, -1)}
                            className="px-2 py-0.5 text-xs text-[#7A7A7A] hover:text-[#0D0D0D]"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-medium text-[#0D0D0D]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.selectedLength, 1)}
                            className="px-2 py-0.5 text-xs text-[#7A7A7A] hover:text-[#0D0D0D]"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-serif text-sm font-normal text-[#0D0D0D]">
                          {itemPriceFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#E8E6E1] space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-display uppercase tracking-[0.2em] text-[#7A7A7A]">
                  {t.cart.subtotal}
                </span>
                <span className="font-serif text-2xl font-normal text-[#0D0D0D]">
                  {totalFormatted}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7A7A] font-light">
                {t.cart.shippingNotice}
              </p>
              <button
                type="button"
                onClick={() => {
                  alert(
                    lang === 'de'
                      ? 'Vielen Dank für deine Bestellung! Du wirst nun zur verschlüsselten Kasse weitergeleitet.'
                      : 'Thank you for your order! Redirecting to secure checkout.'
                  );
                }}
                className="w-full py-4 bg-[#0D0D0D] text-white text-[10px] font-display uppercase tracking-[0.25em] font-semibold rounded-[2px] hover:bg-[#DEA43E] hover:text-[#0D0D0D] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>{t.cart.checkout}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
