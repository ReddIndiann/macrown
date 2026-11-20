import { useState, useEffect } from 'react';
import { LANG, PRODUCTS } from './data';
import type { Lang, Product } from './data';
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

export default function App() {
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
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading stored products', e);
      }
    }
    return PRODUCTS;
  });

  // Admin View state (checks #admin hash or /admin path)
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.hash === '#admin' ||
        window.location.pathname === '/admin'
      );
    }
    return false;
  });

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
      if (window.location.hash === '#admin') {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
        if (window.location.hash === '#shop') {
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
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const handleOpenAdmin = () => {
    setIsAdminView(true);
    window.location.hash = '#admin';
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
            />

            <HairGuide lang={lang} t={t} />

            <ConsultationBanner t={t} />

            <Testimonials t={t} />

            <FAQ t={t} />
          </>
        )}
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenAdmin={handleOpenAdmin}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        lang={lang}
        t={t}
      />
    </div>
  );
}
