import { useState, useEffect } from 'react';
import type { Order, Lang } from '../data';

interface PrintableReceiptProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function PrintableReceipt({
  order,
  isOpen,
  onClose,
  lang,
}: PrintableReceiptProps) {
  const [docType, setDocType] = useState<'invoice' | 'packing_slip'>('invoice');
  const [receiptLang, setReceiptLang] = useState<Lang>(lang);

  // Sync with parent lang when opened
  useEffect(() => {
    setReceiptLang(lang);
  }, [lang, isOpen]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString(
    receiptLang === 'de' ? 'de-DE' : 'en-US',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const formatEuro = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  };

  const nettoCents = order.totalCents - order.taxCents;

  const isPackingSlip = docType === 'packing_slip';

  return (
    <div
      id="receipt-modal-wrapper"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          /* Hide everything in the body by default */
          body * {
            visibility: hidden !important;
          }
          /* Make printable receipt and its children visible */
          #macrown-printable-receipt,
          #macrown-printable-receipt * {
            visibility: visible !important;
          }
          #receipt-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
          }
          #macrown-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 10mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .receipt-no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
        }
      `}</style>

      {/* Floating Action Bar (hidden on print) */}
      <div className="w-full max-w-3xl my-auto">
        <div className="receipt-no-print bg-[#141414] border border-[#DEA43E]/40 text-white p-4 rounded-[2px] shadow-2xl flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Document Type Switcher */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-[2px] border border-white/15">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider rounded-[1px] transition-all cursor-pointer font-bold ${
                  !isPackingSlip
                    ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                📄 {receiptLang === 'de' ? 'Rechnung (Steuer)' : 'Tax Invoice'}
              </button>
              <button
                type="button"
                onClick={() => setDocType('packing_slip')}
                className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider rounded-[1px] transition-all cursor-pointer font-bold ${
                  isPackingSlip
                    ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                📦 {receiptLang === 'de' ? 'Lieferschein (Paket)' : 'Packing Slip'}
              </button>
            </div>

            {/* Language Switcher on Receipt */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-[2px] border border-white/15">
              <button
                type="button"
                onClick={() => setReceiptLang('de')}
                className={`px-2.5 py-1 text-[11px] font-display uppercase font-bold rounded-[1px] transition-all cursor-pointer ${
                  receiptLang === 'de'
                    ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setReceiptLang('en')}
                className={`px-2.5 py-1 text-[11px] font-display uppercase font-bold rounded-[1px] transition-all cursor-pointer ${
                  receiptLang === 'en'
                    ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] font-display text-xs uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>
                {isPackingSlip
                  ? (receiptLang === 'de' ? 'Lieferschein Drucken' : 'Print Packing Slip')
                  : (receiptLang === 'de' ? 'Rechnung Drucken' : 'Print Invoice')}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-display uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
            >
              ✕ {receiptLang === 'de' ? 'Schließen' : 'Close'}
            </button>
          </div>
        </div>

        {/* PRINTABLE SHEET */}
        <div
          id="macrown-printable-receipt"
          className="bg-white text-[#111111] p-8 sm:p-12 rounded-[2px] border border-[#E8E6E1] shadow-2xl font-sans"
        >
          {/* Header Row: Macrown Brand Crest + Document Tag */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-[#0D0D0D] gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.2em] uppercase font-bold text-[#0D0D0D]">
                MACROWN
              </h1>
              <p className="text-[10px] font-display uppercase tracking-[0.25em] text-[#8B6B23] font-semibold mt-0.5">
                HAUTE COIFFURE & RAW VIRGIN HAIR ATELIER
              </p>
              <p className="text-[10px] text-[#666666] mt-1 font-mono">
                Königsallee 12 • 40212 Düsseldorf • Deutschland
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 bg-[#FDF9F0] border border-[#DEA43E] text-[#8B6B23] text-[10px] font-display font-bold uppercase tracking-widest rounded-[1px] mb-1.5">
                {isPackingSlip
                  ? (receiptLang === 'de' ? 'WARENBEGLEITSCHEIN & PRÜFPROTOKOLL' : 'PACKING SLIP & ATELIER DISPATCH')
                  : (receiptLang === 'de' ? '✓ BEZAHLT VIA PAYPAL' : '✓ PAID VIA PAYPAL')}
              </span>
              <h2 className="text-sm font-display uppercase font-bold tracking-wider text-[#0D0D0D]">
                {isPackingSlip
                  ? (receiptLang === 'de' ? 'Atelier Lieferschein' : 'Atelier Packing Slip')
                  : (receiptLang === 'de' ? 'Offizielle Rechnung' : 'Official Invoice')}
              </h2>
              <p className="text-[11px] font-mono text-[#444444] mt-0.5">
                {isPackingSlip ? `LS-${order.id}` : order.invoiceNumber}
              </p>
            </div>
          </div>

          {/* Meta Grid: Addresses & Order Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-[#E8E6E1] text-xs leading-relaxed">
            {/* Customer Details */}
            <div>
              <p className="text-[10px] font-display uppercase tracking-wider text-[#888888] font-bold mb-1.5">
                {isPackingSlip
                  ? (receiptLang === 'de' ? 'Empfängerin & Lieferanschrift' : 'Recipient & Shipping Address')
                  : (receiptLang === 'de' ? 'Rechnungs- & Lieferanschrift' : 'Billing & Shipping Address')}
              </p>
              <p className="font-bold text-sm text-[#0D0D0D]">{order.customer.fullName}</p>
              <p className="text-[#333333]">{order.customer.street}</p>
              <p className="text-[#333333]">
                {order.customer.postalCode} {order.customer.city}
              </p>
              <p className="text-[#333333]">{order.customer.country || 'Deutschland'}</p>
              <div className="mt-2 text-[11px] text-[#666666] space-y-0.5 font-mono">
                <p>E-Mail: {order.customer.email}</p>
                <p>Tel: {order.customer.phone}</p>
              </div>
            </div>

            {/* Order & Payment Meta */}
            <div className="bg-[#FAF9F7] p-4 rounded-[2px] border border-[#E8E6E1] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10.5px] uppercase font-display text-[#777777]">
                  {receiptLang === 'de' ? 'Bestellnummer' : 'Order ID'}:
                </span>
                <span className="font-mono font-bold text-[#0D0D0D]">{order.id}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10.5px] uppercase font-display text-[#777777]">
                  {receiptLang === 'de' ? 'Bestelldatum' : 'Order Date'}:
                </span>
                <span className="text-[#0D0D0D]">{formattedDate}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10.5px] uppercase font-display text-[#777777]">
                  {receiptLang === 'de' ? 'Zahlungsart' : 'Payment Method'}:
                </span>
                <span className="font-semibold text-[#0D0D0D] text-right">
                  PayPal Express
                  <span className="block text-[9.5px] font-mono text-[#0070BA] font-normal">
                    {order.transactionId || 'PP-TX-98421094'}
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10.5px] uppercase font-display text-[#777777]">
                  {receiptLang === 'de' ? 'Versandart' : 'Shipping Carrier'}:
                </span>
                <span className="text-[#0D0D0D] font-medium">DHL Express (Priorität & Versichert)</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6 border-b border-[#E8E6E1]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-[#0D0D0D] text-[10px] font-display uppercase tracking-wider text-[#666666]">
                  <th className="py-2.5 px-2 w-10">Pos.</th>
                  <th className="py-2.5 px-2">{receiptLang === 'de' ? 'Artikel & Spezifikation' : 'Item & Specifications'}</th>
                  <th className="py-2.5 px-2 text-center w-16">{receiptLang === 'de' ? 'Menge' : 'Qty'}</th>
                  {!isPackingSlip ? (
                    <>
                      <th className="py-2.5 px-2 text-right w-24">{receiptLang === 'de' ? 'Einzelpreis' : 'Unit Price'}</th>
                      <th className="py-2.5 px-2 text-right w-24">{receiptLang === 'de' ? 'Gesamt' : 'Total'}</th>
                    </>
                  ) : (
                    <th className="py-2.5 px-2 text-right w-36">{receiptLang === 'de' ? 'Atelier Prüfung' : 'Inspection'}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1]">
                {order.items.map((item, index) => (
                  <tr key={index} className="align-top">
                    <td className="py-3 px-2 font-mono text-[#888888]">{index + 1}</td>
                    <td className="py-3 px-2">
                      <p className="font-bold text-[#0D0D0D] text-xs">
                        {item.name[receiptLang] || item.name.de}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-[#666666] mt-0.5">
                        <span>Länge: <strong>{item.selectedLength}</strong></span>
                        <span>Haartyp: <strong>{item.hairType}</strong></span>
                        {item.laceType && <span>Lace: <strong>{item.laceType}</strong></span>}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-medium">{item.quantity}</td>
                    {!isPackingSlip ? (
                      <>
                        <td className="py-3 px-2 text-right font-mono text-[#444444]">
                          {formatEuro(item.price)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-[#0D0D0D]">
                          {formatEuro(item.price * item.quantity)}
                        </td>
                      </>
                    ) : (
                      <td className="py-3 px-2 text-right text-[10px] text-emerald-700 font-semibold">
                        ✓ HD Lace & Cuticle OK
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax OR Packing Slip Guarantee */}
          <div className="py-6 flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#E8E6E1]">
            <div className="max-w-xs text-[11px] text-[#666666] space-y-1.5">
              <p className="font-display uppercase tracking-wider text-[10px] text-[#0D0D0D] font-bold">
                {receiptLang === 'de' ? 'Atelier Zertifizierung & Schutz' : 'Atelier Guarantee & Protection'}
              </p>
              <p className="leading-relaxed">
                {receiptLang === 'de'
                  ? 'Jedes Haarteil wurde von Meisterhand gereinigt, entwirrt und in einer atmungsaktiven Macrown Seidenhülle für den DHL Express Versand vorbereitet.'
                  : 'Every raw human hair piece was inspected, conditioned, and packaged in a breathable Macrown satin dust case for insured express transit.'}
              </p>
              <div className="mt-2 p-2 bg-[#F0F7FF] border border-[#0070BA]/30 rounded-[2px] text-[10px] text-[#003087]">
                ✓ <strong>PayPal Verifizierung:</strong> Transaktion {order.transactionId || 'PP-TX-98421094'} mit vollem PayPal Käuferschutz autorisiert.
              </div>
            </div>

            {!isPackingSlip ? (
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>{receiptLang === 'de' ? 'Zwischensumme (Netto)' : 'Subtotal (Net)'}:</span>
                  <span className="font-mono">{formatEuro(nettoCents)}</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>{receiptLang === 'de' ? 'Inkl. 19% MwSt.' : 'Incl. 19% VAT'}:</span>
                  <span className="font-mono">{formatEuro(order.taxCents)}</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>{receiptLang === 'de' ? 'DHL Express Versand' : 'DHL Express Shipping'}:</span>
                  <span className="font-mono font-medium text-emerald-700">0,00 € (Gratis)</span>
                </div>

                <div className="pt-2 border-t-2 border-[#0D0D0D] flex justify-between items-baseline">
                  <span className="font-display font-bold uppercase text-xs tracking-wider text-[#0D0D0D]">
                    {receiptLang === 'de' ? 'Gesamtbetrag (Brutto)' : 'Total (Gross)'}:
                  </span>
                  <span className="font-serif font-bold text-xl text-[#0D0D0D]">
                    {formatEuro(order.totalCents)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full sm:w-64 p-4 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] text-xs space-y-2 text-[#444444]">
                <div className="text-[10px] font-display uppercase tracking-wider font-bold text-[#0D0D0D]">
                  Versand-Checkliste
                </div>
                <div className="text-[10.5px] space-y-1">
                  <p>✓ 100% Remy Rohhaar Echtheitszertifikat</p>
                  <p>✓ Macrown Seiden-Aufbewahrungsbeutel</p>
                  <p>✓ Pflegeanleitung & HD-Lace Guide</p>
                  <p>✓ Versiegelter DHL Sicherheitsverschluss</p>
                </div>
              </div>
            )}
          </div>

          {/* Legal Footer */}
          <div className="pt-6 text-[9.5px] text-[#777777] grid grid-cols-1 sm:grid-cols-3 gap-4 leading-normal">
            <div>
              <p className="font-bold text-[#0D0D0D]">Macrown Hair Atelier</p>
              <p>Inhaberin: Melodie Macrown</p>
              <p>Königsallee 12, 40212 Düsseldorf</p>
            </div>
            <div>
              <p className="font-bold text-[#0D0D0D]">Steuer & Register</p>
              <p>USt-IdNr.: DE 348 912 450</p>
              <p>Finanzamt Düsseldorf-Altstadt</p>
            </div>
            <div>
              <p className="font-bold text-[#0D0D0D]">Kundenservice & Concierge</p>
              <p>E-Mail: hello@macrown.org</p>
              <p>WhatsApp Concierge: +49 172 812 3222</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
