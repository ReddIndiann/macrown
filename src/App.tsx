import { useState, useEffect } from 'react';
import { LANG, PRODUCTS, INITIAL_FAQS, INITIAL_ATELIER_CONTENT } from './data';
import type { Lang, Product, FAQItem, AtelierContent } from './data';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import ProductGrid from './components/ProductGrid';
import HairGuide from './components/HairGuide';
import { Testimonials, FAQ, ConsultationBanner, Footer } from './components/Sections';
import CartDrawer from './components/CartDrawer';
import type { CartItem } from './components/CartDrawer';
import AdminPortal from './components/AdminPortal';
import ShopPage from './components/ShopPage';
import CookieBanner from './components/CookieBanner';
import { useScrollReveal } from './hooks/useScrollReveal';

export default function App() {
  useScrollReveal();

  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('macrown_lang');
        if (saved === 'de' || saved === 'en') return saved;
      } catch (e) {
        console.error('Error reading language', e);
      }
    }
    return 'de';
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('macrown_lang', newLang);
    } catch (e) {
      console.error('Error saving language', e);
    }
  };

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Products state (persists to localStorage so admin updates remain active across reloads)
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('macrown_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Auto-migrate any legacy remote URLs to local /images/ paths
            return parsed.map((p: Product) => ({
              ...p,
              image: p.image?.replace(/^https:\/\/www\.macrown\.org\/wp-content\/uploads\/\d{4}\/\d{2}\//, '/images/'),
              hoverImage: p.hoverImage?.replace(/^https:\/\/www\.macrown\.org\/wp-content\/uploads\/\d{4}\/\d{2}\//, '/images/'),
            }));
          }
        }
      } catch (e) {
        console.error('Error loading stored products', e);
      }
    }
    return PRODUCTS;
  });

  // FAQs state (persists to localStorage, editable via Admin CMS)
  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('macrown_faqs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        localStorage.setItem('macrown_faqs', JSON.stringify(INITIAL_FAQS));
      } catch (e) {
        console.warn('Error reading stored faqs', e);
      }
    }
    return INITIAL_FAQS;
  });

  const handleUpdateFaqs = (newFaqs: FAQItem[]) => {
    setFaqs(newFaqs);
    try {
      localStorage.setItem('macrown_faqs', JSON.stringify(newFaqs));
    } catch (e) {
      console.warn('Error saving faqs', e);
    }
  };

  // Atelier Brand & Footer Story state (persists to localStorage, editable via Admin CMS)
  const [atelierContent, setAtelierContent] = useState<AtelierContent>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('macrown_atelier_content');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.footerAbout) return parsed;
        }
        localStorage.setItem('macrown_atelier_content', JSON.stringify(INITIAL_ATELIER_CONTENT));
      } catch (e) {
        console.warn('Error reading stored atelier content', e);
      }
    }
    return INITIAL_ATELIER_CONTENT;
  });

  const handleUpdateAtelierContent = (newContent: AtelierContent) => {
    setAtelierContent(newContent);
    try {
      localStorage.setItem('macrown_atelier_content', JSON.stringify(newContent));
    } catch (e) {
      console.warn('Error saving atelier content', e);
    }
  };

  // Check if current URL represents admin
  const isCurrentlyAdmin = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    const path = window.location.pathname;
    return (
      hash === '#admin' ||
      hash.startsWith('#admin/') ||
      hash.startsWith('#admin?') ||
      path === '/admin' ||
      path.startsWith('/admin/')
    );
  };

  // Admin View state (checks #admin hash or /admin path)
  const [isAdminView, setIsAdminView] = useState<boolean>(isCurrentlyAdmin);

  // Current page state ('home' vs 'shop')
  const [currentPage, setCurrentPage] = useState<'home' | 'shop'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#shop' || window.location.pathname === '/shop') {
        return 'shop';
      }
    }
    return 'home';
  });

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (isCurrentlyAdmin()) {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
        if (window.location.hash === '#shop' || window.location.pathname === '/shop') {
          setCurrentPage('shop');
        } else {
          setCurrentPage('home');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: 'home' | 'shop') => {
    setIsAdminView(false);
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '#home' : '#shop';
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('macrown_products', JSON.stringify(newProducts));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  };

  const handleExitAdmin = () => {
    setIsAdminView(false);
    setCurrentPage('home');
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }
    window.location.hash = '#home';
  };

  const handleOpenAdmin = () => {
    setIsAdminView(true);
    const lastTab = (typeof window !== 'undefined' && localStorage.getItem('macrown_admin_tab')) || 'inventory';
    window.location.hash = `#admin/${lastTab}`;
  };

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('macrown_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error('Error loading saved cart', e);
      }
    }
    return [
      {
        product: products[0] || PRODUCTS[0],
        selectedLength: '24"',
        quantity: 1,
      },
    ];
  });

  // Persist cart updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('macrown_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }, [cartItems]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const t = LANG[lang];

  const handleAddToCart = (product: Product, selectedLength: string) => {
    if (product.stockStatus === 'out_of_stock' || product.stockQuantity === 0) {
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedLength === selectedLength
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, selectedLength, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, selectedLength: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId && item.selectedLength === selectedLength) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveItem = (productId: string, selectedLength: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedLength === selectedLength)
      )
    );
  };

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    if (currentPage === 'shop') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const shopElement = document.getElementById('shop');
      if (shopElement) {
        shopElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigateTo('shop');
      }
    }
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // If Admin View is active, render the Auth-Protected Admin Inventory Portal
  if (isAdminView) {
    return (
      <AdminPortal
        products={products}
        onUpdateProducts={handleUpdateProducts}
        faqs={faqs}
        onUpdateFaqs={handleUpdateFaqs}
        atelierContent={atelierContent}
        onUpdateAtelierContent={handleUpdateAtelierContent}
        onExitAdmin={handleExitAdmin}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  // Storefront view
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0D0D0D]">
      <Navbar
        lang={lang}
        t={t}
        setLang={setLang}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      <main>
        {currentPage === 'shop' ? (
          <ShopPage
            products={products}
            lang={lang}
            onAddToCart={handleAddToCart}
            onNavigateHome={() => navigateTo('home')}
            initialCategory={activeCategory}
          />
        ) : (
          <>
            <Hero
              lang={lang}
              t={t}
              onNavigateShop={() => navigateTo('shop')}
            />

            <Categories
              lang={lang}
              t={t}
              onSelectCategory={handleSelectCategory}
            />

            <ProductGrid
              products={products}
              lang={lang}
              t={t}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              onAddToCart={handleAddToCart}
              onViewMore={() => navigateTo('shop')}
            />

            <HairGuide lang={lang} t={t} />

            <ConsultationBanner t={t} />

            <Testimonials t={t} />

            <FAQ t={t} faqs={faqs} lang={lang} />
          </>
        )}
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenAdmin={handleOpenAdmin}
        atelierContent={atelierContent}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        lang={lang}
        t={t}
      />

      <CookieBanner lang={lang} />
    </div>
  );
}
