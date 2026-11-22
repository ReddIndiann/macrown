import { useState } from 'react';
import type { Product, Lang, Order } from '../data';
import PrintableReceipt from './PrintableReceipt';

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
  onClearCart?: () => void;
  lang: Lang;
  t: any;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  lang,
  t,
}: CartDrawerProps) {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
  });

  if (!isOpen) return null;

  const totalCents = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalFormatted = (totalCents / 100).toFixed(2).replace('.', ',') + ' €';

  const threshold = t.cart.freeShippingThreshold || 15000;
  const remainingForFreeShipping = Math.max(0, threshold - totalCents);
  const progressPercent = Math.min(100, (totalCents / threshold) * 100);

  // Generate WhatsApp manifest
  const handleWhatsAppOrder = () => {
    const itemList = items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product.name[lang]} (${i.selectedLength}) – ${((i.product.price * i.quantity) / 100).toFixed(2).replace('.', ',')} €`
      )
      .join('\n');

    const msg = encodeURIComponent(
      lang === 'de'
        ? `Hallo Macrown Atelier ✨ Ich möchte gerne folgende Bestellung aufgeben:\n\n${itemList}\n\nGesamtsumme: ${totalFormatted}\n(Kostenloser versicherter DHL Express Versand)\n\nBitte teilt mir die Zahlungsmöglichkeiten und Lieferzeit mit!`
        : `Hello Macrown Atelier ✨ I would like to place the following order:\n\n${itemList}\n\nTotal: ${totalFormatted}\n(Free Insured DHL Express Shipping)\n\nPlease advise on payment and delivery timeline!`
    );

    window.open(`https://wa.me/491728123222?text=${msg}`, '_blank');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = 'MC-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceNum = 'INV-2026-' + generatedId.replace('MC-', '');
    const calculatedTax = Math.round(totalCents - totalCents / 1.19);

    const newOrder: Order = {
      id: generatedId,
      invoiceNumber: invoiceNum,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: formData.fullName || 'Kundin',
        email: formData.email || 'kundin@macrown.org',
        phone: formData.phone || '+49 170 1234567',
        street: formData.street || 'Königsallee 1',
        city: formData.city || 'Düsseldorf',
        postalCode: formData.postalCode || '40212',
        country: formData.country || 'Deutschland',
      },
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        category: i.product.category,
        price: i.product.price,
        quantity: i.quantity,
        selectedLength: i.selectedLength,
        hairType: i.product.hairType,
        laceType: i.product.laceType,
        image: i.product.image,
      })),
      paymentMethod: 'paypal',
      transactionId: 'PP-TX-' + Math.floor(10000000 + Math.random() * 90000000),
      subtotalCents: totalCents,
      shippingCents: 0,
      totalCents: totalCents,
      taxCents: calculatedTax,
      status: 'paid',
    };

    try {
      const stored = localStorage.getItem('macrown_orders');
      const parsed: Order[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('macrown_orders', JSON.stringify([newOrder, ...parsed]));
    } catch (err) {
      console.warn('LocalStorage order write notice:', err);
    }

    setOrderId(generatedId);
    setCurrentOrder(newOrder);
    setOrderConfirmed(true);
  };

  const resetAndClose = () => {
    if (orderConfirmed) {
      onClearCart?.();
    }
    setIsCheckoutStep(false);
    setOrderConfirmed(false);
    setCurrentOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0D0D0D]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={resetAndClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFFFFF] shadow-2xl flex flex-col justify-between border-l border-[#E8E6E1]">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#E8E6E1] bg-[#FFFFFF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCheckoutStep && !orderConfirmed && (
                  <button
                    type="button"
                    onClick={() => setIsCheckoutStep(false)}
                    className="mr-1 text-[#7A7A7A] hover:text-[#0D0D0D] text-xs font-display uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    ←
                  </button>
                )}
                <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                  {orderConfirmed
                    ? (lang === 'de' ? 'Bestellbestätigung' : 'Order Confirmed')
                    : isCheckoutStep
                    ? (lang === 'de' ? 'Sichere Kasse' : 'Secure Checkout')
                    : t.cart.title}
                </span>
                {!orderConfirmed && !isCheckoutStep && (
                  <span className="text-[10px] font-mono bg-[#DEA43E]/20 text-[#9E6F1E] font-bold px-2 py-0.5 rounded-[2px]">
                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="p-1.5 text-[#7A7A7A] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Free Shipping Progress Indicator (only on cart step) */}
            {!isCheckoutStep && (
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
            )}
          </div>

          {/* MAIN BODY: Cart Items vs Checkout Form vs Order Confirmation */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#F9F8F6]">
            {/* 1. ORDER CONFIRMATION SCREEN */}
            {orderConfirmed ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 text-2xl">
                  ✓
                </div>
                <h3 className="font-serif text-2xl text-[#0D0D0D]">
                  {lang === 'de' ? 'Vielen Dank für dein Vertrauen!' : 'Thank you for your order!'}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed max-w-xs mx-auto">
                  {lang === 'de'
                    ? `Deine Atelier-Bestellung ${orderId} ist erfolgreich eingegangen. Wir bereiten dein echtes Rohhaar in Handarbeit für den DHL Expressversand vor.`
                    : `Your atelier order ${orderId} has been successfully received. We are preparing your raw hair piece by hand for DHL Express delivery.`}
                </p>

                <div className="bg-white p-4 rounded-[2px] border border-[#E8E6E1] text-left text-xs space-y-1.5">
                  <div className="flex justify-between text-[#7A7A7A]">
                    <span>{lang === 'de' ? 'Bestellnummer:' : 'Order ID:'}</span>
                    <strong className="font-mono text-[#0D0D0D]">{orderId}</strong>
                  </div>
                  <div className="flex justify-between text-[#7A7A7A]">
                    <span>{lang === 'de' ? 'Lieferung:' : 'Delivery:'}</span>
                    <span className="text-[#0D0D0D]">DHL Express (2–3 {lang === 'de' ? 'Werktage' : 'days'})</span>
                  </div>
                  <div className="flex justify-between text-[#7A7A7A]">
                    <span>{lang === 'de' ? 'Gesamtsumme:' : 'Total Amount:'}</span>
                    <strong className="font-serif text-sm text-[#0D0D0D]">{totalFormatted}</strong>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsReceiptOpen(true)}
                    className="w-full py-3 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white font-display text-xs uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <svg className="w-4 h-4 text-[#DEA43E] group-hover:text-[#0D0D0D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    <span>{lang === 'de' ? 'Offizielle Rechnung & Beleg drucken' : 'Print Official Receipt & Invoice'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full py-3 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] font-display text-xs uppercase tracking-wider font-bold rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>{lang === 'de' ? 'Bestellung via WhatsApp Concierge bestätigen' : 'Confirm via WhatsApp Concierge'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="w-full py-2.5 text-xs text-[#7A7A7A] hover:text-[#0D0D0D] font-display uppercase tracking-wider cursor-pointer"
                  >
                    {lang === 'de' ? 'Zurück zur Boutique' : 'Back to Store'}
                  </button>
                </div>
              </div>
            ) : isCheckoutStep ? (
              /* 2. CHECKOUT FORM */
              <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                <div className="bg-white p-4 rounded-[2px] border border-[#E8E6E1] space-y-3">
                  <span className="font-display uppercase tracking-wider text-[10px] text-[#DEA43E] font-bold block">
                    {lang === 'de' ? '1. Lieferadresse' : '1. Delivery Address'}
                  </span>

                  <div>
                    <label className="block text-[10.5px] uppercase font-display text-[#7A7A7A] mb-1">
                      {lang === 'de' ? 'Vollständiger Name' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Melodie Macrown"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] uppercase font-display text-[#7A7A7A] mb-1">
                        E-Mail *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="kundin@macrown.org"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] uppercase font-display text-[#7A7A7A] mb-1">
                        {lang === 'de' ? 'Telefon / Mobil' : 'Phone'} *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+49 170 ..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] uppercase font-display text-[#7A7A7A] mb-1">
                      {lang === 'de' ? 'Straße & Hausnummer' : 'Street & Number'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Königsallee 12"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10.5px] uppercase font-display text-[#7A7A7A] mb-1">
                        PLZ *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="40212"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10.5px] uppercase font-display text-[#7A7A7A] mb-1">
                        {lang === 'de' ? 'Stadt' : 'City'} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Düsseldorf"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. PAYPAL EXPRESS PAYMENT PANEL */}
                <div className="bg-[#FFFFFF] p-4 rounded-[2px] border border-[#003087]/25 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display uppercase tracking-wider text-[10px] text-[#003087] font-bold flex items-center gap-1.5">
                      <span className="font-serif italic font-extrabold text-sm text-[#003087]">P</span>
                      <span className="font-serif italic font-extrabold text-sm text-[#0079C1] -ml-1.5">P</span>
                      <span className="font-sans font-bold tracking-normal ml-0.5 text-xs text-[#0D0D0D]">PayPal Express Checkout</span>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9.5px] font-semibold rounded-[1px] border border-emerald-300">
                      ✓ Käuferschutz
                    </span>
                  </div>

                  <p className="text-[11px] text-[#666666] leading-relaxed">
                    {lang === 'de'
                      ? 'Zahle geschützt und schnell via PayPal (Konto, Lastschrift oder Kreditkarte über PayPal). Mit vollem Käuferschutz und sofortiger Auftragsbestätigung.'
                      : 'Pay securely and quickly via PayPal (account, direct debit, or card through PayPal). Full buyer protection and instant confirmation.'}
                  </p>

                  <div className="pt-2 border-t border-[#E8E6E1] flex items-center justify-between text-[10px] text-[#777777]">
                    <span>🔒 256-Bit SSL Verschlüsselung</span>
                    <span>⚡ DHL Express Priorität</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-display uppercase tracking-[0.2em] font-bold rounded-[2px] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="font-serif italic font-extrabold text-sm">PP</span>
                  <span>{lang === 'de' ? `Mit PayPal bezahlen (${totalFormatted})` : `Pay with PayPal (${totalFormatted})`}</span>
                </button>
              </form>
            ) : items.length === 0 ? (
              /* 3. EMPTY CART STATE */
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
                <h3 className="font-serif text-lg text-[#0D0D0D] font-normal mb-1">
                  {t.cart.emptyTitle}
                </h3>
                <p className="text-xs text-[#7A7A7A] font-light max-w-xs mx-auto">
                  {t.cart.emptySub}
                </p>
              </div>
            ) : (
              /* 4. CART ITEMS LIST */
              items.map((item) => {
                const itemPriceFormatted =
                  ((item.product.price * item.quantity) / 100).toFixed(2).replace('.', ',') + ' €';

                return (
                  <div
                    key={`${item.product.id}-${item.selectedLength}`}
                    className="flex gap-4 p-3 bg-[#FFFFFF] rounded-[2px] border border-[#E8E6E1] shadow-2xs"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name[lang]}
                      className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-[1px] bg-[#E8E6E1] shrink-0"
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
                            className="text-[#999999] hover:text-[#0D0D0D] text-xs p-1 cursor-pointer"
                            aria-label="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                        <span className="text-[11px] text-[#7A7A7A] block font-mono mt-0.5">
                          {lang === 'de' ? 'Länge:' : 'Length:'} {item.selectedLength}
                        </span>
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-[#E8E6E1] rounded-[1px] bg-[#FFFFFF]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.selectedLength, -1)}
                            className="px-2 py-0.5 text-xs text-[#7A7A7A] hover:text-[#0D0D0D] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-medium text-[#0D0D0D]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.selectedLength, 1)}
                            className="px-2 py-0.5 text-xs text-[#7A7A7A] hover:text-[#0D0D0D] cursor-pointer"
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

          {/* Footer Checkout Summary (only when in items view) */}
          {items.length > 0 && !isCheckoutStep && !orderConfirmed && (
            <div className="p-6 bg-white border-t border-[#E8E6E1] space-y-3">
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

              {/* Main Checkout Button */}
              <button
                type="button"
                onClick={() => setIsCheckoutStep(true)}
                className="w-full py-4 bg-[#0D0D0D] text-white text-[10px] font-display uppercase tracking-[0.25em] font-semibold rounded-[2px] hover:bg-[#DEA43E] hover:text-[#0D0D0D] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.cart.checkout}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>

              {/* VIP WhatsApp Express Order Button */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full py-3 bg-[#FDF9F0] text-[#0D0D0D] border border-[#DEA43E]/50 text-[10px] font-display uppercase tracking-[0.2em] font-semibold rounded-[2px] hover:bg-[#DEA43E] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="text-emerald-600 font-bold">●</span>
                <span>{lang === 'de' ? 'VIP WhatsApp Express-Bestellung' : 'VIP WhatsApp Express Order'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Official Printable Receipt Modal */}
      <PrintableReceipt
        order={currentOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        lang={lang}
      />
    </div>
  );
}
