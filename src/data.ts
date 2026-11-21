export type Lang = 'de' | 'en';

export interface ProductDocument {
  name: string;
  url: string;
  type?: 'pdf' | 'doc' | 'image' | 'certificate';
  sizeBytes?: number;
}

export interface Product {
  id: string;
  name: { de: string; en: string };
  category: 'wigs' | 'bundles' | 'closure-frontal' | 'ponytail';
  price: number; // in cents
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  tags: string[];
  texture: string;
  lengths: string[];
  hairType: 'Lux Hair' | 'Virgin Hair';
  laceType?: string;
  rating: number;
  reviews: number;
  badge?: { de: string; en: string };
  description: { de: string; en: string };
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockQuantity?: number;
  documents?: ProductDocument[];
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: {
      de: 'GODFIDENCE Perücke – Body Wave HD Lace',
      en: 'GODFIDENCE Wig – Body Wave HD Lace',
    },
    category: 'wigs',
    price: 38900,
    originalPrice: 42900,
    image: '/images/MRDC2196.jpg',
    hoverImage: '/images/MRDC2245.jpg',
    tags: ['Bestseller', 'HD Lace', 'Virgin Hair'],
    texture: 'Body Wave',
    lengths: ['20"', '24"', '28"', '30"'],
    hairType: 'Virgin Hair',
    laceType: '13x6 Melt HD Lace',
    rating: 5.0,
    stockStatus: 'in_stock',
    stockQuantity: 14,
    reviews: 28,
    badge: { de: 'Flagship Kollektion', en: 'Flagship Collection' },
    description: {
      de: 'Unser Signatur-Modell: Gefertigt mit hauchdünnem HD-Lace für eine nahtlose, unsichtbare Haarlinie und natürliches Volumen.',
      en: 'Our signature piece: Crafted with ultra-thin HD lace for a seamless, undetectable hairline and natural volume.',
    },
  },
  {
    id: '2',
    name: {
      de: 'HD LUX Closure & Frontal Set',
      en: 'HD LUX Closure & Frontal Set',
    },
    category: 'closure-frontal',
    price: 14900,
    image: '/images/MRDC1822.jpg',
    hoverImage: '/images/MRDC1845.jpg',
    tags: ['HD Lace', 'Lux Hair', 'Ultra Thin'],
    texture: 'Straight',
    lengths: ['14"', '16"', '18"', '20"'],
    hairType: 'Lux Hair',
    laceType: 'Real Invisible Swiss HD',
    rating: 4.9,
    reviews: 34,
    badge: { de: 'Kundenfavorit', en: 'Customer Favorite' },
    description: {
      de: 'Höchste Schweizer HD-Spitzentechnologie. Passt sich jedem Hautton sofort an, ohne aufwendiges Tönen.',
      en: 'Supreme Swiss HD lace technology. Melts directly into all skin tones without tedious tinting.',
    },
  },
  {
    id: '3',
    name: {
      de: 'LUX Bündel – Silky Raw Straight',
      en: 'LUX Bundles – Silky Raw Straight',
    },
    category: 'bundles',
    price: 11900,
    originalPrice: 13500,
    image: '/images/MRDC2133.jpg',
    hoverImage: '/images/MRDC2162.jpg',
    tags: ['Lux Hair', 'Double Drawn', 'Färbbar'],
    texture: 'Silky Straight',
    lengths: ['18"', '22"', '26"', '30"'],
    hairType: 'Lux Hair',
    rating: 5.0,
    reviews: 42,
    badge: { de: 'Bis Blond färbbar', en: 'Bleachable to Blonde' },
    description: {
      de: 'Exklusive Rohhaar-Alternative aus kontrollierten vietnamesischen Quellen. Gesund glänzend und färbbar bis zu dunklem Blond.',
      en: 'Exclusive raw hair alternative from vetted sources. Natural silk sheen, safely liftable to warm blonde.',
    },
  },
  {
    id: '4',
    name: {
      de: 'Ponytail LUX – Sleek Clip-In Extension',
      en: 'Ponytail LUX – Sleek Clip-In Extension',
    },
    category: 'ponytail',
    price: 8900,
    image: '/images/MRDC2014.jpg',
    hoverImage: '/images/MRDC2084.jpg',
    tags: ['Ponytail', 'Lux Hair', 'Quick Style'],
    texture: 'Straight / Sleek',
    lengths: ['22"', '26"', '30"'],
    hairType: 'Lux Hair',
    rating: 4.8,
    reviews: 19,
    description: {
      de: 'Verleiht in unter 2 Minuten majestätische Dichte und atemberaubende Länge mit sicherem Halt.',
      en: 'Instantly adds regal fullness and sweeping length in under 2 minutes with rock-solid hold.',
    },
  },
  {
    id: '5',
    name: {
      de: 'Blonde 613 Bündel – Platinum Lux',
      en: 'Blonde 613 Bundles – Platinum Lux',
    },
    category: 'bundles',
    price: 13900,
    image: '/images/MRDC1868.jpg',
    hoverImage: '/images/MRDC1786.jpg',
    tags: ['613 Blonde', 'Lux Hair', 'Premium'],
    texture: 'Silky Straight',
    lengths: ['20"', '24"', '28"'],
    hairType: 'Lux Hair',
    rating: 4.9,
    reviews: 16,
    badge: { de: 'Limited Edition', en: 'Limited Edition' },
    description: {
      de: 'Gleichmäßig aufgehelltes, unberührt weiches 613-Platinblond, bereit für individuelle Pastell- oder Balayage-Tönungen.',
      en: 'Evenly lifted 613 platinum blonde, retaining intact cuticle smoothness and ready for custom toning.',
    },
  },
  {
    id: '6',
    name: {
      de: 'Virgin Closure & Frontal HD 13x4',
      en: 'Virgin Closure & Frontal HD 13x4',
    },
    category: 'closure-frontal',
    price: 12900,
    image: '/images/MRDC2119.jpg',
    hoverImage: '/images/MRDC2196.jpg',
    tags: ['Virgin Hair', 'HD Lace'],
    texture: 'Body Wave',
    lengths: ['14"', '16"', '18"', '20"'],
    hairType: 'Virgin Hair',
    laceType: '13x4 HD Transparent',
    rating: 5.0,
    reviews: 23,
    description: {
      de: '100% chemiefreies Virgin-Echthaar mit natürlicher Schuppenschicht. Ausgezeichnete Langlebigkeit und Pflegeleichtigkeit.',
      en: '100% pure unprocessed virgin hair with aligned cuticles. Exceptional longevity and low maintenance.',
    },
  },
  {
    id: '7',
    name: {
      de: 'Ponytail Virgin – Natural Volume',
      en: 'Ponytail Virgin – Natural Volume',
    },
    category: 'ponytail',
    price: 7900,
    image: '/images/MRDC2084.jpg',
    tags: ['Virgin Hair', 'Natural Texture'],
    texture: 'Natural Wave',
    lengths: ['20"', '24"'],
    hairType: 'Virgin Hair',
    rating: 4.8,
    reviews: 14,
    description: {
      de: 'Der perfekte tägliche Begleiter: Schnelles Befestigen für einen voluminösen, femininen Auftritt.',
      en: 'The effortless daily essential: Snap and wrap for rich density and captivating movement.',
    },
  },
  {
    id: '8',
    name: {
      de: 'Virgin Hair Bündel – 3er Bundle Set',
      en: 'Virgin Hair Bundles – 3-Bundle Value Set',
    },
    category: 'bundles',
    price: 24900,
    originalPrice: 28500,
    image: '/images/MRDC1958.jpg',
    tags: ['Virgin Hair', 'Spar-Set', 'Full Sew-In'],
    texture: 'Body Wave',
    lengths: ['20"+22"+24"', '22"+24"+26"'],
    hairType: 'Virgin Hair',
    rating: 5.0,
    reviews: 31,
    badge: { de: 'Vorteils-Set', en: 'Bundle Deal' },
    description: {
      de: 'Drei perfekt aufeinander abgestimmte Echthaarbündel für eine vollendete, voluminöse Komplett-Frisur.',
      en: 'Three hand-matched bundles curated for full, luxurious density and cohesive natural taper.',
    },
  },
];

