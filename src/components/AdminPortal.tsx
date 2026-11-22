import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { uploadToCloudinary } from '../cloudinary';
import type { Product, Lang, Order, OrderStatus, FAQItem, AtelierContent } from '../data';
import { INITIAL_ORDERS, INITIAL_FAQS, INITIAL_ATELIER_CONTENT } from '../data';
import AdminSidebar, { type AdminTab } from './AdminSidebar';
import PrintableReceipt from './PrintableReceipt';

interface AdminPortalProps {
  products: Product[];
  onUpdateProducts: (newProducts: Product[]) => void;
  faqs?: FAQItem[];
  onUpdateFaqs?: (newFaqs: FAQItem[]) => void;
  atelierContent?: AtelierContent;
  onUpdateAtelierContent?: (newContent: AtelierContent) => void;
  onExitAdmin: () => void;
  lang: Lang;
  setLang: (lng: Lang) => void;
}

function AdminLanguageToggle({ lang, setLang }: { lang: Lang; setLang: (lng: Lang) => void }) {
  return (
    <div className="flex items-center bg-[#1A1A1A] border border-white/20 rounded-[2px] p-0.5 select-none">
      <button
        type="button"
        onClick={() => setLang('de')}
        className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase transition-all rounded-[1px] ${
          lang === 'de'
            ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-xs'
            : 'text-white/60 hover:text-white'
        }`}
        aria-label="Deutsch"
      >
        DE
      </button>
      <span className="text-white/20 text-[9px] px-0.5 select-none">/</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase transition-all rounded-[1px] ${
          lang === 'en'
            ? 'bg-[#DEA43E] text-[#0D0D0D] shadow-xs'
            : 'text-white/60 hover:text-white'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}

export default function AdminPortal({
  products,
  onUpdateProducts,
  faqs,
  onUpdateFaqs,
  atelierContent,
  onUpdateAtelierContent,
  onExitAdmin,
  lang,
  setLang,
}: AdminPortalProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Demo bypass mode (persists across page reloads in sessionStorage)
  const [demoBypass, setDemoBypassState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('macrown_demo_auth') === 'true';
    }
    return false;
  });

  const setDemoBypass = (value: boolean) => {
    setDemoBypassState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        sessionStorage.setItem('macrown_demo_auth', 'true');
      } else {
        sessionStorage.removeItem('macrown_demo_auth');
      }
    }
  };

  // Sidenav & Active Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Orders & Card Transactions state
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('macrown_orders');
        if (stored) {
          return JSON.parse(stored);
        }
        localStorage.setItem('macrown_orders', JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
      } catch (e) {
        console.warn('Error reading stored orders', e);
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
  });

  const [ordersSearch, setOrdersSearch] = useState('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Helper functions for orders
  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    try {
      localStorage.setItem('macrown_orders', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving orders', e);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    saveOrders(updated);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm(lang === 'de' ? 'Bestellung unwiderruflich löschen?' : 'Permanently delete this order?')) {
      const updated = orders.filter((o) => o.id !== orderId);
      saveOrders(updated);
    }
  };

  const handleOpenReceiptModal = (order: Order) => {
    setSelectedReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Bestellnummer',
      'Rechnungsnummer',
      'Datum',
      'Kundin',
      'Email',
      'Telefon',
      'Strasse',
      'PLZ_Ort',
      'Zahlungsart',
      'TransaktionsID',
      'Artikel',
      'Netto_EUR',
      'MwSt19_EUR',
      'Brutto_EUR',
      'Status',
    ];

    const rows = orders.map((o) => {
      const netto = ((o.totalCents - o.taxCents) / 100).toFixed(2).replace('.', ',');
      const vat = (o.taxCents / 100).toFixed(2).replace('.', ',');
      const brutto = (o.totalCents / 100).toFixed(2).replace('.', ',');
      const itemsList = o.items.map((i) => `${i.quantity}x ${i.name.de} (${i.selectedLength})`).join(' | ');

      return [
        o.id,
        o.invoiceNumber,
        new Date(o.createdAt).toLocaleDateString('de-DE'),
        `"${o.customer.fullName.replace(/"/g, '""')}"`,
        o.customer.email,
        o.customer.phone,
        `"${o.customer.street.replace(/"/g, '""')}"`,
        `"${o.customer.postalCode} ${o.customer.city}"`,
        o.paymentMethod.toUpperCase(),
        o.transactionId || 'PP-TX-CONFIRMED',
        `"${itemsList.replace(/"/g, '""')}"`,
        netto,
        vat,
        brutto,
        o.status.toUpperCase(),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `macrown_bestellungen_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter((order) => {
    const q = ordersSearch.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      order.id.toLowerCase().includes(q) ||
      order.invoiceNumber.toLowerCase().includes(q) ||
      order.customer.fullName.toLowerCase().includes(q) ||
      order.customer.email.toLowerCase().includes(q) ||
      order.customer.city.toLowerCase().includes(q);

    const matchesStatus =
      selectedOrderStatus === 'all' || order.status === selectedOrderStatus;

    return matchesSearch && matchesStatus;
  });

  // Knowledge Base (FAQ) & Atelier Content CMS state
  const localFaqs = faqs || INITIAL_FAQS;
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqFormData, setFaqFormData] = useState<{
    category: FAQItem['category'];
    order: number;
    questionDe: string;
    questionEn: string;
    answerDe: string;
    answerEn: string;
  }>({
    category: 'hair',
    order: 1,
    questionDe: '',
    questionEn: '',
    answerDe: '',
    answerEn: '',
  });

  const [atelierForm, setAtelierForm] = useState<AtelierContent>(
    atelierContent || INITIAL_ATELIER_CONTENT
  );
  const [atelierSavedSuccess, setAtelierSavedSuccess] = useState(false);

  useEffect(() => {
    if (atelierContent) {
      setAtelierForm(atelierContent);
    }
  }, [atelierContent]);

  const handleOpenAddFaqModal = () => {
    setEditingFaq(null);
    setFaqFormData({
      category: 'hair',
      order: localFaqs.length + 1,
      questionDe: '',
      questionEn: '',
      answerDe: '',
      answerEn: '',
    });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaqModal = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFaqFormData({
      category: faq.category,
      order: faq.order,
      questionDe: faq.question.de,
      questionEn: faq.question.en,
      answerDe: faq.answer.de,
      answerEn: faq.answer.en,
    });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      const updated = localFaqs.map((f) =>
        f.id === editingFaq.id
          ? {
              ...f,
              category: faqFormData.category,
              order: Number(faqFormData.order) || 1,
              question: { de: faqFormData.questionDe, en: faqFormData.questionEn || faqFormData.questionDe },
              answer: { de: faqFormData.answerDe, en: faqFormData.answerEn || faqFormData.answerDe },
            }
          : f
      );
      if (onUpdateFaqs) onUpdateFaqs(updated);
    } else {
      const newFaq: FAQItem = {
        id: `faq-${Date.now()}`,
        category: faqFormData.category,
        order: Number(faqFormData.order) || localFaqs.length + 1,
        question: { de: faqFormData.questionDe, en: faqFormData.questionEn || faqFormData.questionDe },
        answer: { de: faqFormData.answerDe, en: faqFormData.answerEn || faqFormData.answerDe },
      };
      if (onUpdateFaqs) onUpdateFaqs([...localFaqs, newFaq]);
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (id: string) => {
    if (window.confirm(lang === 'de' ? 'Diese Frage unwiderruflich aus der Wissensdatenbank löschen?' : 'Permanently delete this FAQ question?')) {
      const updated = localFaqs.filter((f) => f.id !== id);
      if (onUpdateFaqs) onUpdateFaqs(updated);
    }
  };

  const handleSaveAtelierContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateAtelierContent) {
      onUpdateAtelierContent(atelierForm);
      setAtelierSavedSuccess(true);
      setTimeout(() => setAtelierSavedSuccess(false), 3000);
    }
  };

  const filteredFaqs = localFaqs
    .filter((f) => {
      const q = faqSearchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        f.question.de.toLowerCase().includes(q) ||
        f.question.en.toLowerCase().includes(q) ||
        f.answer.de.toLowerCase().includes(q) ||
        f.answer.en.toLowerCase().includes(q);
      const matchesCategory =
        faqCategoryFilter === 'all' || f.category === faqCategoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.order - b.order);

  // Inventory filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('all');

  // Product modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // File upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form fields for create/edit
  const [formData, setFormData] = useState({
    nameDe: '',
    nameEn: '',
    category: 'wigs' as Product['category'],
    priceEuros: '249.00',
    originalPriceEuros: '',
    stockStatus: 'in_stock' as 'in_stock' | 'low_stock' | 'out_of_stock',
    stockQuantity: 10,
    hairType: 'Lux Hair' as 'Lux Hair' | 'Virgin Hair',
    texture: 'Body Wave',
    lengths: '20", 24", 28"',
    image: '',
    hoverImage: '',
    laceType: '13x6 Melt HD Lace',
    badgeDe: '',
    badgeEn: '',
    descriptionDe: '',
    descriptionEn: '',
  });

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Upload helper with Cloudinary Free Media & Document Management Service (DMS)
  const uploadFileToStorage = async (file: File, folder: 'images' | 'documents'): Promise<{ url: string; size: number }> => {
    try {
      const res = await uploadToCloudinary(file, folder, (percent) => {
        setUploadProgress(percent);
      });
      return { url: res.url, size: res.size };
    } catch (err: any) {
      console.warn('Cloudinary upload notice:', err.message);
      // Local Base64 fallback if network/offline
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: e.target?.result as string, size: file.size });
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle Image File selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(10);
    try {
      const res = await uploadFileToStorage(file, 'images');
      setFormData((prev) => ({ ...prev, image: res.url }));
    } catch (err: any) {
      alert(lang === 'de' ? 'Fehler beim Hochladen des Bildes: ' + err.message : 'Error uploading image: ' + err.message);
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  // Handle Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setSubmittingAuth(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let msg = err.message || 'Authentifizierungsfehler aufgetreten.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = lang === 'de' ? 'Ungültige E-Mail oder falsches Passwort.' : 'Invalid email or wrong password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = lang === 'de' ? 'Kein Admin-Benutzer mit dieser E-Mail gefunden.' : 'No user found with this email.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg =
          lang === 'de'
            ? 'E-Mail/Passwort-Anmeldung ist in der Firebase-Konsole noch nicht aktiviert. Du kannst den Demo-Modus unten nutzen.'
            : 'Email/Password provider is not yet enabled in Firebase Console. You can use Demo Mode below.';
      } else if (err.code === 'auth/weak-password') {
        msg = lang === 'de' ? 'Das Passwort muss mindestens 6 Zeichen lang sein.' : 'Password must be at least 6 characters.';
      }
      setAuthError(msg);
    } finally {
      setSubmittingAuth(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async () => {
    if (!email) {
      setAuthError(
        lang === 'de' ? 'Bitte gib zuerst deine E-Mail-Adresse ein.' : 'Please enter your email first.'
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthSuccess(
        lang === 'de'
          ? 'Link zum Zurücksetzen des Passworts an deine E-Mail gesendet!'
          : 'Password reset link sent to your email!'
      );
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
    setDemoBypass(false);
  };

  // Open modal for new product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      nameDe: '',
      nameEn: '',
      category: 'wigs',
      priceEuros: '249.00',
      originalPriceEuros: '',
      stockStatus: 'in_stock',
      stockQuantity: 12,
      hairType: 'Lux Hair',
      texture: 'Body Wave',
      lengths: '20", 24", 28"',
      image: '/images/MRDC2196.jpg',
      hoverImage: '',
      laceType: '13x6 Melt HD Lace',
      badgeDe: 'Neu',
      badgeEn: 'New',
      descriptionDe: '100% Unbehandeltes Remy Echthaar mit natürlicher Dichte.',
      descriptionEn: '100% Raw Virgin Remy hair with natural fullness.',
    });
    setIsEditModalOpen(true);
  };

  // Open modal for editing existing product
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      nameDe: p.name.de,
      nameEn: p.name.en,
      category: p.category,
      priceEuros: (p.price / 100).toFixed(2),
      originalPriceEuros: p.originalPrice ? (p.originalPrice / 100).toFixed(2) : '',
      stockStatus: p.stockStatus || 'in_stock',
      stockQuantity: p.stockQuantity ?? 10,
      hairType: p.hairType,
      texture: p.texture,
      lengths: p.lengths.join(', '),
      image: p.image,
      hoverImage: p.hoverImage || '',
      laceType: p.laceType || '',
      badgeDe: p.badge?.de || '',
      badgeEn: p.badge?.en || '',
      descriptionDe: p.description.de,
      descriptionEn: p.description.en,
    });
    setIsEditModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(formData.priceEuros.replace(',', '.')) * 100) || 0;
    const origPriceCents = formData.originalPriceEuros
      ? Math.round(parseFloat(formData.originalPriceEuros.replace(',', '.')) * 100)
      : undefined;

    const lengthsArray = formData.lengths
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: { de: formData.nameDe, en: formData.nameEn || formData.nameDe },
      category: formData.category,
      price: priceCents,
      originalPrice: origPriceCents,
      stockStatus: formData.stockStatus,
      stockQuantity: Number(formData.stockQuantity) || 0,
      hairType: formData.hairType,
      texture: formData.texture,
      lengths: lengthsArray.length ? lengthsArray : ['20"', '24"'],
      image: formData.image || '/images/MRDC2196.jpg',
      hoverImage: formData.hoverImage || undefined,
      laceType: formData.laceType || undefined,
      badge: formData.badgeDe ? { de: formData.badgeDe, en: formData.badgeEn || formData.badgeDe } : undefined,
      description: { de: formData.descriptionDe, en: formData.descriptionEn || formData.descriptionDe },
      tags: [formData.hairType, formData.texture],
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviews: editingProduct ? editingProduct.reviews : 1,
    };

    let newProductsList: Product[];
    if (editingProduct) {
      newProductsList = products.map((p) => (p.id === editingProduct.id ? updatedProduct : p));
    } else {
      newProductsList = [updatedProduct, ...products];
    }

    onUpdateProducts(newProductsList);
    setIsEditModalOpen(false);
  };

  // Quick Stock Status change
  const handleQuickStockChange = (productId: string, newStatus: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    const updated = products.map((p) => (p.id === productId ? { ...p, stockStatus: newStatus } : p));
    onUpdateProducts(updated);
  };

  // Quick Quantity Stepper
  const handleQuickQuantityChange = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const currentQty = p.stockQuantity ?? 10;
        const newQty = Math.max(0, currentQty + delta);
        const newStatus: 'in_stock' | 'low_stock' | 'out_of_stock' =
          newQty === 0 ? 'out_of_stock' : newQty <= 3 ? 'low_stock' : 'in_stock';
        return { ...p, stockQuantity: newQty, stockStatus: newStatus };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    if (window.confirm(lang === 'de' ? 'Möchtest du dieses Produkt wirklich löschen?' : 'Are you sure you want to delete this product?')) {
      const updated = products.filter((p) => p.id !== productId);
      onUpdateProducts(updated);
    }
  };

  // Filter products for display
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.de.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.texture.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStock = selectedStockFilter === 'all' || (p.stockStatus || 'in_stock') === selectedStockFilter;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // KPI calculations
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stockQuantity ?? 10), 0);
  const lowStockCount = products.filter((p) => p.stockStatus === 'low_stock' || (p.stockQuantity ?? 10) <= 3).length;
  const outOfStockCount = products.filter((p) => p.stockStatus === 'out_of_stock' || (p.stockQuantity ?? 10) === 0).length;
  const totalInventoryValueCents = products.reduce(
    (acc, p) => acc + p.price * (p.stockQuantity ?? 10),
    0
  );
  const totalInventoryValueFormatted = (totalInventoryValueCents / 100).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  });

  const isAuthenticated = !!currentUser || demoBypass;

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="text-center text-[#DEA43E] font-display uppercase tracking-widest text-xs flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#DEA43E] border-t-transparent rounded-full animate-spin"></div>
          <span>{lang === 'de' ? 'Firebase Authentifizierung wird geladen...' : 'Loading Firebase authentication...'}</span>
        </div>
      </div>
    );
  }

  // NOT AUTHENTICATED: LOGIN & SIGN-UP SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col justify-center items-center p-4 sm:p-6 text-white relative">
        {/* Ambient Gold glow */}
        <div className="absolute top-1/4 -z-10 w-96 h-96 bg-[#DEA43E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar with Language Switcher */}
        <div className="w-full max-w-md mb-6 flex justify-between items-center">
          <button
            type="button"
            onClick={onExitAdmin}
            className="text-xs font-display uppercase tracking-widest text-white/70 hover:text-[#DEA43E] transition-colors flex items-center gap-2"
          >
            <span>{lang === 'de' ? '← Zurück zum Online-Shop' : '← Back to Online Store'}</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <AdminLanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>

        {/* Login Box */}
        <div className="w-full max-w-md bg-[#141414] border border-[#DEA43E]/30 rounded-[2px] p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="font-cinzel text-2xl tracking-[0.24em] font-medium text-white">MACROWN</span>
            </div>
            <span className="text-[9.5px] font-display uppercase tracking-[0.3em] text-[#DEA43E] font-semibold block">
              ATELIER INVENTORY MANAGEMENT
            </span>
            <p className="text-xs text-[#B5B5B5] mt-2 font-light">
              {lang === 'de'
                ? 'Geschützter Bereich für Inventar- und Produktverwaltung'
                : 'Protected area for inventory and catalog control'}
            </p>
          </div>

          {/* Alert Messages */}
          {authError && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-[2px] text-xs text-rose-300 leading-relaxed">
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-[2px] text-xs text-emerald-300 leading-relaxed">
              {authSuccess}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-display uppercase tracking-wider text-[#DEA43E] mb-1 font-semibold">
                {lang === 'de' ? 'E-Mail-Adresse' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@macrown.org"
                className="w-full bg-[#1C1C1C] border border-white/20 rounded-[2px] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#DEA43E] transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10.5px] font-display uppercase tracking-wider text-[#DEA43E] font-semibold">
                  {lang === 'de' ? 'Passwort' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[10px] text-white/50 hover:text-[#DEA43E] transition-colors"
                >
                  {lang === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1C1C1C] border border-white/20 rounded-[2px] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#DEA43E] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submittingAuth}
              className="w-full mt-4 py-3 bg-[#DEA43E] text-[#0D0D0D] font-display text-xs font-bold uppercase tracking-[0.2em] rounded-[2px] hover:bg-[#C79237] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {submittingAuth ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin"></div>
                  <span>{lang === 'de' ? 'Verarbeite...' : 'Processing...'}</span>
                </>
              ) : (
                <span>{lang === 'de' ? 'Im Portal anmelden' : 'Sign in to Portal'}</span>
              )}
            </button>
          </form>

          {/* Demo Access Bypass */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
           
            <button
              type="button"
              onClick={() => setDemoBypass(true)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-[10.5px] font-display uppercase tracking-wider text-[#DEA43E] rounded-[2px] transition-colors"
            >
              ⚡ {lang === 'de' ? 'Sofort-Vorschau Inventar (Demo Bypass)' : 'Instant Preview Inventory (Demo Bypass)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: INVENTORY MANAGEMENT DASHBOARD
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#0D0D0D] flex">
      {/* Left Sidenav */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        productsCount={products.length}
        ordersCount={orders.length}
        faqsCount={localFaqs.length}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        currentUserEmail={currentUser?.email}
        lang={lang}
        setLang={setLang}
        onExitAdmin={onExitAdmin}
        onSignOut={handleSignOut}
        onOpenAddModal={handleOpenAddModal}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#E8E6E1] sticky top-0 z-10 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-[2px] text-[#0D0D0D] hover:bg-[#F4F3EF] border border-[#E8E6E1]"
              aria-label="Navigation öffnen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div>
              <div className="text-[9.5px] font-display uppercase tracking-widest text-[#7A7A7A] font-semibold">
                MACROWN ATELIER OS
              </div>
              <h1 className="font-serif text-base sm:text-lg text-[#0D0D0D] leading-tight font-normal">
                {activeTab === 'inventory' && (lang === 'de' ? 'Inventar & Produktkatalog' : 'Inventory & Catalog')}
                {activeTab === 'orders' && (lang === 'de' ? 'Bestellungen & PayPal-Zahlungen' : 'Orders & PayPal Transactions')}
                {activeTab === 'content' && (lang === 'de' ? 'Wissensdatenbank & Atelier Content' : 'Knowledge Base & Content CMS')}
                {activeTab === 'analytics' && (lang === 'de' ? 'Bestandsanalyse & Kennzahlen' : 'Stock & KPIs Analytics')}
                {activeTab === 'categories' && (lang === 'de' ? 'Kategorien & Kollektionen' : 'Categories & Collections')}
                {activeTab === 'settings' && (lang === 'de' ? 'Firebase & Cloud Status' : 'Firebase & Cloud Settings')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'content' ? (
              <button
                type="button"
                onClick={handleOpenAddFaqModal}
                className="px-3.5 py-1.5 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">{lang === 'de' ? 'Frage anlegen' : 'New FAQ Item'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3.5 py-1.5 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">{lang === 'de' ? 'Produkt anlegen' : 'New Product'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExitAdmin}
              className="px-3 py-1.5 text-xs text-[#0D0D0D] hover:text-[#DEA43E] border border-[#E8E6E1] hover:border-[#DEA43E] rounded-[2px] transition-colors hidden sm:flex items-center gap-1 font-display uppercase tracking-wider font-medium"
            >
              <span>{lang === 'de' ? 'Shop' : 'Shop'}</span>
              <span>↗</span>
            </button>
          </div>
        </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB 1: INVENTORY & CATALOG */}
        {activeTab === 'inventory' && (
          <>
            {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
            <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] block mb-1">
              {lang === 'de' ? 'Gesamt-Produkte' : 'Total Products'}
            </span>
            <span className="font-serif text-3xl font-normal text-[#0D0D0D]">{products.length}</span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-1">
              {lang === 'de' ? 'Aktiver Katalog' : 'Active Catalog'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
            <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] block mb-1">
              {lang === 'de' ? 'Lagerbestand (Einheiten)' : 'Stock Units'}
            </span>
            <span className="font-serif text-3xl font-normal text-[#0D0D0D]">{totalStockUnits}</span>
            <span className="text-[10px] text-[#7A7A7A] block mt-1">
              {lang === 'de' ? 'Stück vorrätig' : 'Units on hand'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
            <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] block mb-1">
              {lang === 'de' ? 'Geringer Bestand' : 'Low Stock'}
            </span>
            <span className={`font-serif text-3xl font-normal ${lowStockCount > 0 ? 'text-amber-600' : 'text-[#0D0D0D]'}`}>
              {lowStockCount}
            </span>
            <span className="text-[10px] text-amber-700 block mt-1">
              {lang === 'de' ? '≤ 3 Einheiten' : '≤ 3 Units left'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
            <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] block mb-1">
              {lang === 'de' ? 'Ausverkauft' : 'Out of Stock'}
            </span>
            <span className={`font-serif text-3xl font-normal ${outOfStockCount > 0 ? 'text-rose-600' : 'text-[#0D0D0D]'}`}>
              {outOfStockCount}
            </span>
            <span className="text-[10px] text-rose-600 block mt-1">
              {lang === 'de' ? 'Nachbestellung nötig' : 'Restock needed'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs col-span-2 md:col-span-1">
            <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] block mb-1">
              {lang === 'de' ? 'Warenwert (Katalog)' : 'Inventory Value'}
            </span>
            <span className="font-serif text-2xl font-normal text-[#DEA43E] truncate block">
              {totalInventoryValueFormatted}
            </span>
            <span className="text-[10px] text-[#7A7A7A] block mt-1">
              {lang === 'de' ? 'Verkaufswert' : 'Retail Value'}
            </span>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-[2px] border border-[#E8E6E1] mb-6 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder={
                lang === 'de'
                  ? 'Produkt nach Name, Textur oder Kategorie suchen...'
                  : 'Search products by name, texture, or category...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
            />
            <svg
              className="w-4 h-4 text-[#7A7A7A] absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          {/* Filters & Add Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
            >
              <option value="all">{lang === 'de' ? 'Alle Kategorien' : 'All Categories'}</option>
              <option value="wigs">{lang === 'de' ? 'Perücken' : 'Wigs'}</option>
              <option value="bundles">{lang === 'de' ? 'Haarbündel' : 'Hair Bundles'}</option>
              <option value="closure-frontal">Closure & Frontal</option>
              <option value="ponytail">Ponytail</option>
            </select>

            {/* Stock Filter */}
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
            >
              <option value="all">{lang === 'de' ? 'Alle Bestandsstufen' : 'All Stock Statuses'}</option>
              <option value="in_stock">{lang === 'de' ? 'Auf Lager' : 'In Stock'}</option>
              <option value="low_stock">{lang === 'de' ? 'Geringer Bestand' : 'Low Stock'}</option>
              <option value="out_of_stock">{lang === 'de' ? 'Ausverkauft' : 'Out of Stock'}</option>
            </select>

            {/* Add New Product Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>{lang === 'de' ? '+ Produkt anlegen' : '+ New Product'}</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-[2px] border border-[#E8E6E1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F3EF] border-b border-[#E8E6E1] text-[10px] font-display uppercase tracking-wider text-[#666666]">
                  <th className="py-3 px-4">{lang === 'de' ? 'Produkt' : 'Product'}</th>
                  <th className="py-3 px-4">{lang === 'de' ? 'Kategorie / Grad' : 'Category / Grade'}</th>
                  <th className="py-3 px-4">{lang === 'de' ? 'Preis (€)' : 'Price (€)'}</th>
                  <th className="py-3 px-4">{lang === 'de' ? 'Bestandsstatus' : 'Stock Status'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'de' ? 'Menge' : 'Qty'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'de' ? 'Aktionen' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1]">
                {filteredProducts.map((p) => {
                  const stockStatus = p.stockStatus || 'in_stock';
                  const stockQty = p.stockQuantity ?? 10;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF9F7] transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name[lang]}
                            className="w-12 h-14 object-cover rounded-[1px] bg-[#E8E6E1] shrink-0"
                          />
                          <div>
                            <span className="font-serif text-sm font-medium text-[#0D0D0D] block line-clamp-1">
                              {p.name[lang]}
                            </span>
                            <span className="text-[11px] text-[#7A7A7A] block line-clamp-1">
                              {p.name[lang === 'de' ? 'en' : 'de']}
                            </span>
                            <span className="text-[10px] font-mono text-[#DEA43E] mt-0.5 block">
                              {lang === 'de' ? 'Längen:' : 'Lengths:'} {p.lengths.join(', ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Hair Type */}
                      <td className="py-3 px-4">
                        <span className="block font-medium capitalize text-[#0D0D0D]">{p.category}</span>
                        <span
                          className={`inline-block mt-1 text-[9px] font-display uppercase tracking-wider px-2 py-0.5 rounded-[1px] ${
                            p.hairType === 'Lux Hair'
                              ? 'bg-[#FDF9F0] text-[#9E6F1E] border border-[#DEA43E]/40 font-bold'
                              : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                          }`}
                        >
                          {p.hairType}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-serif text-sm font-semibold text-[#0D0D0D]">
                        {(p.price / 100).toFixed(2).replace('.', ',')} €
                      </td>

                      {/* Stock Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={stockStatus}
                          onChange={(e) => handleQuickStockChange(p.id, e.target.value as any)}
                          className={`text-[10.5px] font-display uppercase tracking-wider font-semibold rounded-[1px] px-2.5 py-1 border transition-colors focus:outline-none ${
                            stockStatus === 'in_stock'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : stockStatus === 'low_stock'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="in_stock">{lang === 'de' ? 'Auf Lager' : 'In Stock'}</option>
                          <option value="low_stock">{lang === 'de' ? 'Geringer Bestand' : 'Low Stock'}</option>
                          <option value="out_of_stock">{lang === 'de' ? 'Ausverkauft' : 'Out of Stock'}</option>
                        </select>
                      </td>

                      {/* Stock Quantity Stepper */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center border border-[#E8E6E1] rounded-[1px] bg-white">
                          <button
                            type="button"
                            onClick={() => handleQuickQuantityChange(p.id, -1)}
                            className="px-2 py-0.5 text-xs text-[#7A7A7A] hover:text-black hover:bg-neutral-100"
                          >
                            -
                          </button>
                          <span className="px-2.5 text-xs font-mono font-bold text-[#0D0D0D] min-w-[28px]">
                            {stockQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickQuantityChange(p.id, 1)}
                            className="px-2 py-0.5 text-xs text-[#7A7A7A] hover:text-black hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onExitAdmin();
                              window.location.hash = '#shop';
                            }}
                            className="px-2.5 py-1 text-xs text-[#8B6B23] hover:text-[#0D0D0D] border border-[#DEA43E]/40 hover:bg-[#FDF9F0] rounded-[1px] transition-colors flex items-center gap-1 font-display uppercase tracking-wider text-[10px]"
                            title={lang === 'de' ? 'Im Online-Shop ansehen' : 'View in Live Store'}
                          >
                            <span>👁</span>
                            <span className="hidden sm:inline">{lang === 'de' ? 'Im Shop' : 'View'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="px-2.5 py-1 text-xs text-[#0D0D0D] hover:text-[#DEA43E] border border-[#E8E6E1] hover:border-[#DEA43E] rounded-[1px] transition-colors"
                          >
                            {lang === 'de' ? 'Bearbeiten' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-400 rounded-[1px] transition-colors"
                          >
                            {lang === 'de' ? 'Löschen' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-xs text-[#7A7A7A]">
              {lang === 'de'
                ? 'Keine Produkte gefunden, die deinen Filterkriterien entsprechen.'
                : 'No products found matching your filter criteria.'}
            </div>
          )}
        </div>
          </>
        )}

        {/* TAB: ORDERS & PRINTABLE RECEIPTS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#7A7A7A] font-semibold block mb-1">
                  {lang === 'de' ? 'Gesamtumsatz (Brutto)' : 'Total Revenue'}
                </span>
                <div className="font-serif text-2xl font-normal text-[#0D0D0D]">
                  {(orders.reduce((acc, o) => acc + o.totalCents, 0) / 100).toFixed(2).replace('.', ',')} €
                </div>
                <span className="text-[10px] text-emerald-700 font-medium mt-1 inline-block">
                  {lang === 'de' ? '100% ateliergeprüft' : '100% atelier verified'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#7A7A7A] font-semibold block mb-1">
                  {lang === 'de' ? 'Aufträge Gesamt' : 'Total Orders'}
                </span>
                <div className="font-serif text-2xl font-normal text-[#0D0D0D]">
                  {orders.length}
                </div>
                <span className="text-[10px] text-[#7A7A7A] mt-1 inline-block">
                  {lang === 'de' ? 'Eingegangene Bestellungen' : 'Customer Orders'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#0070BA] font-semibold block mb-1">
                  {lang === 'de' ? 'PayPal Transaktionen' : 'PayPal Transactions'}
                </span>
                <div className="font-serif text-2xl font-normal text-[#0070BA]">
                  {(
                    orders
                      .filter((o) => o.paymentMethod === 'paypal')
                      .reduce((acc, o) => acc + o.totalCents, 0) / 100
                  )
                    .toFixed(2)
                    .replace('.', ',')}{' '}
                  €
                </div>
                <span className="text-[10px] text-[#7A7A7A] mt-1 inline-block">
                  {orders.filter((o) => o.paymentMethod === 'paypal').length} {lang === 'de' ? 'Verifizierte PayPal-Aufträge' : 'Verified PayPal Orders'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-amber-700 font-semibold block mb-1">
                  {lang === 'de' ? 'In Ausführung / Offen' : 'Fulfillment Queue'}
                </span>
                <div className="font-serif text-2xl font-normal text-amber-700">
                  {orders.filter((o) => o.status === 'processing' || o.status === 'paid').length}
                </div>
                <span className="text-[10px] text-amber-700 font-medium mt-1 inline-block">
                  {lang === 'de' ? 'Bereit für DHL Express' : 'Ready for DHL Express'}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-[2px] border border-[#E8E6E1] shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <div className="relative flex-1 max-w-md">
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={
                    lang === 'de'
                      ? 'Bestell-Nr., Rechnungs-Nr., Kundin, Stadt...'
                      : 'Search order ID, invoice, customer, city...'
                  }
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <select
                  value={selectedOrderStatus}
                  onChange={(e) => setSelectedOrderStatus(e.target.value)}
                  className="bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
                >
                  <option value="all">{lang === 'de' ? 'Alle Status' : 'All Statuses'}</option>
                  <option value="paid">{lang === 'de' ? 'Bezahlt' : 'Paid'}</option>
                  <option value="processing">{lang === 'de' ? 'In Bearbeitung' : 'Processing'}</option>
                  <option value="shipped">{lang === 'de' ? 'Versendet' : 'Shipped'}</option>
                  <option value="cancelled">{lang === 'de' ? 'Storniert' : 'Cancelled'}</option>
                </select>

                {/* CSV Export for Steuerberater */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Bestellungen als CSV für Steuerberater / Buchhaltung herunterladen"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>{lang === 'de' ? 'CSV Export' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2px] border border-[#E8E6E1] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F4F3EF] border-b border-[#E8E6E1] text-[10px] font-display uppercase tracking-wider text-[#666666]">
                      <th className="py-3 px-4">{lang === 'de' ? 'Bestell- & Rechnungs-Nr.' : 'Order & Invoice'}</th>
                      <th className="py-3 px-4">{lang === 'de' ? 'Kundin & Anschrift' : 'Customer & Address'}</th>
                      <th className="py-3 px-4">{lang === 'de' ? 'Zahlungsart & Autorisierung' : 'Payment Method'}</th>
                      <th className="py-3 px-4">{lang === 'de' ? 'Artikel' : 'Items'}</th>
                      <th className="py-3 px-4 text-right">{lang === 'de' ? 'Betrag' : 'Total'}</th>
                      <th className="py-3 px-4 text-center">{lang === 'de' ? 'Status' : 'Status'}</th>
                      <th className="py-3 px-4 text-right">{lang === 'de' ? 'Beleg & Aktionen' : 'Receipt & Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E1]">
                    {filteredOrders.map((order) => {
                      const formattedDate = new Date(order.createdAt).toLocaleDateString(
                        lang === 'de' ? 'de-DE' : 'en-US',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      );

                      return (
                        <tr key={order.id} className="hover:bg-[#FAF9F7] transition-colors">
                          {/* Order ID & Date */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-mono font-bold text-[#0D0D0D] block text-xs">
                              {order.id}
                            </span>
                            <span className="text-[10.5px] font-mono text-[#8B6B23] block">
                              {order.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-[#7A7A7A] block mt-0.5">
                              {formattedDate}
                            </span>
                          </td>

                          {/* Customer Details */}
                          <td className="py-3.5 px-4 align-top">
                            <p className="font-semibold text-[#0D0D0D]">{order.customer.fullName}</p>
                            <p className="text-[11px] text-[#666666]">
                              {order.customer.postalCode} {order.customer.city}
                            </p>
                            <p className="text-[10.5px] text-[#888888] font-mono">{order.customer.email}</p>
                            <p className="text-[10.5px] text-[#888888] font-mono">{order.customer.phone}</p>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 bg-[#F0F7FF] border border-[#0070BA]/30 px-2 py-0.5 rounded-[1px]">
                                <span className="font-serif italic font-extrabold text-[12px] text-[#003087]">P</span>
                                <span className="font-serif italic font-extrabold text-[12px] text-[#0079C1] -ml-1.5">P</span>
                                <span className="font-semibold text-[#003087] text-[11px] ml-0.5">
                                  {order.paymentMethod === 'paypal' ? 'PayPal Express' : 'Zahlung bestätigt'}
                                </span>
                              </div>
                              <span className="block text-[10px] font-mono text-[#555555]">
                                {order.transactionId || 'PP-TX-CONFIRMED'}
                              </span>
                              <span className="block text-[9.5px] text-emerald-800 font-display uppercase tracking-widest font-bold">
                                ✓ Käuferschutz Aktiv
                              </span>
                            </div>
                          </td>

                          {/* Items Summary */}
                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <div className="space-y-1.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium text-[#0D0D0D]">
                                    {item.quantity}x {item.name[lang] || item.name.de}
                                  </span>
                                  <span className="text-[10.5px] text-[#777777] block">
                                    Länge: {item.selectedLength} • {item.hairType}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Total Gross */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <span className="font-serif font-bold text-sm text-[#0D0D0D] block">
                              {(order.totalCents / 100).toFixed(2).replace('.', ',')} €
                            </span>
                            <span className="text-[10px] text-[#777777] block font-mono">
                              inkl. 19% MwSt.
                            </span>
                          </td>

                          {/* Order Status Dropdown */}
                          <td className="py-3.5 px-4 align-top text-center">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className={`text-[10.5px] font-display uppercase tracking-wider font-semibold rounded-[1px] px-2 py-1 border transition-colors cursor-pointer focus:outline-none ${
                                order.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : order.status === 'processing'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : order.status === 'shipped'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              <option value="paid">{lang === 'de' ? 'Bezahlt' : 'Paid'}</option>
                              <option value="processing">{lang === 'de' ? 'In Bearbeitung' : 'Processing'}</option>
                              <option value="shipped">{lang === 'de' ? 'Versendet' : 'Shipped'}</option>
                              <option value="cancelled">{lang === 'de' ? 'Storniert' : 'Cancelled'}</option>
                            </select>
                          </td>

                          {/* Actions: Print Receipt & Delete */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenReceiptModal(order)}
                                className="px-3 py-1.5 text-xs text-[#8B6B23] hover:text-[#0D0D0D] border border-[#DEA43E]/50 hover:bg-[#FDF9F0] rounded-[1px] transition-colors flex items-center gap-1.5 font-display uppercase tracking-wider text-[10px] font-bold cursor-pointer shadow-2xs"
                                title="Offiziellen Beleg / Rechnung öffnen & drucken"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                  />
                                </svg>
                                <span>{lang === 'de' ? 'Rechnung drucken' : 'Print Receipt'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-[1px] transition-colors cursor-pointer"
                                title={lang === 'de' ? 'Bestellung löschen' : 'Delete order'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.7}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="py-12 text-center text-xs text-[#7A7A7A]">
                  {lang === 'de'
                    ? 'Keine Bestellungen gefunden, die den Suchkriterien entsprechen.'
                    : 'No orders found matching your search criteria.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: CONTENT & KNOWLEDGE BASE CMS */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E8E6E1] p-5 rounded-[2px] shadow-2xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#7A7A7A] font-bold block mb-1">
                  {lang === 'de' ? 'Häufig gestellte Fragen (FAQs)' : 'Knowledge Base FAQs'}
                </span>
                <div className="font-serif text-3xl font-normal text-[#0D0D0D] flex items-center justify-between">
                  <span>{localFaqs.length}</span>
                  <span className="text-xs font-display uppercase tracking-wider text-[#DEA43E] bg-[#DEA43E]/10 px-2 py-0.5 rounded-[2px] font-bold">
                    {lang === 'de' ? 'Live im Storefront' : 'Live on Storefront'}
                  </span>
                </div>
                <p className="text-xs text-[#7A7A7A] mt-2">
                  {lang === 'de'
                    ? 'Bilingual gepflegt (Deutsch & Englisch) im Akkordeon auf der Landing Page.'
                    : 'Maintained bilingually (DE & EN) in the landing page accordion.'}
                </p>
              </div>

              <div className="bg-white border border-[#E8E6E1] p-5 rounded-[2px] shadow-2xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#7A7A7A] font-bold block mb-1">
                  {lang === 'de' ? 'Themenbereiche' : 'Topics Covered'}
                </span>
                <div className="font-serif text-3xl font-normal text-[#0D0D0D]">
                  {new Set(localFaqs.map((f) => f.category)).size}
                </div>
                <p className="text-xs text-[#7A7A7A] mt-2">
                  {lang === 'de'
                    ? 'Echthaar-Ursprung, HD Lace, Maßanfertigung, Express-Versand & Rückgaberecht.'
                    : 'Hair Sourcing, HD Lace, Custom Tailoring, Express Logistics & Returns.'}
                </p>
              </div>

              <div className="bg-white border border-[#E8E6E1] p-5 rounded-[2px] shadow-2xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#7A7A7A] font-bold block mb-1">
                  {lang === 'de' ? 'Atelier Brand Story' : 'Atelier Brand Story'}
                </span>
                <div className="font-serif text-base font-normal text-[#0D0D0D] truncate">
                  „{atelierForm.footerTagline[lang] || atelierForm.footerTagline.de}“
                </div>
                <p className="text-xs text-[#7A7A7A] mt-2">
                  {lang === 'de'
                    ? 'Verwaltung des Fußzeilen-Manifests und der Concierge-Kontaktdaten.'
                    : 'Manage footer brand manifesto and concierge communication.'}
                </p>
              </div>
            </div>

            {/* SECTION 1: FAQ MANAGEMENT TABLE */}
            <div className="bg-white border border-[#E8E6E1] rounded-[2px] shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-[#E8E6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFCFA]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DEA43E]" />
                    <h2 className="font-serif text-lg font-normal text-[#0D0D0D]">
                      {lang === 'de' ? 'Wissensdatenbank (FAQ)' : 'Knowledge Base (FAQ)'}
                    </h2>
                  </div>
                  <p className="text-xs text-[#7A7A7A] mt-0.5">
                    {lang === 'de'
                      ? 'Verwalte die Fragen & Antworten für deine Kundinnen. Änderungen werden sofort auf der Landingpage übernommen.'
                      : 'Manage questions and answers for your clients. Changes reflect immediately on the storefront.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddFaqModal}
                    className="px-4 py-2 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>{lang === 'de' ? 'Neue Frage anlegen' : 'Add Question'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Pills */}
              <div className="p-4 border-b border-[#E8E6E1] bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    placeholder={lang === 'de' ? 'Frage oder Antwort durchsuchen...' : 'Search question or answer...'}
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] pl-9 pr-4 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
                  />
                  <svg
                    className="w-4 h-4 text-[#7A7A7A] absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 select-none">
                  {[
                    { id: 'all', labelDe: 'Alle', labelEn: 'All' },
                    { id: 'hair', labelDe: 'Echthaar & Herkunft', labelEn: 'Hair & Origin' },
                    { id: 'lace', labelDe: 'HD Lace', labelEn: 'HD Lace' },
                    { id: 'shipping', labelDe: 'Versand & Dauer', labelEn: 'Shipping' },
                    { id: 'returns', labelDe: 'Rückgaberecht', labelEn: 'Returns' },
                    { id: 'general', labelDe: 'Allgemein', labelEn: 'General' },
                  ].map((cat) => {
                    const active = faqCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFaqCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 text-[11px] font-display uppercase tracking-wider rounded-[2px] transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-[#0D0D0D] text-[#DEA43E] font-bold'
                            : 'bg-[#F9F8F6] hover:bg-[#F2F1ED] text-[#666666] border border-[#E8E6E1]'
                        }`}
                      >
                        {lang === 'de' ? cat.labelDe : cat.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FAQ Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F7] border-b border-[#E8E6E1] text-[10px] font-display uppercase tracking-wider text-[#666666]">
                      <th className="py-3 px-4 w-12 text-center">Pos</th>
                      <th className="py-3 px-4 w-32">Kategorie</th>
                      <th className="py-3 px-4 w-72">Frage (DE / EN)</th>
                      <th className="py-3 px-4">Antwort (Vorschau)</th>
                      <th className="py-3 px-4 w-28 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E1]">
                    {filteredFaqs.map((faq) => {
                      const categoryBadgeColor: Record<string, string> = {
                        hair: 'bg-[#DEA43E]/15 text-[#B88226] border-[#DEA43E]/30',
                        lace: 'bg-purple-950/10 text-purple-800 border-purple-200',
                        shipping: 'bg-sky-950/10 text-sky-800 border-sky-200',
                        returns: 'bg-emerald-950/10 text-emerald-800 border-emerald-200',
                        general: 'bg-stone-100 text-stone-700 border-stone-200',
                      };

                      return (
                        <tr key={faq.id} className="hover:bg-[#FCFCFA] transition-colors">
                          <td className="py-4 px-4 text-center font-mono text-[#7A7A7A]">
                            {faq.order}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 text-[9.5px] font-display uppercase tracking-wider font-semibold rounded-[2px] border ${
                                categoryBadgeColor[faq.category] || 'bg-stone-100 text-stone-700 border-stone-200'
                              }`}
                            >
                              {faq.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="font-serif text-[#0D0D0D] font-normal text-sm">
                                <span className="text-[9px] font-mono font-bold text-[#DEA43E] mr-1.5 uppercase px-1 py-0.2 bg-[#0D0D0D] rounded-[1px]">DE</span>
                                {faq.question.de}
                              </div>
                              <div className="text-xs text-[#7A7A7A] font-sans">
                                <span className="text-[9px] font-mono font-semibold text-[#666] mr-1.5 uppercase px-1 py-0.2 bg-stone-100 rounded-[1px]">EN</span>
                                {faq.question.en}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1 max-w-xl">
                              <p className="text-xs text-[#555555] line-clamp-2">
                                <span className="font-medium text-[#0D0D0D]">DE:</span> {faq.answer.de}
                              </p>
                              <p className="text-[11px] text-[#888888] line-clamp-1 italic">
                                <span className="font-medium text-[#666]">EN:</span> {faq.answer.en}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditFaqModal(faq)}
                                className="p-1.5 text-[#0D0D0D] hover:text-[#DEA43E] hover:bg-[#FAF9F7] rounded-[2px] transition-colors"
                                title={lang === 'de' ? 'Bearbeiten' : 'Edit'}
                                aria-label="Frage bearbeiten"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-[2px] transition-colors"
                                title={lang === 'de' ? 'Löschen' : 'Delete'}
                                aria-label="Frage löschen"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredFaqs.length === 0 && (
                <div className="py-12 text-center text-xs text-[#7A7A7A]">
                  {lang === 'de'
                    ? 'Keine Fragen gefunden, die den Suchkriterien entsprechen.'
                    : 'No questions found matching your criteria.'}
                </div>
              )}
            </div>

            {/* SECTION 2: ATELIER BRAND & FOOTER CMS */}
            <div className="bg-white border border-[#E8E6E1] rounded-[2px] shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-[#E8E6E1] bg-[#FCFCFA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DEA43E]" />
                    <h2 className="font-serif text-lg font-normal text-[#0D0D0D]">
                      {lang === 'de' ? 'Atelier Brand Story & Fußzeilen-Inhalte' : 'Atelier Brand Story & Footer Content'}
                    </h2>
                  </div>
                  <p className="text-xs text-[#7A7A7A] mt-0.5">
                    {lang === 'de'
                      ? 'Gestalte das Macrown-Manifest, das inspirierende Marken-Zitat und die direkten Concierge-Kontaktdaten.'
                      : 'Customize the Macrown manifesto, inspirational brand quote, and concierge communication.'}
                  </p>
                </div>

                {atelierSavedSuccess && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/10 border border-emerald-500/30 text-emerald-700 text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] animate-fade-in">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{lang === 'de' ? 'Erfolgreich gespeichert!' : 'Saved successfully!'}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveAtelierContent} className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Brand Story & Taglines */}
                  <div className="space-y-4">
                    <h3 className="font-display text-xs uppercase tracking-widest text-[#DEA43E] font-bold">
                      {lang === 'de' ? '1. Marken-Manifest & Zitat' : '1. Brand Manifesto & Tagline'}
                    </h3>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Atelier Philosophie / About (Deutsch)' : 'Atelier About Story (German)'}
                      </label>
                      <textarea
                        rows={3}
                        value={atelierForm.footerAbout.de}
                        onChange={(e) =>
                          setAtelierForm({
                            ...atelierForm,
                            footerAbout: { ...atelierForm.footerAbout, de: e.target.value },
                          })
                        }
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E] leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Atelier Philosophie / About (Englisch)' : 'Atelier About Story (English)'}
                      </label>
                      <textarea
                        rows={3}
                        value={atelierForm.footerAbout.en}
                        onChange={(e) =>
                          setAtelierForm({
                            ...atelierForm,
                            footerAbout: { ...atelierForm.footerAbout, en: e.target.value },
                          })
                        }
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2.5 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E] leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Marken-Zitat (Deutsch)' : 'Brand Quote (German)'}
                      </label>
                      <input
                        type="text"
                        value={atelierForm.footerTagline.de}
                        onChange={(e) =>
                          setAtelierForm({
                            ...atelierForm,
                            footerTagline: { ...atelierForm.footerTagline, de: e.target.value },
                          })
                        }
                        placeholder="„Schreibe deine eigene Geschichte mit uns – neues Haar, neues Abenteuer!“"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Marken-Zitat (Englisch)' : 'Brand Quote (English)'}
                      </label>
                      <input
                        type="text"
                        value={atelierForm.footerTagline.en}
                        onChange={(e) =>
                          setAtelierForm({
                            ...atelierForm,
                            footerTagline: { ...atelierForm.footerTagline, en: e.target.value },
                          })
                        }
                        placeholder="„Write your own story with us – new hair, new adventure!“"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Concierge Contacts */}
                  <div className="space-y-4">
                    <h3 className="font-display text-xs uppercase tracking-widest text-[#DEA43E] font-bold">
                      {lang === 'de' ? '2. Concierge & Service-Kontakte' : '2. Concierge & Service Contacts'}
                    </h3>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'WhatsApp Concierge & Hotline' : 'WhatsApp Concierge & Hotline'}
                      </label>
                      <input
                        type="text"
                        value={atelierForm.phone}
                        onChange={(e) => setAtelierForm({ ...atelierForm, phone: e.target.value })}
                        placeholder="+49 (0) 172 8123222"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Support E-Mail-Adresse' : 'Support Email Address'}
                      </label>
                      <input
                        type="email"
                        value={atelierForm.email}
                        onChange={(e) => setAtelierForm({ ...atelierForm, email: e.target.value })}
                        placeholder="concierge@macrown.org"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Service-Zeiten / Erreichbarkeit' : 'Service Hours / Availability'}
                      </label>
                      <input
                        type="text"
                        value={atelierForm.hours}
                        onChange={(e) => setAtelierForm({ ...atelierForm, hours: e.target.value })}
                        placeholder="Mo – Sa: 09:00 – 19:00 Uhr"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#DEA43E]"
                      />
                    </div>

                    <div className="pt-3">
                      <div className="p-4 bg-[#FAF9F7] border border-[#E8E6E1] rounded-[2px] text-xs text-[#666666]">
                        <div className="font-semibold text-[#0D0D0D] mb-1">
                          {lang === 'de' ? 'Sofortige Live-Vorschau' : 'Instant Live Sync'}
                        </div>
                        {lang === 'de'
                          ? 'Änderungen an diesen Daten aktualisieren unmittelbar den Footer sowie die WhatsApp- und E-Mail-Verlinkungen im gesamten Onlineshop.'
                          : 'Updating these fields immediately updates the footer, consultation sections, and concierge links across the shop.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E6E1] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{lang === 'de' ? 'Änderungen am Atelier-Inhalt speichern' : 'Save Atelier Content'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS & STOCK HEALTH */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 bg-white border border-[#E8E6E1] rounded-[2px] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-rose-600 font-bold block mb-1">
                  {lang === 'de' ? 'Ausverkaufte Artikel' : 'Out of Stock Products'}
                </span>
                <div className="font-serif text-3xl font-normal text-rose-700">{outOfStockCount}</div>
                <p className="text-xs text-[#7A7A7A] mt-2">
                  {lang === 'de'
                    ? 'Diese Artikel sind im Onlineshop als "Ausverkauft" markiert und können nicht in den Warenkorb gelegt werden.'
                    : 'These items are marked as "Sold Out" on the storefront and cannot be purchased.'}
                </p>
              </div>

              <div className="p-6 bg-white border border-[#E8E6E1] rounded-[2px] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-amber-600 font-bold block mb-1">
                  {lang === 'de' ? 'Geringer Lagerbestand' : 'Low Stock Warning'}
                </span>
                <div className="font-serif text-3xl font-normal text-amber-700">{lowStockCount}</div>
                <p className="text-xs text-[#7A7A7A] mt-2">
                  {lang === 'de'
                    ? 'Bestand ≤ 3 Einheiten. Kunden sehen den Hinweis "Nur noch wenige verfügbar".'
                    : 'Stock is ≤ 3 units. Customers see a "Low stock" urgency badge on the storefront.'}
                </p>
              </div>

              <div className="p-6 bg-white border border-[#E8E6E1] rounded-[2px] shadow-xs">
                <span className="text-[10px] font-display uppercase tracking-widest text-[#DEA43E] font-bold block mb-1">
                  {lang === 'de' ? 'Katalogwert' : 'Total Inventory Value'}
                </span>
                <div className="font-serif text-3xl font-normal text-[#0D0D0D]">{totalInventoryValueFormatted}</div>
                <p className="text-xs text-[#7A7A7A] mt-2">
                  {lang === 'de'
                    ? `Gesamtwert aller ${totalStockUnits} physischen Einheiten im Atelier-Lager.`
                    : `Total retail valuation across all ${totalStockUnits} units in the atelier inventory.`}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
              <h3 className="font-serif text-lg text-[#0D0D0D] mb-1">
                {lang === 'de' ? 'Nachbestellungs-Prioritätsliste' : 'Priority Restock List'}
              </h3>
              <p className="text-xs text-[#7A7A7A] mb-4">
                {lang === 'de'
                  ? 'Artikel, die dringend im Atelier nachproduziert oder nachbestellt werden sollten.'
                  : 'Items needing restock or manufacturing priority.'}
              </p>

              <div className="divide-y divide-[#E8E6E1]">
                {products
                  .filter((p) => p.stockStatus === 'out_of_stock' || p.stockStatus === 'low_stock' || (p.stockQuantity ?? 10) <= 3)
                  .map((p) => (
                    <div key={p.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name[lang]} className="w-11 h-11 object-cover rounded-[1px] border border-[#E8E6E1]" />
                        <div>
                          <span className="font-serif text-sm font-normal text-[#0D0D0D]">{p.name[lang]}</span>
                          <div className="text-[10.5px] text-[#7A7A7A] mt-0.5">
                            {lang === 'de' ? 'Aktueller Bestand' : 'Current Stock'}: <strong className="font-mono text-[#0D0D0D]">{p.stockQuantity ?? 0} Stk.</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            handleQuickStockChange(p.id, 'in_stock');
                            handleQuickQuantityChange(p.id, 10);
                          }}
                          className="px-3 py-1 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[1px] transition-colors"
                        >
                          + 10 {lang === 'de' ? 'Auffüllen' : 'Restock'}
                        </button>
                      </div>
                    </div>
                  ))}
                {products.filter((p) => p.stockStatus === 'out_of_stock' || p.stockStatus === 'low_stock' || (p.stockQuantity ?? 10) <= 3).length === 0 && (
                  <div className="py-8 text-center text-xs text-emerald-700">
                    ✓ {lang === 'de' ? 'Alle Produkte haben ausreichenden Lagerbestand!' : 'All products have optimal stock levels!'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES & HAIR QUALITIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { id: 'wigs', nameDe: 'Perücken (Wigs)', nameEn: 'Wigs', descDe: 'HD Lace & Glueless Modelle', descEn: 'HD Lace & Glueless styles' },
                { id: 'bundles', nameDe: 'Haarbündel (Bundles)', nameEn: 'Hair Bundles', descDe: 'Raw & Virgin Silky Wefts', descEn: 'Raw & Virgin Silky Wefts' },
                { id: 'closure-frontal', nameDe: 'Closure & Frontal', nameEn: 'Closure & Frontal', descDe: '13x4 / 13x6 Melt Swiss Lace', descEn: '13x4 / 13x6 Melt Swiss Lace' },
                { id: 'ponytail', nameDe: 'Ponytails', nameEn: 'Ponytails', descDe: 'Wrap-Around Echthaarzöpfe', descEn: 'Wrap-Around Human Hair Tails' },
              ].map((cat) => {
                const catProducts = products.filter((p) => p.category === cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setActiveTab('inventory');
                    }}
                    className="p-6 bg-white border border-[#E8E6E1] hover:border-[#DEA43E] rounded-[2px] shadow-xs cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-serif text-lg text-[#0D0D0D] group-hover:text-[#DEA43E] transition-colors">
                        {lang === 'de' ? cat.nameDe : cat.nameEn}
                      </h4>
                      <span className="font-mono text-sm font-bold bg-[#F4F3EF] px-2 py-0.5 rounded-[1px]">
                        {catProducts.length}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A7A7A] mb-4">{lang === 'de' ? cat.descDe : cat.descEn}</p>
                    <span className="text-[10px] font-display uppercase tracking-widest text-[#DEA43E] font-semibold">
                      {lang === 'de' ? 'Im Inventar filtern →' : 'Filter in Inventory →'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-white border border-[#E8E6E1] rounded-[2px] shadow-xs">
              <h3 className="font-serif text-lg text-[#0D0D0D] mb-4">
                {lang === 'de' ? 'Haarqualitäts-Verteilung im Atelier' : 'Hair Quality Distribution'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FDF9F0] border border-[#DEA43E]/40 rounded-[2px]">
                  <span className="text-xs font-display uppercase tracking-wider text-[#9E6F1E] font-bold block mb-1">
                    LUX HAIR (Haute Coiffure Alternative)
                  </span>
                  <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                    {products.filter((p) => p.hairType === 'Lux Hair').length} {lang === 'de' ? 'Artikel' : 'Items'}
                  </span>
                  <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                    {lang === 'de'
                      ? '100% chemiefreies Rohhaar aus kontrollierten Quellen. Färbbar bis zu warmem Blond mit gesundem Glanz.'
                      : '100% non-chemical raw hair alternative from vetted sources. Bleachable to warm blonde.'}
                  </p>
                </div>

                <div className="p-4 bg-[#F4F3EF] border border-[#E8E6E1] rounded-[2px]">
                  <span className="text-xs font-display uppercase tracking-wider text-[#0D0D0D] font-bold block mb-1">
                    VIRGIN HAIR (Reines Rohhaar)
                  </span>
                  <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                    {products.filter((p) => p.hairType === 'Virgin Hair').length} {lang === 'de' ? 'Artikel' : 'Items'}
                  </span>
                  <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                    {lang === 'de'
                      ? 'Unbehandeltes Einzelspenderhaar mit intakter Schuppenschicht. Färbbar bis zu Platinblond #613.'
                      : 'Untreated single-donor raw hair with intact cuticles. Safely liftable to platinum blonde #613.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & FIREBASE STATUS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-[#0D0D0D]">
                  {lang === 'de' ? 'Cloud & DMS Infrastruktur (100% Kostenlos)' : 'Cloud & DMS Infrastructure (100% Free)'}
                </h3>
                <span className="text-[10px] font-display uppercase tracking-widest font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-[1px] border border-emerald-300">
                  {lang === 'de' ? 'Kein Blaze Plan / 0 € Kosten' : 'No Blaze Plan / Zero Cost'}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex items-center justify-between">
                  <span className="text-[#666666]">DMS File & Doc Storage:</span>
                  <span className="font-bold text-emerald-700">Cloudinary (babzu5oi · 25 GB Free CDN)</span>
                </div>
                <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex items-center justify-between">
                  <span className="text-[#666666]">Admin Authentication:</span>
                  <span className="font-bold text-[#0D0D0D]">Firebase Auth (Spark Free Plan · macrown-13e95)</span>
                </div>
                <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex items-center justify-between">
                  <span className="text-[#666666]">Auth Domain:</span>
                  <span className="font-bold text-[#0D0D0D]">macrown-13e95.firebaseapp.com</span>
                </div>
                <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex items-center justify-between">
                  <span className="text-[#666666]">Current Admin Session:</span>
                  <span className="font-bold text-emerald-600">{currentUser?.email || 'admin@macrown.org (Demo Bypass)'}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#E8E6E1] flex gap-3">
                <button
                  type="button"
                  onClick={onExitAdmin}
                  className="px-4 py-2 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[1px] transition-colors"
                >
                  {lang === 'de' ? 'Zum Online-Shop zurückkehren' : 'Return to Online Store'}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-display uppercase tracking-wider font-semibold rounded-[1px] transition-colors"
                >
                  {lang === 'de' ? 'Session abmelden' : 'Sign Out Session'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

      {/* CREATE / EDIT PRODUCT MODAL (WITH DIRECT IMAGE & DOCS UPLOAD) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2px] shadow-2xl border border-[#E8E6E1] max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E8E6E1] flex justify-between items-center bg-[#F9F8F6]">
              <h3 className="font-serif text-xl text-[#0D0D0D] font-normal">
                {editingProduct
                  ? lang === 'de'
                    ? 'Produkt bearbeiten'
                    : 'Edit Product'
                  : lang === 'de'
                  ? 'Neues Produkt im Katalog anlegen'
                  : 'Add New Product to Catalog'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#7A7A7A] hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Product Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Produktname (Deutsch) *' : 'Product Name (German) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameDe}
                    onChange={(e) => setFormData({ ...formData, nameDe: e.target.value })}
                    placeholder="z.B. GODFIDENCE Perücke – Body Wave"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Produktname (Englisch)' : 'Product Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. GODFIDENCE Wig – Body Wave"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>
              </div>

              {/* Category, Grade, Texture */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Kategorie *' : 'Category *'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  >
                    <option value="wigs">{lang === 'de' ? 'Perücken (Wigs)' : 'Wigs'}</option>
                    <option value="bundles">{lang === 'de' ? 'Haarbündel (Bundles)' : 'Hair Bundles'}</option>
                    <option value="closure-frontal">Closure & Frontal</option>
                    <option value="ponytail">Ponytail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Haar-Qualität *' : 'Hair Grade *'}
                  </label>
                  <select
                    value={formData.hairType}
                    onChange={(e) => setFormData({ ...formData, hairType: e.target.value as any })}
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  >
                    <option value="Lux Hair">Lux Hair (Premium Atelier)</option>
                    <option value="Virgin Hair">Virgin Hair (100% Unprocessed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Textur' : 'Texture'}
                  </label>
                  <input
                    type="text"
                    value={formData.texture}
                    onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                    placeholder="Body Wave, Straight, Deep Wave"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>
              </div>

              {/* Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Preis in EUR (€) *' : 'Price in EUR (€) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.priceEuros}
                    onChange={(e) => setFormData({ ...formData, priceEuros: e.target.value })}
                    placeholder="249.00"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Streichpreis (€)' : 'Compare Price (€)'}
                  </label>
                  <input
                    type="text"
                    value={formData.originalPriceEuros}
                    onChange={(e) => setFormData({ ...formData, originalPriceEuros: e.target.value })}
                    placeholder="289.00"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Bestandsstatus' : 'Stock Status'}
                  </label>
                  <select
                    value={formData.stockStatus}
                    onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as any })}
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  >
                    <option value="in_stock">{lang === 'de' ? 'Auf Lager' : 'In Stock'}</option>
                    <option value="low_stock">{lang === 'de' ? 'Geringer Bestand' : 'Low Stock'}</option>
                    <option value="out_of_stock">{lang === 'de' ? 'Ausverkauft' : 'Out of Stock'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Menge' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>
              </div>

              {/* Lengths */}
              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                  {lang === 'de' ? 'Verfügbare Längen (Kommagetrennt)' : 'Available Lengths (comma separated)'}
                </label>
                <input
                  type="text"
                  value={formData.lengths}
                  onChange={(e) => setFormData({ ...formData, lengths: e.target.value })}
                  placeholder='18", 20", 24", 28"'
                  className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                />
              </div>

              {/* DIRECT HAIR IMAGE UPLOAD & URL */}
              <div className="p-4 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-display uppercase tracking-wider text-[#0D0D0D] font-bold">
                    {lang === 'de' ? '📸 Produktfoto (Datei-Upload oder URL)' : '📸 Product Photo (File Upload or URL)'} *
                  </label>
                  {uploadingImage && (
                    <span className="text-[10px] text-[#DEA43E] font-mono animate-pulse">
                      {lang === 'de' ? `Wird hochgeladen... ${uploadProgress || ''}%` : `Uploading... ${uploadProgress || ''}%`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Image Preview */}
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-14 h-16 object-cover rounded-[1px] border border-[#E8E6E1] bg-white shrink-0"
                    />
                  )}

                  {/* Direct File Picker */}
                  <label className="cursor-pointer px-3.5 py-2 bg-white hover:bg-neutral-50 border border-[#DEA43E] text-[#0D0D0D] text-[11px] font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors inline-flex items-center gap-2 shadow-xs">
                    <svg className="w-4 h-4 text-[#DEA43E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span>{lang === 'de' ? 'Foto auswählen (JPG, PNG)' : 'Select Photo (JPG, PNG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-[#7A7A7A]">{lang === 'de' ? 'oder URL eingeben:' : 'or enter URL:'}</span>
                </div>

                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/images/MRDC2196.jpg"
                  className="w-full bg-white border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                />
              </div>

              {/* Lace Type & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'HD Lace Typ (optional)' : 'HD Lace Type (optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.laceType}
                    onChange={(e) => setFormData({ ...formData, laceType: e.target.value })}
                    placeholder="13x6 Melt HD Lace"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Badge Text (z.B. Bestseller, Neu)' : 'Badge Label (e.g. Bestseller, New)'}
                  </label>
                  <input
                    type="text"
                    value={formData.badgeDe}
                    onChange={(e) => setFormData({ ...formData, badgeDe: e.target.value, badgeEn: e.target.value })}
                    placeholder="Bestseller"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                  {lang === 'de' ? 'Beschreibung (Deutsch)' : 'Description (German)'}
                </label>
                <textarea
                  rows={2}
                  value={formData.descriptionDe}
                  onChange={(e) => setFormData({ ...formData, descriptionDe: e.target.value })}
                  className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#E8E6E1] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E6E1] text-xs font-display uppercase tracking-wider rounded-[2px] hover:bg-neutral-100"
                >
                  {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-6 py-2 bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-colors shadow-sm"
                >
                  {editingProduct
                    ? lang === 'de'
                      ? 'Änderungen speichern'
                      : 'Save Changes'
                    : lang === 'de'
                    ? 'Produkt erstellen'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Item Create / Edit Modal */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2px] shadow-2xl max-w-2xl w-full border border-[#E8E6E1] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0D0D0D] text-white flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-serif text-lg font-normal text-white">
                  {editingFaq
                    ? lang === 'de'
                      ? 'FAQ-Frage bearbeiten'
                      : 'Edit FAQ Item'
                    : lang === 'de'
                    ? 'Neue FAQ-Frage anlegen'
                    : 'Create New FAQ Item'}
                </h3>
                <p className="text-[10px] font-display uppercase tracking-widest text-[#DEA43E] mt-0.5">
                  {editingFaq ? editingFaq.id : (lang === 'de' ? 'Wissensdatenbank-Eintrag' : 'Knowledge Base Entry')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="text-white/60 hover:text-white text-lg p-1"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveFaq} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Kategorie *' : 'Category *'}
                  </label>
                  <select
                    value={faqFormData.category}
                    onChange={(e) =>
                      setFaqFormData({ ...faqFormData, category: e.target.value as FAQItem['category'] })
                    }
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  >
                    <option value="hair">{lang === 'de' ? 'Echthaar & Herkunft (Hair & Origin)' : 'Hair & Origin'}</option>
                    <option value="lace">{lang === 'de' ? 'HD Lace (HD Spitze)' : 'HD Lace'}</option>
                    <option value="shipping">{lang === 'de' ? 'Versand & Dauer (Shipping)' : 'Shipping & Logistics'}</option>
                    <option value="returns">{lang === 'de' ? 'Rückgaberecht (Returns)' : 'Returns & Protection'}</option>
                    <option value="general">{lang === 'de' ? 'Allgemein (General)' : 'General'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Reihenfolge / Position' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={faqFormData.order}
                    onChange={(e) =>
                      setFaqFormData({ ...faqFormData, order: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E] font-mono"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Frage (Deutsch) *' : 'Question (German) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={faqFormData.questionDe}
                    onChange={(e) => setFaqFormData({ ...faqFormData, questionDe: e.target.value })}
                    placeholder="z.B. Woher stammt das Macrown-Haar?"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Frage (Englisch)' : 'Question (English)'}
                  </label>
                  <input
                    type="text"
                    value={faqFormData.questionEn}
                    onChange={(e) => setFaqFormData({ ...faqFormData, questionEn: e.target.value })}
                    placeholder="e.g. Where is Macrown hair sourced and handcrafted?"
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                  />
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Ausführliche Antwort (Deutsch) *' : 'Detailed Answer (German) *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={faqFormData.answerDe}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answerDe: e.target.value })}
                    placeholder="Erkläre die Details für Kundinnen transparent und verständlich..."
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#DEA43E] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                    {lang === 'de' ? 'Ausführliche Antwort (Englisch)' : 'Detailed Answer (English)'}
                  </label>
                  <textarea
                    rows={4}
                    value={faqFormData.answerEn}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answerEn: e.target.value })}
                    placeholder="Detailed explanation for international clients..."
                    className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#DEA43E] leading-relaxed"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-[#E8E6E1] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E6E1] text-xs font-display uppercase tracking-wider rounded-[2px] hover:bg-neutral-100"
                >
                  {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0D0D0D] text-white hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-colors shadow-sm"
                >
                  {editingFaq
                    ? lang === 'de'
                      ? 'Änderungen speichern'
                      : 'Save Changes'
                    : lang === 'de'
                    ? 'Frage anlegen'
                    : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Atelier Printable Receipt Modal for Admin */}
      <PrintableReceipt
        order={selectedReceiptOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptOrder(null);
        }}
        lang={lang}
      />
    </div>
  );
}
