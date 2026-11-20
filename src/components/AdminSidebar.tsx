import type { Lang } from '../data';

export type AdminTab = 'inventory' | 'analytics' | 'categories' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  productsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  currentUserEmail?: string | null;
  lang: Lang;
  setLang: (lang: Lang) => void;
  onExitAdmin: () => void;
  onSignOut: () => void;
  onOpenAddModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  productsCount,
  lowStockCount,
  outOfStockCount,
  currentUserEmail,
  lang,
  setLang,
  onExitAdmin,
  onSignOut,
  onOpenAddModal,
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const needsAttention = lowStockCount + outOfStockCount;

  const navItems = [
    {
      id: 'inventory' as AdminTab,
      labelDe: 'Inventar & Produkte',
      labelEn: 'Inventory & Catalog',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      badge: productsCount,
      badgeColor: 'bg-white/10 text-white/90',
    },
    {
      id: 'analytics' as AdminTab,
      labelDe: 'Bestand & KPIs',
      labelEn: 'Stock & KPIs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      badge: needsAttention > 0 ? `${needsAttention} Warnung` : undefined,
      badgeColor: 'bg-amber-900/60 text-amber-300 border border-amber-600/40',
    },
    {
      id: 'categories' as AdminTab,
      labelDe: 'Kategorien & Grade',
      labelEn: 'Categories & Grades',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      badge: undefined,
      badgeColor: '',
    },
    {
      id: 'settings' as AdminTab,
      labelDe: 'Cloud & DMS',
      labelEn: 'Cloud & DMS',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      badge: 'Cloudinary (Free)',
      badgeColor: 'bg-emerald-950 text-emerald-400 font-mono text-[9px] border border-emerald-600/40',
    },
  ];

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#0D0D0D] text-white select-none">
      {/* Top Brand & Status Section */}
      <div>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-cinzel text-xl tracking-[0.24em] font-medium text-white">MACROWN</span>
            <span className="text-[9px] font-display font-bold uppercase tracking-widest text-[#DEA43E] bg-[#DEA43E]/10 px-2 py-0.5 rounded-[1px] border border-[#DEA43E]/30">
              ATELIER OS
            </span>
          </div>

          <div className="p-2.5 bg-[#141414] border border-white/10 rounded-[2px] flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[11px] font-mono text-white/80 truncate">
                {currentUserEmail || 'admin@macrown.org'}
              </span>
            </div>
            <span className="text-[9px] font-display uppercase tracking-widest text-emerald-400 font-semibold shrink-0">
              {lang === 'de' ? 'Aktiv' : 'Live'}
            </span>
          </div>
        </div>

        {/* Action Button: Create Product */}
        <div className="p-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => {
              onOpenAddModal();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] font-display text-[11px] font-bold uppercase tracking-[0.18em] rounded-[2px] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>{lang === 'de' ? 'Neues Produkt' : 'Add Product'}</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[9.5px] font-display uppercase tracking-[0.25em] text-[#DEA43E]/80 font-bold">
            {lang === 'de' ? 'Atelier Navigation' : 'Atelier Navigation'}
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[2px] text-xs font-display tracking-wider transition-all text-left ${
                  isActive
                    ? 'bg-[#1C1C1C] text-[#DEA43E] font-semibold border-l-2 border-[#DEA43E]'
                    : 'text-white/70 hover:text-white hover:bg-white/5 font-normal'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#DEA43E]' : 'text-white/50'}>{item.icon}</span>
                  <span className="text-[11.5px] uppercase">{lang === 'de' ? item.labelDe : item.labelEn}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded-[1px] font-mono ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Tools & Controls */}
      <div className="p-4 border-t border-white/10 space-y-3 bg-[#0A0A0A]">
        {/* Language switch */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-display uppercase tracking-wider text-white/50">
            {lang === 'de' ? 'Sprache' : 'Language'}
          </span>
          <div className="flex items-center bg-[#1A1A1A] border border-white/20 rounded-[2px] p-0.5 select-none">
            <button
              type="button"
              onClick={() => setLang('de')}
              className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase transition-all rounded-[1px] ${
                lang === 'de' ? 'bg-[#DEA43E] text-[#0D0D0D]' : 'text-white/60 hover:text-white'
              }`}
            >
              DE
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase transition-all rounded-[1px] ${
                lang === 'en' ? 'bg-[#DEA43E] text-[#0D0D0D]' : 'text-white/60 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Storefront return */}
        <button
          type="button"
          onClick={onExitAdmin}
          className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-[11px] font-display uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2"
        >
          <span>← {lang === 'de' ? 'Zum Online-Shop' : 'To Online Store'}</span>
        </button>

        {/* Sign Out */}
        <button
          type="button"
          onClick={onSignOut}
          className="w-full py-1.5 text-center text-[10.5px] font-display uppercase tracking-wider text-white/40 hover:text-rose-400 transition-colors"
        >
          {lang === 'de' ? 'Abmelden' : 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidenav */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#262626] sticky top-0 h-screen overflow-y-auto z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full">
          {sidebarContent}
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-lg p-1"
            title="Schließen"
          >
            ✕
          </button>
        </div>
      </aside>
    </>
  );
}