export const CATEGORIES_DATA = [
  {
    id: 'wigs',
    title: { de: 'GODFIDENCE Perücken', en: 'GODFIDENCE Wigs' },
    subtitle: { de: 'Handgefertigt & maßgeschneidert', en: 'Handcrafted & Tailored' },
    image: '/images/MRDC2196.jpg',
    link: '#shop',
  },
  {
    id: 'closure-frontal',
    title: { de: 'Closure & Frontal', en: 'Closure & Frontal' },
    subtitle: { de: 'Unsichtbare HD Lace Haarlinie', en: 'Invisible HD Melt Lace' },
    image: '/images/MRDC1822.jpg',
    link: '#shop',
  },
  {
    id: 'bundles',
    title: { de: 'Haarbündel (Lux & Virgin)', en: 'Hair Bundles (Lux & Virgin)' },
    subtitle: { de: '100% Remy Echthaar aus Vietnam', en: '100% Vietnamese Remy Hair' },
    image: '/images/MRDC2133.jpg',
    link: '#shop',
  },
  {
    id: 'ponytail',
    title: { de: 'Ponytail Extensions', en: 'Ponytail Extensions' },
    subtitle: { de: 'Sofortiges Luxus-Volumen', en: 'Instant Regal Fullness' },
    image: '/images/MRDC2014.jpg',
    link: '#shop',
  },
];

export const REAL_REVIEWS = [
  {
    quote:
      'Würde wohl eher gegen Ende des Jahres schauen, da ich mit dem Volumen noch recht zufrieden bin 🥰 Haare sind echt toll!',
    author: 'Amina K.',
    city: 'Köln',
    product: 'GODFIDENCE Perücke Body Wave',
    avatar: '/images/testimony-1.jpg',
    stars: 5,
  },
  {
    quote:
      'Die amerikanischen Mädchen waren begeistert, ich sagte ihnen, wir haben einen neuen Haarstecker! Unglaubliche Seidigkeit.',
    author: 'Sarah M.',
    city: 'Frankfurt / Atlanta',
    product: 'HD LUX Frontal 13x6',
    avatar: '/images/testimony-2.jpg',
    stars: 5,
  },
  {
    quote:
      'Ich liebe diese Qualität. Das beste Haar, das ich je hatte. Das HD Lace verschmilzt komplett mit meiner Haut.',
    author: 'Debora E.',
    city: 'Berlin',
    product: 'LUX Bündel Silky Straight',
    avatar: '/images/testimony-3.jpg',
    stars: 5,
  },
];

export const LANG = {
  de: {
    topBanner: '✦ KOSTENLOSER VERSAND AB 150 € • 100% REMY ECHTHAAR • HANDGEFERTIGT IN VIETNAM ✦',
    nav: {
      home: 'Home',
      shop: 'Shop',
      categories: 'Kategorien',
      guide: 'Haar-Vergleich',
      about: 'Über uns',
      contact: 'Kontakt',
    },
    hero: {
      eyebrow: 'HAUTE COIFFURE & ECHTHAAR-MANUFAKTUR',
      headline: 'Kröne Dich mit Gottvertrauen.',
      sub: 'Exklusive Echthaarperücken, hauchzartes HD-Lace und handverlesene Haarbündel aus Vietnam. Handwerkskunst, die deine natürliche Würde und Schönheit erstrahlen lässt.',
      shopBtn: 'Kollektion entdecken',
      guideBtn: 'Virgin vs. Lux Hair Guide',
      experienceBadge: '100% Unbehandeltes Remy Echthaar',
      quote: '„Neues Haar. Neues Abenteuer. Wahres Selbstbewusstsein.“',
    },
    trust: [
      { title: 'Vietnamesische Manufaktur', desc: 'Sorgfältig handgeknüpft & verarbeitet' },
      { title: 'Echtes HD Melt Lace', desc: 'Nahezu unsichtbar für jede Hautnuance' },
      { title: 'Persönliche Beratung', desc: 'Individuelle WhatsApp-Haarexpertise' },
      { title: 'Sicherer Versand & Rückgabe', desc: '14 Tage Bedenkzeit mit Rückgaberecht' },
    ],
    categoriesSection: {
      badge: 'PRODUKTLINIEN',
      title: 'Ausgewählte Kategorien',
      sub: 'Veredle deinen Look mit unserer handgefertigten Auswahl an Perücken, Tressen und Frontals.',
    },
    shopSection: {
      badge: 'ECHTHAAR-KOLLEKTION',
      title: 'Unsere Bestseller',
      sub: 'Entdecke makellose Texturen, seidigen Fall und lebendige Sprungkraft.',
      filters: {
        all: 'Alle Kollektionen',
        wigs: 'Perücken',
        bundles: 'Haarbündel',
        'closure-frontal': 'Closure & Frontal',
        ponytail: 'Ponytails',
      },
      addToBag: 'In die Einkaufstasche',
      viewDetails: 'Schnellansicht',
      lengthsLabel: 'Längen:',
      inStock: 'Auf Lager – Fertig zum Versand',
    },
    guideSection: {
      badge: 'EXPERTISE & TRANSPARENZ',
      title: 'Der Unterschied: Lux Hair vs. Virgin Hair',
      sub: 'Wir glauben an absolute Ehrlichkeit bei der Haarauswahl. Erfahre, welche Qualität optimal zu deinen Styling-Wünschen passt.',
      virginCard: {
        title: 'Virgin Hair',
        badge: 'Naturbelassen & Langlebig',
        desc: 'Unbehandeltes Echthaar, das niemals chemisch gefärbt, gebleicht oder verändert wurde. Es stammt von wenigen Spendern und bietet ein exzellentes Preis-Leistungs-Verhältnis für den Alltag.',
        points: [
          '100% chemiefrei & gesunde Schuppenschicht',
          'Sehr langlebig & unkompliziert zu pflegen',
          'Ideal für natürliche Schwarz- & Dunkelbrauntöne',
          'Begrenzt aufhellbar (schonendes Tönen)',
        ],
      },
      luxCard: {
        title: 'Lux Hair',
        badge: 'High-End Atelier Qualität',
        desc: 'Unsere exklusivste Premiumqualität – eine edle Alternative zu kostbarem Raw Hair. Streng selektiert, minimal verarbeitet und mit atemberaubender Reinheit in der Haarstruktur.',
        points: [
          'Höchste Selektionsstufe mit natürlicher Leuchtkraft',
          'Aufhellbar bis zu einem dunklen Blondton',
          'Seidiger Griff, minimale Verknotung & maximales Volumen',
          'Für anspruchsvollste Stylings & höchste Langlebigkeit',
        ],
      },
      hdLaceCard: {
        title: 'High Definition (HD) Lace',
        badge: 'Die unsichtbare Revolution',
        desc: 'Extrem feine Schweizer Spitzenqualität, die sich wie eine zweite Haut nahtlos an jede Hautfarbe anlegt. Kreiert den Eindruck, als wachse das Haar direkt aus der Kopfhaut.',
        points: [
          'Ultradünn und im Tageslicht unsichtbar',
          'Kein hartes Bleichen der Knoten nötig',
          'Benötigt sanfte, liebevolle Pflege für maximale Haltbarkeit',
        ],
      },
    },
    testimonialsSection: {
      badge: 'STIMMEN UNSERER KUNDINNEN',
      title: 'Ehrliche Erfahrungen & Gottvertrauen',
      sub: 'Erfahre, warum Frauen in ganz Europa Macrown Hair vertrauen.',
      verified: 'Verifizierte Käuferin',
    },
    consultationSection: {
      badge: 'VIP CONCIERGE',
      title: 'Persönliche Haarberatung via WhatsApp',
      sub: 'Du bist unsicher bei der Texturwahl, Lace-Farbe oder Dichte? Unser Team berät dich diskret und professionell.',
      btn: 'Jetzt unverbindlich beraten lassen',
      phone: '+49 172 812 3222',
    },
    faqSection: {
      badge: 'WISSENSWERTES',
      title: 'Häufig gestellte Fragen',
      sub: 'Alles zu Pflege, Herkunft, Fertigung und Lieferzeiten.',
      items: [
        {
          q: 'Woher stammt das Macrown-Haar und wo wird es gefertigt?',
          a: 'Unser Haar stammt aus ethisch kontrollierten Quellen in Vietnam. Jede Perücke und jedes Bündel wird in spezialisierten Manufakturen mit jahrzehntelanger Knüpf-Erfahrung von Hand gefertigt.',
        },
        {
          q: 'Was ist der Unterschied zwischen Virgin Hair und Lux Hair?',
          a: 'Virgin Hair ist naturbelassenes Echthaar ohne chemische Behandlung – langlebig und perfekt für natürliche Styles. Lux Hair ist unsere handverlesene Spitzenqualität: besonders rein, noch seidiger und bei Bedarf bis zu einem eleganten Blondton aufhellbar.',
        },
        {
          q: 'Warum ist HD Lace der herkömmlichen Spitze überlegen?',
          a: 'HD Lace (High Definition) ist mikrodünn und transparent. Es reflektiert kein Licht und verschmilzt nahtlos mit jedem Hautton, sodass kein Übergang sichtbar ist.',
        },
        {
          q: 'Wie lange dauert die Anfertigung und der Versand?',
          a: 'Da viele unserer Perücken in Vietnam individuell für dich angefertigt und veredelt werden, beträgt die Lieferzeit ca. 14 bis 21 Tage. Vorrätige Bündel und Frontals werden innerhalb von 2-4 Werktagen versandt.',
        },
        {
          q: 'Wie sieht das Rückgaberecht aus?',
          a: 'Wir bieten eine 14-tägige Rückgabefrist für ungetragene, ungeschnittene Artikel in der Originalverpackung mit voller Rückerstattung.',
        },
      ],
    },
    cart: {
      title: 'Einkaufstasche',
      empty: 'Deine Einkaufstasche ist noch leer.',
      startShopping: 'Kollektion erkunden',
      freeShippingThreshold: 15000,
      freeShippingUnlocked: 'Gratis-Versand freigeschaltet! 🎉',
      freeShippingRemaining: (rem: number) => `Noch ${(rem / 100).toFixed(2).replace('.', ',')} € bis zum kostenlosen Versand!`,
      subtotal: 'Zwischensumme',
      shippingNotice: 'Steuern und Versandkosten werden an der Kasse berechnet.',
      checkout: 'Sicher zur Kasse gehen',
    },
    footer: {
      tagline: 'Mit uns schreibst du deine eigene Geschichte – neues Haar, neues Abenteuer!',
      aboutText: 'Macrown Hair steht für Hingabe zur Perfektion, Gottvertrauen und pure weibliche Eleganz. Höchste vietnamesische Echthaarqualität für deinen individuellen Glanz.',
      customerCare: 'Kundenservice',
      legalTitle: 'Rechtliches',
      phone: '+49 172 812 3222',
      email: 'hello@macrown.org',
      hours: 'Mo – Sa: 09:00 – 18:00 Uhr',
      links: [
        { label: 'Shop', href: '#shop' },
        { label: 'Haar-Guide', href: '#guide' },
        { label: 'Über uns', href: '#about' },
        { label: 'FAQs', href: '#faq' },
        { label: 'Impressum', href: 'https://www.macrown.org/impressum/' },
        { label: 'AGBs', href: 'https://www.macrown.org/agb/' },
        { label: 'Datenschutz', href: 'https://www.macrown.org/datenschutzerklaerung/' },
        { label: 'Versandbedingungen', href: 'https://www.macrown.org/versandbedingungen' },
        { label: 'Widerrufsrecht', href: 'https://www.macrown.org/widerrufsrecht/' },
      ],
      newsletterTitle: 'Macrown Privé Club',
      newsletterSub: 'Erhalte exklusive Kollektions-Releases, Pflege-Tipps und 10% Willkommensrabatt.',
      newsletterPlaceholder: 'Deine E-Mail-Adresse...',
      newsletterBtn: 'Abonnieren',
      copyright: '© 2026 Macrown Hair. Alle Rechte vorbehalten. Offizielle Website.',
    },
  },
  en: {
    topBanner: '✦ FREE SHIPPING OVER 150 € • 100% REMY HUMAN HAIR • HANDCRAFTED IN VIETNAM ✦',
    nav: {
      home: 'Home',
      shop: 'Shop',
      categories: 'Categories',
      guide: 'Hair Guide',
      about: 'About',
      contact: 'Contact',
    },
    hero: {
      eyebrow: 'HAUTE COIFFURE & HUMAN HAIR ATELIER',
      headline: 'Crown yourself with confidence.',
      sub: 'Exquisite human hair wigs, whisper-thin HD melt lace, and pristine hair bundles from Vietnam. Master craftsmanship that elevates your divine dignity and radiant self-assurance.',
      shopBtn: 'Explore Collection',
      guideBtn: 'Virgin vs. Lux Hair Guide',
      experienceBadge: '100% Pure Virgin & Lux Remy Hair',
      quote: '“New hair. New adventure. Unshakable confidence.”',
    },
    trust: [
      { title: 'Vietnamese Atelier', desc: 'Meticulously hand-knotted & crafted' },
      { title: 'True HD Melt Lace', desc: 'Virtually undetectable across all skin tones' },
      { title: 'Personal Concierge', desc: 'One-on-one WhatsApp hair consultation' },
      { title: 'Insured Delivery & Returns', desc: '14-day hassle-free return guarantee' },
    ],
    categoriesSection: {
      badge: 'PRODUCT LINES',
      title: 'Curated Categories',
      sub: 'Elevate your signature look with our bespoke selection of wigs, bundles, and frontals.',
    },
    shopSection: {
      badge: 'HAIR COLLECTION',
      title: 'Our Bestsellers',
      sub: 'Discover breathtaking textures, fluid drape, and buoyant natural bounce.',
      filters: {
        all: 'All Collections',
        wigs: 'Wigs',
        bundles: 'Hair Bundles',
        'closure-frontal': 'Closure & Frontal',
        ponytail: 'Ponytails',
      },
      addToBag: 'Add to Shopping Bag',
      viewDetails: 'Quick View',
      lengthsLabel: 'Lengths:',
      inStock: 'In Stock – Ready to Ship',
    },
    guideSection: {
      badge: 'EXPERTISE & TRANSPARENCY',
      title: 'The Distinction: Lux Hair vs. Virgin Hair',
      sub: 'We champion transparency in hair sourcing. Learn which grade effortlessly matches your styling ambition.',
      virginCard: {
        title: 'Virgin Hair',
        badge: 'Pure & Resilient',
        desc: 'Completely untreated human hair that has never been dyed, bleached, or altered. Sourced from single or few donors, delivering dependable longevity and everyday value.',
        points: [
          '100% chemical-free with intact cuticle direction',
          'Durable, manageable, and soft to the touch',
          'Perfect for natural deep brown and black tones',
          'Gentle lifting capacity for everyday styling',
        ],
      },
      luxCard: {
        title: 'Lux Hair',
        badge: 'High-End Atelier Grade',
        desc: 'Our premier collection – an extraordinary alternative to raw hair. Meticulously inspected, minimally handled, offering immaculate structural purity and rich luster.',
        points: [
          'Highest grade selection with innate silken sheen',
          'Safely bleachable up to dark golden blonde',
          'Supple hand-feel, zero tangle, and generous density',
          'Designed for exacting aesthetics and maximum wear time',
        ],
      },
      hdLaceCard: {
        title: 'High Definition (HD) Lace',
        badge: 'The Invisible Revolution',
        desc: 'Feather-light Swiss lace that melts into all complexions effortlessly. Gives the pristine illusion that every strand grows naturally from the scalp.',
        points: [
          'Ultra-thin and undetectable in direct daylight',
          'Eliminates harsh bleach lines and heavy knots',
          'Requires gentle, dedicated care for enduring beauty',
        ],
      },
    },
    testimonialsSection: {
      badge: 'CLIENT VOICES',
      title: 'Honest Reviews & Godfidence',
      sub: 'Discover why women across Europe trust Macrown Hair for their signature moments.',
      verified: 'Verified Customer',
    },
    consultationSection: {
      badge: 'VIP CONCIERGE',
      title: 'Personal Hair Consultation via WhatsApp',
      sub: 'Not sure about lace tone, density, or bundle count? Chat directly with our master stylists.',
      btn: 'Start Confidential Consultation',
      phone: '+49 172 812 3222',
    },
    faqSection: {
      badge: 'KNOWLEDGE BASE',
      title: 'Frequently Asked Questions',
      sub: 'Everything about maintenance, origin, tailoring, and delivery times.',
      items: [
        {
          q: 'Where is Macrown hair sourced and handcrafted?',
          a: 'Our hair is ethically sourced in Vietnam. Each bespoke unit and bundle is meticulously constructed in artisanal studios with generations of knotting expertise.',
        },
        {
          q: 'What is the distinction between Virgin Hair and Lux Hair?',
          a: 'Virgin Hair is untreated human hair with natural integrity – exceptionally durable for daily wear. Lux Hair is our crown-tier grade: selected from only the healthiest donors, smoother, and bleachable up to blonde tones.',
        },
        {
          q: 'Why is HD Lace superior to conventional lace?',
          a: 'HD (High Definition) lace is microscopic in gauge and completely transparent. It absorbs rather than reflects light, disappearing seamlessly against any skin tone.',
        },
        {
          q: 'How long does custom crafting and shipping take?',
          a: 'Because our signature wigs are custom tailored in Vietnam, fulfillment takes approximately 14 to 21 days. In-stock bundles and frontals ship within 2-4 business days.',
        },
        {
          q: 'What is the return policy?',
          a: 'We extend a 14-day return window for unaltered, unworn items in pristine original packaging with complete refund protection.',
        },
      ],
    },
    cart: {
      title: 'Shopping Bag',
      empty: 'Your shopping bag is currently empty.',
      startShopping: 'Explore the Collection',
      freeShippingThreshold: 15000,
      freeShippingUnlocked: 'Free shipping unlocked! 🎉',
      freeShippingRemaining: (rem: number) => `Add ${(rem / 100).toFixed(2)} € more for complimentary shipping!`,
      subtotal: 'Subtotal',
      shippingNotice: 'Taxes and shipping calculated at checkout.',
      checkout: 'Proceed to Secure Checkout',
    },
    footer: {
      tagline: 'Write your own story with us – new hair, new adventure!',
      aboutText: 'Macrown Hair is dedicated to perfection, divine confidence, and timeless femininity. Handcrafted Vietnamese human hair made for your radiant presence.',
      customerCare: 'Customer Care',
      legalTitle: 'Legal',
      phone: '+49 172 812 3222',
      email: 'hello@macrown.org',
      hours: 'Mon – Sat: 09:00 – 18:00 CET',
      links: [
        { label: 'Shop', href: '#shop' },
        { label: 'Hair Guide', href: '#guide' },
        { label: 'About Us', href: '#about' },
        { label: 'FAQs', href: '#faq' },
        { label: 'Imprint', href: 'https://www.macrown.org/impressum/' },
        { label: 'Terms', href: 'https://www.macrown.org/agb/' },
        { label: 'Privacy', href: 'https://www.macrown.org/datenschutzerklaerung/' },
        { label: 'Shipping Terms', href: 'https://www.macrown.org/versandbedingungen' },
        { label: 'Return Policy', href: 'https://www.macrown.org/widerrufsrecht/' },
      ],
      newsletterTitle: 'Macrown Privé Club',
      newsletterSub: 'Receive private collection drops, hair maintenance masterclasses, and 10% off your first order.',
      newsletterPlaceholder: 'Enter your email address...',
      newsletterBtn: 'Subscribe',
      copyright: '© 2026 Macrown Hair. All rights reserved. Official Website.',
    },
  },
};
