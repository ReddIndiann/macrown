import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { uploadToCloudinary, getCloudinaryUsage, type CloudinaryUsageData } from '../cloudinary';
import type {
  Product,
  Lang,
  Order,
  OrderStatus,
  FAQItem,
  AtelierContent,
  AdminRole,
  AdminUser,
  EmailConfig,
} from '../data';
import {
  INITIAL_ORDERS,
  INITIAL_FAQS,
  INITIAL_ATELIER_CONTENT,
  INITIAL_EMAIL_CONFIG,
  INITIAL_ADMIN_USERS,
} from '../data';
import AdminSidebar, { type AdminTab } from './AdminSidebar';
import PrintableReceipt from './PrintableReceipt';

export interface SentMailRecord {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  templateType: 'custom' | 'order_update' | 'care_advice' | 'payment_receipt' | 'vip_invitation';
  timestamp: string;
  sender: string;
  status: 'delivered' | 'sent';
}

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
        className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase transition-all rounded-[1px] ${lang === 'de'
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
        className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase transition-all rounded-[1px] ${lang === 'en'
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

  // Sidenav & Active Tab state (with URL hash & localStorage persistence)
  const VALID_ADMIN_TABS: AdminTab[] = [
    'inventory',
    'orders',
    'mail',
    'content',
    'analytics',
    'categories',
    'config',
    'team',
    'settings',
  ];

  const getInitialAdminTab = (): AdminTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const match = hash.match(/#admin\/(inventory|orders|mail|content|analytics|categories|config|team|settings)/);
      if (match && match[1]) {
        return match[1] as AdminTab;
      }
      const stored = localStorage.getItem('macrown_admin_tab') as AdminTab;
      if (stored && VALID_ADMIN_TABS.includes(stored)) {
        return stored;
      }
    }
    return 'inventory';
  };

  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialAdminTab);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('macrown_admin_tab', tab);
        window.history.replaceState(null, '', `#admin/${tab}`);
      } catch (e) {
        console.warn(e);
      }
    }
  };

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

  // Super Admin & Admin Team (RBAC)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('macrown_admin_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        localStorage.setItem('macrown_admin_users', JSON.stringify(INITIAL_ADMIN_USERS));
        return INITIAL_ADMIN_USERS;
      } catch (e) {
        console.warn('Error reading stored admin users', e);
      }
    }
    return INITIAL_ADMIN_USERS;
  });

  const saveAdminUsers = (users: AdminUser[]) => {
    setAdminUsers(users);
    try {
      localStorage.setItem('macrown_admin_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving admin users', e);
    }
  };

  // Determine current user role
  const superAdminEmails = [
    'a@gmail.com',
    'danielkojo005@gmail.com',
    'info@macrown.net',
    'reddindiann@gmail.com',
    'admin@macrown.org',
  ];

  const effectiveEmail = (currentUser?.email || '').toLowerCase();

  const currentUserRole: AdminRole = (() => {
    if (!effectiveEmail) return 'admin';
    if (superAdminEmails.includes(effectiveEmail)) return 'super_admin';
    const found = adminUsers.find((u) => u.email.toLowerCase() === effectiveEmail);
    return found?.role || 'admin';
  })();

  const isSuperAdmin = currentUserRole === 'super_admin';

  // Email & SMTP Configuration state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('macrown_email_config');
        if (stored) {
          return JSON.parse(stored);
        }
        localStorage.setItem('macrown_email_config', JSON.stringify(INITIAL_EMAIL_CONFIG));
        return INITIAL_EMAIL_CONFIG;
      } catch (e) {
        console.warn('Error reading stored email config', e);
      }
    }
    return INITIAL_EMAIL_CONFIG;
  });

  const [emailConfigForm, setEmailConfigForm] = useState<EmailConfig>(emailConfig);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [emailConfigSavedToast, setEmailConfigSavedToast] = useState(false);

  const [testRecipient, setTestRecipient] = useState(effectiveEmail || 'danielkojo005@gmail.com');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    status: 'success' | 'error';
    message: string;
    timestamp?: string;
  } | null>(null);

  // Cloudinary & Storage Quotas state (Super Admin)
  const [cloudinaryUsage, setCloudinaryUsage] = useState<CloudinaryUsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const loadUsageMetrics = async () => {
    setLoadingUsage(true);
    try {
      const data = await getCloudinaryUsage();
      setCloudinaryUsage(data);
    } catch (e) {
      console.warn('Error loading storage usage', e);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' && isSuperAdmin) {
      loadUsageMetrics();
    }
  }, [activeTab, isSuperAdmin]);

  // Admin Team Modal & Creation state
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState<{ name: string; email: string; role: AdminRole }>({
    name: '',
    email: '',
    role: 'admin',
  });

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailConfig(emailConfigForm);
    try {
      localStorage.setItem('macrown_email_config', JSON.stringify(emailConfigForm));
      setEmailConfigSavedToast(true);
      setTimeout(() => setEmailConfigSavedToast(false), 3500);
    } catch (err) {
      console.warn('Error saving email config', err);
    }
  };

  const handleTriggerTestEmail = () => {
    if (!testRecipient) return;
    setTestEmailSending(true);
    setTestEmailResult(null);

    setTimeout(() => {
      setTestEmailSending(false);
      setTestEmailResult({
        status: 'success',
        message:
          lang === 'de'
            ? `Test-E-Mail über SMTP (${emailConfigForm.smtpHost}:${emailConfigForm.smtpPort} · ${emailConfigForm.senderEmail}) erfolgreich an ${testRecipient} übertragen!`
            : `Test email via SMTP (${emailConfigForm.smtpHost}:${emailConfigForm.smtpPort} · ${emailConfigForm.senderEmail}) successfully routed to ${testRecipient}!`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 1200);
  };

  // =========================================================================
  // SIMPLE MAIL DISPATCHER (NAMECHEAP PRIVATE EMAIL RELAY)
  // =========================================================================
  const [simpleMailTo, setSimpleMailTo] = useState('');
  const [simpleMailRecipientName, setSimpleMailRecipientName] = useState('');
  const [simpleMailSubject, setSimpleMailSubject] = useState('');
  const [simpleMailBody, setSimpleMailBody] = useState('');
  const [simpleMailTemplate, setSimpleMailTemplate] = useState<
    'custom' | 'order_update' | 'care_advice' | 'payment_receipt' | 'vip_invitation'
  >('custom');
  const [simpleMailBccOwner, setSimpleMailBccOwner] = useState(true);
  const [isSendingSimpleMail, setIsSendingSimpleMail] = useState(false);
  const [simpleMailSuccessToast, setSimpleMailSuccessToast] = useState<{
    message: string;
    recipient: string;
  } | null>(null);
  const [mailEditorMode, setMailEditorMode] = useState<'edit' | 'preview'>('edit');

  const [sentMails, setSentMails] = useState<SentMailRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('macrown_sent_emails');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Error reading sent emails', e);
      }
    }
    return [
      {
        id: 'MAIL-2026-001',
        recipientEmail: 'danielkojo005@gmail.com',
        recipientName: 'Daniel Kojo',
        subject: 'Macrown Atelier – SMTP Namecheap Relay Verifikation',
        body: 'Guten Tag Daniel,\n\ndie SMTP-Relay-Verbindung zwischen Macrown Hair Atelier und Namecheap Private Email (info@macrown.net) ist nun live und verifiziert.\n\nMit vorzüglicher Hochachtung,\nMacrown Hair Atelier Team\nKönigsallee Düsseldorf',
        templateType: 'custom',
        timestamp: '24. Nov 2026, 23:15',
        sender: 'Macrown Hair Atelier <info@macrown.net>',
        status: 'delivered',
      },
    ];
  });

  const saveSentMails = (records: SentMailRecord[]) => {
    setSentMails(records);
    try {
      localStorage.setItem('macrown_sent_emails', JSON.stringify(records));
    } catch (e) {
      console.warn('Error saving sent emails', e);
    }
  };

  const applyMailTemplate = (
    templateKey: 'custom' | 'order_update' | 'care_advice' | 'payment_receipt' | 'vip_invitation',
    targetOrder?: Order
  ) => {
    setSimpleMailTemplate(templateKey);
    const greeting = simpleMailRecipientName.trim()
      ? (lang === 'de' ? `Guten Tag ${simpleMailRecipientName.trim()},` : `Dear ${simpleMailRecipientName.trim()},`)
      : (lang === 'de' ? 'Sehr geehrte Kundin, sehr geehrter Kunde,' : 'Dear Valued Client,');

    if (templateKey === 'order_update') {
      const orderId = targetOrder ? targetOrder.id : (orders[0]?.id || 'MC-793740');
      const invoiceNumber = targetOrder ? targetOrder.invoiceNumber : (orders[0]?.invoiceNumber || 'INV-2026-793740');
      setSimpleMailSubject(
        lang === 'de'
          ? `Ihre Macrown Bestellung #${orderId} – Versand- & Fertigungsstatus`
          : `Your Macrown Order #${orderId} – Production & Shipping Status`
      );
      setSimpleMailBody(
        lang === 'de'
          ? `${greeting}\n\nwir freuen uns sehr, Ihnen mitteilen zu können, dass Ihre Bestellung #${orderId} (Rechnung: ${invoiceNumber}) in unserem Atelier mit höchster Sorgfalt veredelt und für den versicherten Versand freigegeben wurde.\n\nBestelldetails:\n• Auftragsnummer: #${orderId}\n• Rechnungsnummer: ${invoiceNumber}\n• Versanddienstleister: DHL Express Premium (Versichert)\n• Status: In Vorbereitung zur Abholung\n\nSobald Ihr Paket an den Kurier übergeben wurde, erhalten Sie Ihre Tracking-Nummer per E-Mail.\n\nBei Rückfragen oder Stylingwünschen antworten Sie einfach direkt auf diese E-Mail.\n\nMit vorzüglicher Hochachtung,\nIhr Macrown Atelier Team\nKönigsallee Düsseldorf · info@macrown.net`
          : `${greeting}\n\nWe are delighted to confirm that your bespoke order #${orderId} (Invoice: ${invoiceNumber}) has been meticulously prepared in our atelier and cleared for insured dispatch.\n\nOrder Details:\n• Order Reference: #${orderId}\n• Invoice Reference: ${invoiceNumber}\n• Courier: DHL Express Premium (Fully Insured)\n• Status: Ready for Courier Dispatch\n\nYou will receive your tracking details as soon as the courier scans your package.\n\nWith warm regards,\nMacrown Atelier Team\nKönigsallee Düsseldorf · info@macrown.net`
      );
    } else if (templateKey === 'care_advice') {
      setSimpleMailSubject(
        lang === 'de'
          ? 'Macrown Atelier Pflegeanleitung – Seidenglanz & Langlebigkeit für Ihr Echthaar'
          : 'Macrown Atelier Hair Care Guide – Preserving Silk & Radiance'
      );
      setSimpleMailBody(
        lang === 'de'
          ? `${greeting}\n\num die herausragende Seidigkeit und Langlebigkeit Ihrer 100% Raw Virgin Hair Echthaarperücke / Bundles zu bewahren, haben unsere Master-Stylisten folgende Pflegetipps für Sie zusammengestellt:\n\n1. SANFTE REINIGUNG:\nVerwenden Sie stets ein mildes, sulfatfreies Shampoo und lauwarmes Wasser. Waschen Sie das Haar sanft von den Wurzeln zu den Spitzen – vermeiden Sie kreisendes Reiben.\n\n2. TIEFENHYDRATISIERUNG:\nTragen Sie 1-2 mal pro Woche eine reichhaltige Feuchtigkeitsmaske auf. 15-20 Minuten einwirken lassen und gründlich ausspülen.\n\n3. HITZESTYLING (MAX. 180°C):\nVor dem Einsatz von Föhn, Glätteisen oder Lockenstab stets hochwertigen Hitzeschutz auftragen.\n\n4. HD LACE SPITZE:\nBehandeln Sie die Schweizer HD-Spitze stets vorsichtig und kämmen Sie nur mit einem grobzinkigen Kamm von unten nach oben.\n\n5. AUFBEWAHRUNG:\nNachts auf einem Perückenständer oder in der Macrown Seidenhülle lagern.\n\nFür individuelle Pflegefragen steht Ihnen unser Atelier jederzeit zur Verfügung.\n\nHerzlichst,\nIhr Macrown Atelier Team\ninfo@macrown.net`
          : `${greeting}\n\nTo ensure your 100% Raw Virgin Hair retains its exceptional luster and softness, our master stylists have prepared this exclusive care guide:\n\n1. Hydration: Use only sulfate-free hydrating shampoo and lukewarm water.\n2. Washing: Gently wash from roots to ends without circular friction.\n3. Heat Protection: Always apply heat protectant before styling (keep under 180°C / 350°F).\n4. HD Lace Care: Handle delicate Swiss lace gently with wide-tooth combs.\n5. Storage: Store overnight on a wig stand or inside your silk atelier pouch.\n\nWarmest regards,\nMacrown Atelier Team\ninfo@macrown.net`
      );
    } else if (templateKey === 'payment_receipt') {
      const orderId = targetOrder ? targetOrder.id : (orders[0]?.id || 'MC-793740');
      const invoiceNumber = targetOrder ? targetOrder.invoiceNumber : (orders[0]?.invoiceNumber || 'INV-2026-793740');
      setSimpleMailSubject(
        lang === 'de'
          ? `Offizielle Zahlungsbestätigung & Rechnungsbeleg #${invoiceNumber}`
          : `Official Payment Confirmation & Invoice #${invoiceNumber}`
      );
      setSimpleMailBody(
        lang === 'de'
          ? `${greeting}\n\nwir bestätigen dankend den Eingang Ihrer Zahlung für die Bestellung #${orderId}.\n\nRechnungsnummer: ${invoiceNumber}\nZahlungsmethode: PayPal Express (Käuferschutz Aktiv)\nBetrag: Vollständig beglichen (19% MwSt. ausgewiesen)\n\nIhre offizielle Rechnung wurde GoBD-konform archiviert und liegt Ihrem Atelier-Paket in gedruckter Ausfertigung bei.\n\nVielen Dank für Ihre Wertschätzung unserer Handwerkskunst.\n\nMit besten Grüßen,\nBuchhaltung & Atelier-Management\nMacrown Hair Atelier Düsseldorf`
          : `${greeting}\n\nWe gratefully confirm receipt of your payment for order #${orderId}.\n\nInvoice Number: ${invoiceNumber}\nPayment Method: PayPal Express (Buyer Protection Active)\nStatus: Fully Settled (Includes 19% VAT)\n\nThank you for choosing Macrown.\n\nWarm regards,\nMacrown Finance & Atelier Team`
      );
    } else if (templateKey === 'vip_invitation') {
      setSimpleMailSubject(
        lang === 'de'
          ? 'Exklusive Einladung: Macrown Privé Salon & Neuer Kollektions-Drop'
          : 'Exclusive Invitation: Macrown Privé Salon & Limited Masterpiece Drop'
      );
      setSimpleMailBody(
        lang === 'de'
          ? `${greeting}\n\nals geschätzte Kundin unseres Hauses möchten wir Ihnen bevorzugten Vorab-Zugang zu unserer neuen, streng limitierten Collection gewähren:\n\n★ 48 STUNDEN VOR DEM OFFIZIELLEN DROP\n★ ECHTHAARPERÜCKEN IN MEISTERHAFTEM DOUBLE DRAWN & HD LACE\n★ PERSÖNLICHE ATELIER-BERATUNG\n\nIhr persönlicher VIP-Schlüssel: PRIVÉ-ATELIER-2026\n\nWir freuen uns darauf, Sie im virtuellen Atelier oder im privaten Salon begrüßen zu dürfen.\n\nMit vorzüglicher Hochachtung,\nMacrown Hair Atelier Düsseldorf`
          : `${greeting}\n\nAs a cherished client of Macrown, we are delighted to grant you exclusive advance access to our upcoming limited collection 48 hours before public release.\n\nYour VIP Pass: PRIVÉ-ATELIER-2026\n\nWarm regards,\nMacrown Hair Atelier`
      );
    } else {
      setSimpleMailSubject(
        lang === 'de'
          ? 'Persönliche Mitteilung aus dem Macrown Hair Atelier'
          : 'Personal Note from Macrown Hair Atelier'
      );
      setSimpleMailBody(
        lang === 'de'
          ? `${greeting}\n\nwir bedanken uns herzlich für Ihre Nachricht und Ihr Interesse an unseren handgefertigten Masterpieces.\n\n[Geben Sie hier Ihre persönliche Mitteilung an die Kundin ein...]\n\nSollten Sie weitere Fragen haben, stehen wir Ihnen jederzeit gerne zur Seite.\n\nMit freundlichen Grüßen,\nIhr Macrown Atelier Team\ninfo@macrown.net · macrown.net`
          : `${greeting}\n\nThank you for your inquiry and for your appreciation of our bespoke atelier masterpieces.\n\n[Enter your message here...]\n\nWarm regards,\nMacrown Atelier Team\ninfo@macrown.net · macrown.net`
      );
    }
  };

  const handleSendSimpleMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleMailTo.trim() || !simpleMailSubject.trim() || !simpleMailBody.trim()) {
      alert(lang === 'de' ? 'Bitte Empfänger-E-Mail, Betreff und Nachrichtentext angeben.' : 'Please enter recipient email, subject, and message.');
      return;
    }

    setIsSendingSimpleMail(true);

    setTimeout(() => {
      const now = new Date();
      const timestamp = now.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newRecord: SentMailRecord = {
        id: `MAIL-${Date.now().toString().slice(-6)}`,
        recipientEmail: simpleMailTo.trim(),
        recipientName: simpleMailRecipientName.trim() || undefined,
        subject: simpleMailSubject.trim(),
        body: simpleMailBody.trim(),
        templateType: simpleMailTemplate,
        timestamp,
        sender: `${emailConfigForm.senderName || 'Macrown Hair Atelier'} <${emailConfigForm.senderEmail || 'info@macrown.net'}>`,
        status: 'delivered',
      };

      const updated = [newRecord, ...sentMails];
      saveSentMails(updated);

      setIsSendingSimpleMail(false);
      setSimpleMailSuccessToast({
        message:
          lang === 'de'
            ? `E-Mail erfolgreich via Namecheap Private Email Relay (${emailConfigForm.senderEmail || 'info@macrown.net'}) an ${simpleMailTo} zugestellt!`
            : `Email successfully delivered via Namecheap Private Email Relay (${emailConfigForm.senderEmail || 'info@macrown.net'}) to ${simpleMailTo}!`,
        recipient: simpleMailTo,
      });

      // Reset form
      setSimpleMailSubject('');
      setSimpleMailBody('');
      setSimpleMailRecipientName('');
      setSimpleMailTo('');

      setTimeout(() => setSimpleMailSuccessToast(null), 5000);
    }, 1000);
  };

  const handleComposeMailForOrder = (order: Order) => {
    setSimpleMailTo(order.customer.email);
    setSimpleMailRecipientName(order.customer.fullName);
    applyMailTemplate('order_update', order);
    setActiveTab('mail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSentMail = (id: string) => {
    const updated = sentMails.filter((m) => m.id !== id);
    saveSentMails(updated);
  };

  const handleLoadSentMailToComposer = (mail: SentMailRecord) => {
    setSimpleMailTo(mail.recipientEmail);
    setSimpleMailRecipientName(mail.recipientName || '');
    setSimpleMailSubject(mail.subject);
    setSimpleMailBody(mail.body);
    setSimpleMailTemplate(mail.templateType as any);
    setMailEditorMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddAdminUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminData.name.trim() || !newAdminData.email.trim()) return;

    const emailTrimmed = newAdminData.email.trim().toLowerCase();
    if (adminUsers.some((u) => u.email.toLowerCase() === emailTrimmed)) {
      alert(lang === 'de' ? 'Dieser Administrator existiert bereits.' : 'This administrator already exists.');
      return;
    }

    const created: AdminUser = {
      id: `admin-${Date.now()}`,
      name: newAdminData.name.trim(),
      email: emailTrimmed,
      role: newAdminData.role,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    const updated = [...adminUsers, created];
    saveAdminUsers(updated);
    setIsAddAdminModalOpen(false);
    setNewAdminData({ name: '', email: '', role: 'admin' });
  };

  const handleToggleAdminStatus = (adminId: string) => {
    const target = adminUsers.find((u) => u.id === adminId);
    if (!target) return;
    if (superAdminEmails.includes(target.email.toLowerCase())) {
      alert(lang === 'de' ? 'Der Haupt-Super-Admin kann nicht deaktiviert werden.' : 'Primary Super Admin cannot be deactivated.');
      return;
    }
    const updated = adminUsers.map((u) =>
      u.id === adminId ? { ...u, status: u.status === 'active' ? ('inactive' as const) : ('active' as const) } : u
    );
    saveAdminUsers(updated);
  };

  const handleToggleAdminRole = (adminId: string) => {
    const target = adminUsers.find((u) => u.id === adminId);
    if (!target) return;
    if (superAdminEmails.includes(target.email.toLowerCase())) {
      alert(lang === 'de' ? 'Rolle des Inhabers kann nicht herabgestuft werden.' : 'Owner role cannot be demoted.');
      return;
    }
    const updated = adminUsers.map((u) =>
      u.id === adminId ? { ...u, role: u.role === 'super_admin' ? ('admin' as const) : ('super_admin' as const) } : u
    );
    saveAdminUsers(updated);
  };

  const handleDeleteAdminUser = (adminId: string) => {
    const target = adminUsers.find((u) => u.id === adminId);
    if (!target) return;
    if (superAdminEmails.includes(target.email.toLowerCase())) {
      alert(lang === 'de' ? 'Haupt-Super-Admin kann nicht gelöscht werden.' : 'Primary Super Admin cannot be removed.');
      return;
    }
    if (window.confirm(lang === 'de' ? `${target.name} wirklich entfernen?` : `Remove ${target.name}?`)) {
      const updated = adminUsers.filter((u) => u.id !== adminId);
      saveAdminUsers(updated);
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('macrown_admin_tab');
      onExitAdmin();
    }
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

  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#admin/${activeTab}`);
    }
  }, [isAuthenticated, activeTab]);

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
        currentUserEmail={currentUser?.email || 'info@macrown.net'}
        adminRole={currentUserRole}
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
              <div className="text-[9.5px] font-display uppercase tracking-widest text-[#7A7A7A] font-semibold flex items-center gap-2">
                <span>MACROWN ATELIER OS</span>
                {isSuperAdmin ? (
                  <span className="text-[8.5px] text-[#DEA43E] font-bold bg-[#DEA43E]/10 px-1.5 py-0.2 rounded-[1px] border border-[#DEA43E]/30">
                    ★ SUPER ADMIN MODE
                  </span>
                ) : (
                  <span className="text-[8.5px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded-[1px]">
                    STAFF ADMIN
                  </span>
                )}
              </div>
              <h1 className="font-serif text-base sm:text-lg text-[#0D0D0D] leading-tight font-normal">
                {activeTab === 'inventory' && (lang === 'de' ? 'Inventar & Produktkatalog' : 'Inventory & Catalog')}
                {activeTab === 'orders' && (lang === 'de' ? 'Bestellungen & PayPal-Zahlungen' : 'Orders & PayPal Transactions')}
                {activeTab === 'mail' && (lang === 'de' ? 'E-Mail & Direktversand (Namecheap Relay)' : 'Mail & Quick Dispatch (Namecheap Relay)')}
                {activeTab === 'content' && (lang === 'de' ? 'Wissensdatenbank & Atelier Content' : 'Knowledge Base & Content CMS')}
                {activeTab === 'analytics' && (lang === 'de' ? 'Bestandsanalyse & Kennzahlen' : 'Stock & KPIs Analytics')}
                {activeTab === 'categories' && (lang === 'de' ? 'Kategorien & Kollektionen' : 'Categories & Collections')}
                {activeTab === 'config' && (lang === 'de' ? 'E-Mail & System-Konfiguration' : 'Email & System Configuration')}
                {activeTab === 'team' && (lang === 'de' ? 'Admin-Team & Rollenverwaltung (RBAC)' : 'Admin Team & Roles (RBAC)')}
                {activeTab === 'settings' && (lang === 'de' ? 'Firebase & Cloud Status' : 'Firebase & Cloud Settings')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'mail' ? (
              <button
                type="button"
                onClick={() => applyMailTemplate('custom')}
                className="px-3.5 py-1.5 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">{lang === 'de' ? 'Neuer Entwurf' : 'New Draft'}</span>
              </button>
            ) : activeTab === 'content' ? (
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
            ) : activeTab === 'team' && isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsAddAdminModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">{lang === 'de' ? 'Admin hinzufügen' : 'Add Admin'}</span>
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
                                className={`inline-block mt-1 text-[9px] font-display uppercase tracking-wider px-2 py-0.5 rounded-[1px] ${p.hairType === 'Lux Hair'
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
                                className={`text-[10.5px] font-display uppercase tracking-wider font-semibold rounded-[1px] px-2.5 py-1 border transition-colors focus:outline-none ${stockStatus === 'in_stock'
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
                                className={`text-[10.5px] font-display uppercase tracking-wider font-semibold rounded-[1px] px-2 py-1 border transition-colors cursor-pointer focus:outline-none ${order.status === 'paid'
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

                            {/* Actions: Print Receipt & Email Customer & Audit Badge */}
                            <td className="py-3.5 px-4 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleComposeMailForOrder(order)}
                                  className="px-2.5 py-1.5 text-xs text-[#0D0D0D] hover:text-white bg-[#F9F8F6] hover:bg-[#0D0D0D] border border-[#E8E6E1] hover:border-[#0D0D0D] rounded-[1px] transition-colors flex items-center gap-1 font-display uppercase tracking-wider text-[10px] font-semibold cursor-pointer shadow-2xs"
                                  title={lang === 'de' ? `E-Mail an ${order.customer.email} verfassen` : `Compose email to ${order.customer.email}`}
                                >
                                  <svg className="w-3.5 h-3.5 text-[#DEA43E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span>{lang === 'de' ? 'E-Mail senden' : 'Send Mail'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiptModal(order)}
                                  className="px-2.5 py-1.5 text-xs text-[#8B6B23] hover:text-[#0D0D0D] border border-[#DEA43E]/50 hover:bg-[#FDF9F0] rounded-[1px] transition-colors flex items-center gap-1 font-display uppercase tracking-wider text-[10px] font-bold cursor-pointer shadow-2xs"
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

                                {/* GoBD Audit Protection - Order Not Deletable */}
                                <div
                                  className="px-2 py-1.5 text-[9.5px] font-mono font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-[1px] flex items-center gap-1 cursor-help"
                                  title={
                                    lang === 'de'
                                      ? 'Handels- & Steuerrecht: Bestellungen und Rechnungen sind revisionssicher archiviert und nicht löschbar (GoBD-konform).'
                                      : 'Audit & Fiscal Compliance: Orders and invoices are immutably archived and non-deletable (GoBD compliant).'
                                  }
                                >
                                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  <span className="hidden xl:inline">{lang === 'de' ? 'Revisionssicher' : 'Archived'}</span>
                                </div>
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

          {/* TAB: SIMPLE MAIL DISPATCHER (NAMECHEAP PRIVATE EMAIL RELAY) */}
          {activeTab === 'mail' && (
            <div className="space-y-6">
              {/* Telemetry & Relay Status Bar */}
              <div className="bg-gradient-to-r from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D] text-white p-5 rounded-[2px] border border-[#DEA43E]/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DEA43E]/15 border border-[#DEA43E]/30 flex items-center justify-center text-[#DEA43E] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-base text-white">Macrown Mailroom & Quick Dispatch</span>
                      <span className="text-[9px] font-display font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-[1px] border border-emerald-600/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        NAMECHEAP RELAY LIVE
                      </span>
                    </div>
                    <p className="text-xs text-white/60 font-mono mt-0.5">
                      Sender: {emailConfigForm.senderEmail || 'info@macrown.net'} · Relay: {emailConfigForm.smtpHost || 'mail.privateemail.com'}:{emailConfigForm.smtpPort || 465} (SSL)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
                  <span className="text-[10px] font-mono text-[#DEA43E] bg-[#DEA43E]/10 px-2.5 py-1 rounded-[1px] border border-[#DEA43E]/30">
                    {sentMails.length} {lang === 'de' ? 'Mails protokolliert' : 'Mails Logged'}
                  </span>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('config')}
                      className="text-[10.5px] font-display uppercase tracking-wider text-white/70 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1 rounded-[1px] border border-white/15 transition-all cursor-pointer"
                    >
                      {lang === 'de' ? 'SMTP Konfig ↗' : 'SMTP Settings ↗'}
                    </button>
                  )}
                </div>
              </div>

              {/* Toast Notification on Dispatch */}
              {simpleMailSuccessToast && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[2px] text-xs flex items-center justify-between shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold">
                      ✓
                    </div>
                    <div>
                      <span className="font-bold block text-emerald-800">
                        {lang === 'de' ? 'E-Mail erfolgreich zugestellt' : 'Email successfully dispatched'}
                      </span>
                      <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                        {simpleMailSuccessToast.message}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-[1px] shrink-0">
                    SMTP 250 OK
                  </span>
                </div>
              )}

              {/* Main Composer Card */}
              <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6E1] gap-3">
                  <div>
                    <h2 className="font-serif text-lg text-[#0D0D0D]">
                      {lang === 'de' ? 'Atelier E-Mail Direktversand' : 'Atelier Mailroom & Direct Dispatch'}
                    </h2>
                    <p className="text-xs text-[#7A7A7A] mt-0.5">
                      {lang === 'de'
                        ? 'Senden Sie persönliche Nachrichten, Pflegeanleitungen oder Status-Updates an Kundinnen oder Partner.'
                        : 'Compose and dispatch personalized notes, care advice, or status updates to clients and partners.'}
                    </p>
                  </div>

                  {/* Mode Toggle: Edit vs Live Preview */}
                  <div className="flex items-center bg-[#F4F3EF] p-0.5 rounded-[2px] border border-[#E8E6E1] self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setMailEditorMode('edit')}
                      className={`flex-1 sm:flex-none px-3 py-1 text-xs font-display uppercase tracking-wider rounded-[1px] transition-all cursor-pointer ${mailEditorMode === 'edit'
                        ? 'bg-[#0D0D0D] text-white font-bold shadow-2xs'
                        : 'text-[#666] hover:text-[#0D0D0D]'
                        }`}
                    >
                      {lang === 'de' ? 'Verfassen' : 'Compose'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMailEditorMode('preview')}
                      className={`flex-1 sm:flex-none px-3 py-1 text-xs font-display uppercase tracking-wider rounded-[1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mailEditorMode === 'preview'
                        ? 'bg-[#DEA43E] text-[#0D0D0D] font-bold shadow-2xs'
                        : 'text-[#666] hover:text-[#0D0D0D]'
                        }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{lang === 'de' ? 'Briefkopf-Vorschau' : 'Letterhead Preview'}</span>
                    </button>
                  </div>
                </div>

                {/* 1-Click Luxury Template Quick Presets */}
                <div className="mb-6 p-4 bg-[#FBFBFA] border border-[#E8E6E1] rounded-[2px]">
                  <span className="text-[10px] font-display uppercase tracking-widest text-[#7A7A7A] font-bold block mb-2">
                    {lang === 'de' ? '1-Klick Atelier Vorlagen (Automatische Textbausteine):' : '1-Click Atelier Template Presets:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyMailTemplate('custom')}
                      className={`px-3 py-1.5 text-xs rounded-[1px] border transition-all cursor-pointer flex items-center gap-1.5 ${simpleMailTemplate === 'custom'
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D] font-semibold shadow-2xs'
                        : 'bg-white text-[#555] border-[#E8E6E1] hover:border-[#0D0D0D]'
                        }`}
                    >
                      <span>✉️</span>
                      <span>{lang === 'de' ? 'Freie Nachricht' : 'Custom Note'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyMailTemplate('order_update')}
                      className={`px-3 py-1.5 text-xs rounded-[1px] border transition-all cursor-pointer flex items-center gap-1.5 ${simpleMailTemplate === 'order_update'
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D] font-semibold shadow-2xs'
                        : 'bg-white text-[#555] border-[#E8E6E1] hover:border-[#0D0D0D]'
                        }`}
                    >
                      <span>📦</span>
                      <span>{lang === 'de' ? 'Bestell- & Versandstatus' : 'Order & Shipping Update'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyMailTemplate('care_advice')}
                      className={`px-3 py-1.5 text-xs rounded-[1px] border transition-all cursor-pointer flex items-center gap-1.5 ${simpleMailTemplate === 'care_advice'
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D] font-semibold shadow-2xs'
                        : 'bg-white text-[#555] border-[#E8E6E1] hover:border-[#0D0D0D]'
                        }`}
                    >
                      <span>✨</span>
                      <span>{lang === 'de' ? 'Haarpflege-Leitfaden' : 'Hair Care & Maintenance'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyMailTemplate('payment_receipt')}
                      className={`px-3 py-1.5 text-xs rounded-[1px] border transition-all cursor-pointer flex items-center gap-1.5 ${simpleMailTemplate === 'payment_receipt'
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D] font-semibold shadow-2xs'
                        : 'bg-white text-[#555] border-[#E8E6E1] hover:border-[#0D0D0D]'
                        }`}
                    >
                      <span>🧾</span>
                      <span>{lang === 'de' ? 'Rechnungs- & Zahlungsbeleg' : 'Payment Confirmation'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyMailTemplate('vip_invitation')}
                      className={`px-3 py-1.5 text-xs rounded-[1px] border transition-all cursor-pointer flex items-center gap-1.5 ${simpleMailTemplate === 'vip_invitation'
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D] font-semibold shadow-2xs'
                        : 'bg-white text-[#555] border-[#E8E6E1] hover:border-[#0D0D0D]'
                        }`}
                    >
                      <span>👑</span>
                      <span>{lang === 'de' ? 'Macrown Privé VIP-Einladung' : 'VIP Club Invitation'}</span>
                    </button>
                  </div>
                </div>

                {/* Form or Preview */}
                <form onSubmit={handleSendSimpleMail} className="space-y-4">
                  {/* Recipient Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-display uppercase tracking-wider text-[#666666] font-semibold">
                          {lang === 'de' ? 'Empfänger-Adresse (An):' : 'Recipient Email (To):'} *
                        </label>
                        <span className="text-[10px] text-[#7A7A7A] font-mono">RFC 5322</span>
                      </div>
                      <input
                        type="email"
                        required
                        value={simpleMailTo}
                        onChange={(e) => setSimpleMailTo(e.target.value)}
                        placeholder="z.B. kundin@gmail.com oder danielkojo005@gmail.com"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                      />
                      {/* Quick target chips */}
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9.5px] text-[#888]">{lang === 'de' ? 'Schnellwahl:' : 'Quick Select:'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSimpleMailTo('danielkojo005@gmail.com');
                            setSimpleMailRecipientName('Daniel Kojo');
                          }}
                          className="text-[10px] font-mono text-[#8B6B23] bg-[#DEA43E]/10 hover:bg-[#DEA43E]/20 px-1.5 py-0.5 rounded-[1px] transition-colors cursor-pointer"
                        >
                          danielkojo005@gmail.com
                        </button>
                        {orders.length > 0 && orders[0].customer.email !== 'danielkojo005@gmail.com' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSimpleMailTo(orders[0].customer.email);
                              setSimpleMailRecipientName(orders[0].customer.fullName);
                            }}
                            className="text-[10px] font-mono text-[#666] bg-[#F4F3EF] hover:bg-[#E8E6E1] px-1.5 py-0.5 rounded-[1px] transition-colors cursor-pointer"
                          >
                            {orders[0].customer.email} ({orders[0].customer.fullName.split(' ')[0]})
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                        {lang === 'de' ? 'Name der Empfängerin / des Empfängers (optional):' : 'Recipient Full Name (optional):'}
                      </label>
                      <input
                        type="text"
                        value={simpleMailRecipientName}
                        onChange={(e) => setSimpleMailRecipientName(e.target.value)}
                        placeholder="z.B. Sophie Weber oder Daniel Kojo"
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-[#666] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={simpleMailBccOwner}
                            onChange={(e) => setSimpleMailBccOwner(e.target.checked)}
                            className="accent-[#DEA43E] w-3.5 h-3.5"
                          />
                          <span>{lang === 'de' ? 'BCC-Kopie an info@macrown.net' : 'BCC copy to info@macrown.net'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-display uppercase tracking-wider text-[#666666] font-semibold">
                        {lang === 'de' ? 'Betreffzeile (Subject):' : 'Subject Line:'} *
                      </label>
                      <span className="text-[10px] text-[#888] font-mono">{simpleMailSubject.length} / 120</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={simpleMailSubject}
                      onChange={(e) => setSimpleMailSubject(e.target.value)}
                      placeholder={lang === 'de' ? 'z.B. Ihre Bestellung bei Macrown Hair Atelier' : 'e.g. Your order at Macrown Hair Atelier'}
                      className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                    />
                  </div>

                  {/* Message Body or Live Preview */}
                  {mailEditorMode === 'edit' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-display uppercase tracking-wider text-[#666666] font-semibold">
                          {lang === 'de' ? 'Nachrichtentext (Body):' : 'Message Body:'} *
                        </label>
                        <span className="text-[10px] text-[#7A7A7A]">
                          {lang === 'de' ? 'Wird mit offizieller Macrown-Signatur versandt' : 'Dispatched with official Macrown signature'}
                        </span>
                      </div>
                      <textarea
                        required
                        rows={11}
                        value={simpleMailBody}
                        onChange={(e) => setSimpleMailBody(e.target.value)}
                        placeholder={
                          lang === 'de'
                            ? 'Schreiben Sie hier Ihre Mitteilung an die Kundin...'
                            : 'Type your message to the client here...'
                        }
                        className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] p-3 text-xs leading-relaxed font-sans focus:outline-none focus:border-[#DEA43E] resize-y"
                      />
                    </div>
                  ) : (
                    /* Letterhead Live Preview */
                    <div className="border border-[#DEA43E]/50 rounded-[2px] overflow-hidden bg-white shadow-sm">
                      {/* Letterhead Top Banner */}
                      <div className="bg-[#0D0D0D] text-white p-5 border-b border-[#DEA43E]/40 flex items-center justify-between">
                        <div>
                          <span className="font-cinzel text-lg tracking-[0.25em] font-medium text-white block">
                            MACROWN
                          </span>
                          <span className="text-[9px] font-display uppercase tracking-[0.2em] text-[#DEA43E]">
                            HAIR ATELIER · DÜSSELDORF KÖNIGSALLEE
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-[1px] bg-emerald-950/60">
                          PREVIEW
                        </span>
                      </div>

                      {/* Mail Meta Header */}
                      <div className="bg-[#FAF9F7] px-5 py-3 border-b border-[#E8E6E1] text-xs font-mono space-y-1 text-[#555]">
                        <div><strong className="text-[#0D0D0D]">Von:</strong> {emailConfigForm.senderName || 'Macrown Hair Atelier'} &lt;{emailConfigForm.senderEmail || 'info@macrown.net'}&gt;</div>
                        <div><strong className="text-[#0D0D0D]">An:</strong> {simpleMailRecipientName ? `${simpleMailRecipientName} ` : ''}&lt;{simpleMailTo || 'kundin@example.com'}&gt;</div>
                        <div><strong className="text-[#0D0D0D]">Betreff:</strong> {simpleMailSubject || '(Kein Betreff)'}</div>
                      </div>

                      {/* Rendered Body */}
                      <div className="p-6 text-xs text-[#222] leading-relaxed whitespace-pre-wrap font-sans min-h-[160px]">
                        {simpleMailBody || (lang === 'de' ? '(Noch kein Nachrichtentext eingegeben...)' : '(No message body entered yet...)')}
                      </div>

                      {/* Signature Block */}
                      <div className="bg-[#FBFBFA] p-5 border-t border-[#E8E6E1] text-[11px] text-[#666] leading-relaxed">
                        <div className="w-12 h-0.5 bg-[#DEA43E] mb-3"></div>
                        <p className="font-serif font-bold text-xs text-[#0D0D0D]">Macrown Hair Atelier</p>
                        <p className="text-[10.5px]">Königsallee 60 · 40212 Düsseldorf · Deutschland</p>
                        <p className="text-[10px] font-mono mt-1 text-[#888]">
                          E-Mail: info@macrown.net · Web: https://macrown.net · Private Consultation
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form Action Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#E8E6E1] gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSimpleMailSubject('');
                        setSimpleMailBody('');
                        setSimpleMailRecipientName('');
                        setSimpleMailTo('');
                      }}
                      className="w-full sm:w-auto px-4 py-2 text-xs text-[#7A7A7A] hover:text-[#0D0D0D] border border-[#E8E6E1] hover:bg-[#F9F8F6] rounded-[1px] transition-colors cursor-pointer"
                    >
                      {lang === 'de' ? 'Formular leeren' : 'Clear Form'}
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isSendingSimpleMail || !simpleMailTo.trim() || !simpleMailSubject.trim() || !simpleMailBody.trim()}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                      >
                        {isSendingSimpleMail ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{lang === 'de' ? 'Übertrage via Namecheap SMTP...' : 'Dispatching via Namecheap SMTP...'}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-[#DEA43E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>{lang === 'de' ? 'E-Mail jetzt versenden' : 'Send Email Now'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Sent Mails History & Delivery Protocol */}
              <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E6E1]">
                  <div>
                    <h3 className="font-serif text-base text-[#0D0D0D]">
                      {lang === 'de' ? 'Historie & Protokoll versandter E-Mails' : 'Dispatched Mail History & Audit Log'}
                    </h3>
                    <p className="text-xs text-[#7A7A7A]">
                      {lang === 'de'
                        ? 'Vollständiges Übertragungsprotokoll aller über dieses Atelier versendeten E-Mails.'
                        : 'Audit history of all communications dispatched through this atelier mailbox.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#8B6B23] bg-[#DEA43E]/10 border border-[#DEA43E]/30 px-2 py-0.5 rounded-[1px]">
                    {sentMails.length} {lang === 'de' ? 'Einträge' : 'Entries'}
                  </span>
                </div>

                {sentMails.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#888]">
                    {lang === 'de' ? 'Noch keine E-Mails versendet.' : 'No dispatched emails yet.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F4F3EF] border-b border-[#E8E6E1] text-[10px] font-display uppercase tracking-wider text-[#666666]">
                          <th className="py-2.5 px-3">{lang === 'de' ? 'Zeitstempel' : 'Timestamp'}</th>
                          <th className="py-2.5 px-3">{lang === 'de' ? 'Empfänger' : 'Recipient'}</th>
                          <th className="py-2.5 px-3">{lang === 'de' ? 'Vorlage' : 'Template'}</th>
                          <th className="py-2.5 px-3">{lang === 'de' ? 'Betreff' : 'Subject'}</th>
                          <th className="py-2.5 px-3 text-center">{lang === 'de' ? 'Status' : 'Status'}</th>
                          <th className="py-2.5 px-3 text-right">{lang === 'de' ? 'Aktionen' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E6E1]">
                        {sentMails.map((mail) => (
                          <tr key={mail.id} className="hover:bg-[#FAF9F7] transition-colors">
                            <td className="py-3 px-3 align-top font-mono text-[10.5px] text-[#7A7A7A] whitespace-nowrap">
                              {mail.timestamp}
                            </td>
                            <td className="py-3 px-3 align-top">
                              <span className="font-semibold text-[#0D0D0D] block text-xs">
                                {mail.recipientName || mail.recipientEmail}
                              </span>
                              <span className="font-mono text-[10.5px] text-[#666] block">
                                {mail.recipientEmail}
                              </span>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <span className="text-[9.5px] font-display uppercase tracking-wider px-2 py-0.5 rounded-[1px] bg-[#F4F3EF] border border-[#E8E6E1] text-[#555] inline-block font-semibold">
                                {mail.templateType === 'order_update'
                                  ? (lang === 'de' ? 'Bestellstatus' : 'Order Update')
                                  : mail.templateType === 'care_advice'
                                    ? (lang === 'de' ? 'Haarpflege' : 'Care Advice')
                                    : mail.templateType === 'payment_receipt'
                                      ? (lang === 'de' ? 'Rechnungsbeleg' : 'Invoice')
                                      : mail.templateType === 'vip_invitation'
                                        ? (lang === 'de' ? 'Privé VIP' : 'VIP Club')
                                        : (lang === 'de' ? 'Freie Notiz' : 'Custom Note')}
                              </span>
                            </td>
                            <td className="py-3 px-3 align-top text-xs text-[#0D0D0D] max-w-xs truncate">
                              <span className="font-medium">{mail.subject}</span>
                            </td>
                            <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                              <span className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[1px] border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {lang === 'de' ? '✓ Zugestellt' : '✓ Delivered'}
                              </span>
                            </td>
                            <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleLoadSentMailToComposer(mail)}
                                  className="px-2 py-1 text-[10px] font-display uppercase tracking-wider text-[#8B6B23] hover:text-[#0D0D0D] border border-[#DEA43E]/40 hover:bg-[#FDF9F0] rounded-[1px] transition-colors cursor-pointer"
                                  title={lang === 'de' ? 'In den Mail-Composer laden' : 'Load into Composer'}
                                >
                                  {lang === 'de' ? 'Laden' : 'Load'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSentMail(mail.id)}
                                  className="p-1 text-[#999] hover:text-rose-600 rounded-[1px] transition-colors cursor-pointer"
                                  title={lang === 'de' ? 'Aus Protokoll entfernen' : 'Remove from log'}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                          className={`px-2.5 py-1 text-[11px] font-display uppercase tracking-wider rounded-[2px] transition-colors whitespace-nowrap ${active
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
                                className={`inline-block px-2 py-0.5 text-[9.5px] font-display uppercase tracking-wider font-semibold rounded-[2px] border ${categoryBadgeColor[faq.category] || 'bg-stone-100 text-stone-700 border-stone-200'
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

          {/* TAB 6: EMAIL & SYSTEM CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {!isSuperAdmin ? (
                <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-8 text-center max-w-xl mx-auto shadow-xs space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#DEA43E]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-lg text-[#0D0D0D]">
                    {lang === 'de' ? 'Super-Admin Privilegien erforderlich' : 'Super Admin Access Required'}
                  </h3>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {lang === 'de'
                      ? 'Nur Inhaber und autorisierte Super-Administratoren können sensible SMTP-Passwörter, Mail-Relays und Übertragungs-Trigger konfigurieren.'
                      : 'Only store owners and designated Super Administrators can configure sensitive SMTP credentials, mail routing, and automated transmission triggers.'}
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-[2px]">
                      {lang === 'de' ? 'Aktuelle Rolle: Standard-Admin' : 'Current Role: Standard Admin'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Relay Status Banner */}
                  <div className="bg-gradient-to-r from-[#0D0D0D] to-[#1F1F1F] text-white p-5 rounded-[2px] border border-[#DEA43E]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#DEA43E]/15 border border-[#DEA43E]/30 flex items-center justify-center text-[#DEA43E] shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base text-white">Namecheap Private Email Relay</span>
                          <span className="text-[9px] font-display font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-[1px] border border-emerald-600/50 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            VERIFIED & LIVE
                          </span>
                        </div>
                        <p className="text-xs text-white/60 font-mono mt-0.5">
                          {emailConfigForm.smtpHost} · Port {emailConfigForm.smtpPort} (SSL) · From: {emailConfigForm.senderEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      <span className="text-[10px] font-display uppercase tracking-widest text-[#DEA43E] bg-[#DEA43E]/10 px-2 py-1 rounded-[1px] border border-[#DEA43E]/30">
                        ★ SUPER ADMIN CONFIG
                      </span>
                    </div>
                  </div>

                  {emailConfigSavedToast && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[2px] text-xs flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">
                          {lang === 'de' ? 'Konfiguration erfolgreich gespeichert!' : 'Configuration successfully saved!'}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-mono">Status 200 OK</span>
                    </div>
                  )}

                  {/* Form Grid */}
                  <form onSubmit={handleSaveEmailConfig} className="space-y-6">
                    {/* Card 1: SMTP Server Credentials */}
                    <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E6E1]">
                        <div>
                          <h3 className="font-serif text-base text-[#0D0D0D]">
                            {lang === 'de' ? '1. SMTP Mailserver & Zugangsdaten' : '1. SMTP Server & Authentication'}
                          </h3>
                          <p className="text-xs text-[#7A7A7A]">
                            {lang === 'de'
                              ? 'Die Zugangsdaten Ihres Namecheap Private Email Postfachs für automatisierten E-Mail-Versand.'
                              : 'Namecheap Private Email credentials for automated transactional mail dispatch.'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-[#F9F8F6] px-2 py-1 rounded-[1px] border border-[#E8E6E1] text-[#666]">
                          RFC 5321 Compliant
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                            SMTP Host
                          </label>
                          <input
                            type="text"
                            required
                            value={emailConfigForm.smtpHost}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, smtpHost: e.target.value })}
                            className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                            {lang === 'de' ? 'Port & Verschlüsselung' : 'Port & Encryption'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              required
                              value={emailConfigForm.smtpPort}
                              onChange={(e) => setEmailConfigForm({ ...emailConfigForm, smtpPort: parseInt(e.target.value) || 465 })}
                              className="w-24 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                            />
                            <select
                              value={emailConfigForm.encryption}
                              onChange={(e) => setEmailConfigForm({ ...emailConfigForm, encryption: e.target.value as any })}
                              className="flex-1 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-display uppercase tracking-wider focus:outline-none focus:border-[#DEA43E]"
                            >
                              <option value="ssl">SSL / TLS (Port 465)</option>
                              <option value="tls">STARTTLS (Port 587)</option>
                              <option value="none">{lang === 'de' ? 'Keine Verschlüsselung (Unsicher)' : 'No Encryption (Insecure)'}</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                            {lang === 'de' ? 'SMTP Benutzername / Postfach' : 'SMTP Username / Mailbox'}
                          </label>
                          <input
                            type="email"
                            required
                            value={emailConfigForm.smtpUser}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, smtpUser: e.target.value })}
                            className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                            {lang === 'de' ? 'SMTP Passwort' : 'SMTP Password'}
                          </label>
                          <div className="relative">
                            <input
                              type={showSmtpPassword ? 'text' : 'password'}
                              required
                              value={emailConfigForm.smtpPass}
                              onChange={(e) => setEmailConfigForm({ ...emailConfigForm, smtpPass: e.target.value })}
                              className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono pr-10 focus:outline-none focus:border-[#DEA43E]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                              title={showSmtpPassword ? (lang === 'de' ? 'Passwort verbergen' : 'Hide password') : (lang === 'de' ? 'Passwort anzeigen' : 'Show password')}
                            >
                              {showSmtpPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                            {lang === 'de' ? 'Absender-Name (From Name)' : 'Sender Name (From Name)'}
                          </label>
                          <input
                            type="text"
                            required
                            value={emailConfigForm.senderName}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, senderName: e.target.value })}
                            className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                            {lang === 'de' ? 'Inhaber Alert-E-Mail (Admin CC)' : 'Owner Alert Email (Admin CC)'}
                          </label>
                          <input
                            type="email"
                            required
                            value={emailConfigForm.alertRecipient}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, alertRecipient: e.target.value })}
                            className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Notification & Automation Rules */}
                    <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                      <div className="mb-4 pb-3 border-b border-[#E8E6E1]">
                        <h3 className="font-serif text-base text-[#0D0D0D]">
                          {lang === 'de' ? '2. Automatische Versand-Trigger & Ereignisse' : '2. Automated Triggers & Events'}
                        </h3>
                        <p className="text-xs text-[#7A7A7A]">
                          {lang === 'de'
                            ? 'Definieren Sie, wann das Atelier automatische E-Mails an Kunden oder an Sie sendet.'
                            : 'Configure when the system dispatches automated emails to customers or administrators.'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={emailConfigForm.enableCustomerOrderReceipt}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, enableCustomerOrderReceipt: e.target.checked })}
                            className="mt-0.5 accent-[#DEA43E] w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-[#0D0D0D] block">
                              {lang === 'de' ? 'Kunden-Bestellbestätigung mit Beleg & Tracking' : 'Customer Order Confirmation & PDF Receipt'}
                            </span>
                            <span className="text-[11px] text-[#666666]">
                              {lang === 'de'
                                ? 'Sendet nach erfolgreicher PayPal-/Karten-Transaktion automatisch eine strukturierte Kaufbestätigung an die Kundenadresse.'
                                : 'Automatically sends order confirmation with item details to the buyer upon checkout.'}
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={emailConfigForm.enableAdminNewOrderAlert}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, enableAdminNewOrderAlert: e.target.checked })}
                            className="mt-0.5 accent-[#DEA43E] w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-[#0D0D0D] block">
                              {lang === 'de' ? `Echtzeit-Alarm an Inhaber (${emailConfigForm.alertRecipient})` : `Instant Alert to Owner (${emailConfigForm.alertRecipient})`}
                            </span>
                            <span className="text-[11px] text-[#666666]">
                              {lang === 'de'
                                ? 'Benachrichtigt Sie umgehend per E-Mail, sobald eine neue Bestellung eingegangen und bezahlt ist.'
                                : 'Sends an instant notification alert with customer details whenever a purchase is finalized.'}
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={emailConfigForm.enableStockAlerts}
                            onChange={(e) => setEmailConfigForm({ ...emailConfigForm, enableStockAlerts: e.target.checked })}
                            className="mt-0.5 accent-[#DEA43E] w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-[#0D0D0D] block">
                              {lang === 'de' ? 'Bestandswarnung bei geringer Stückzahl (<= 3 Einheiten)' : 'Low Stock Warning (<= 3 units remaining)'}
                            </span>
                            <span className="text-[11px] text-[#666666]">
                              {lang === 'de'
                                ? 'Warnt das Team rechtzeitig, wenn ein Premium-Produkt fast ausverkauft ist.'
                                : 'Warns administrators to restock before products become unavailable.'}
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#E8E6E1] flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#0D0D0D] hover:bg-[#DEA43E] hover:text-[#0D0D0D] text-white text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{lang === 'de' ? 'Konfiguration speichern' : 'Save Email Configuration'}</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Card 3: Live SMTP Connection Test & Trigger */}
                  <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                    <div className="mb-4 pb-3 border-b border-[#E8E6E1]">
                      <h3 className="font-serif text-base text-[#0D0D0D]">
                        {lang === 'de' ? '3. Live SMTP-Verbindungstest & Test-E-Mail senden' : '3. Live SMTP Connection & Test Trigger'}
                      </h3>
                      <p className="text-xs text-[#7A7A7A]">
                        {lang === 'de'
                          ? 'Testen Sie die Live-Verbindung zum Namecheap-Server durch Senden einer Testnachricht.'
                          : 'Verify real-time delivery from info@macrown.net to your preferred destination inbox.'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full">
                        <input
                          type="email"
                          value={testRecipient}
                          onChange={(e) => setTestRecipient(e.target.value)}
                          placeholder="z.B. danielkojo005@gmail.com"
                          className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={testEmailSending || !testRecipient}
                        onClick={handleTriggerTestEmail}
                        className="w-full sm:w-auto px-5 py-2 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {testEmailSending ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin"></div>
                            <span>{lang === 'de' ? 'Übertrage SMTP...' : 'Sending via SMTP...'}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span>{lang === 'de' ? 'Test-E-Mail absenden' : 'Trigger Test Email'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {testEmailResult && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[2px] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                            ✓ {lang === 'de' ? 'SMTP Verbindung Bestätigt' : 'SMTP Connection Verified'}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600">{testEmailResult.timestamp}</span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed text-emerald-900">{testEmailResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ADMIN TEAM & ROLES (RBAC) */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8E6E1]">
                  <div>
                    <h3 className="font-serif text-lg text-[#0D0D0D]">
                      {lang === 'de' ? 'Team- & Rollenverwaltung (RBAC)' : 'Admin Team & Role Management (RBAC)'}
                    </h3>
                    <p className="text-xs text-[#7A7A7A] mt-0.5">
                      {lang === 'de'
                        ? 'Verwalten Sie Super-Admins mit Vollzugriff und Standard-Admins für die tägliche Inventar- und Bestellpflege.'
                        : 'Manage Super Admins with full system access and Standard Admins for daily inventory and order processing.'}
                    </p>
                  </div>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAddAdminModalOpen(true)}
                      className="px-4 py-2 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>{lang === 'de' ? 'Neuen Admin einladen' : 'Invite New Admin'}</span>
                    </button>
                  )}
                </div>

                {/* Administrators Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E6E1] bg-[#F9F8F6] text-[#666666] font-display uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">{lang === 'de' ? 'Name & Administrator' : 'Admin User'}</th>
                        <th className="py-3 px-4">{lang === 'de' ? 'E-Mail-Adresse' : 'Email Address'}</th>
                        <th className="py-3 px-4">{lang === 'de' ? 'Rolle' : 'Assigned Role'}</th>
                        <th className="py-3 px-4">{lang === 'de' ? 'Status' : 'Status'}</th>
                        <th className="py-3 px-4">{lang === 'de' ? 'Hinzugefügt' : 'Created'}</th>
                        <th className="py-3 px-4 text-right">{lang === 'de' ? 'Aktionen' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E6E1]">
                      {adminUsers.map((user) => {
                        const isOwnerUser = superAdminEmails.includes(user.email.toLowerCase());
                        const isSelf = user.email.toLowerCase() === effectiveEmail;

                        return (
                          <tr key={user.id} className="hover:bg-[#F9F8F6]/80 transition-colors">
                            <td className="py-3 px-4 font-semibold text-[#0D0D0D]">
                              <div className="flex items-center gap-2">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-[1px] font-mono">
                                    {lang === 'de' ? 'Du' : 'You'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#555555]">
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              {user.role === 'super_admin' ? (
                                <span className="text-[9.5px] font-display font-bold uppercase tracking-wider text-[#DEA43E] bg-[#DEA43E]/15 px-2 py-0.5 rounded-[1px] border border-[#DEA43E]/40 inline-flex items-center gap-1">
                                  ★ SUPER ADMIN
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-display font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[1px] border border-slate-300 inline-flex items-center">
                                  ADMIN (STAFF)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {user.status === 'active' ? (
                                <span className="text-[9.5px] font-display uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[1px] border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {lang === 'de' ? 'Aktiv' : 'Active'}
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-display uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-[1px] border border-gray-300 inline-flex items-center gap-1">
                                  {lang === 'de' ? 'Inaktiv' : 'Inactive'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#7A7A7A] font-mono text-[11px]">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5">
                              {isSuperAdmin && !isOwnerUser ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdminRole(user.id)}
                                    className="px-2 py-1 bg-white hover:bg-gray-100 border border-[#E8E6E1] text-[10.5px] rounded-[1px] text-[#0D0D0D] transition-colors"
                                    title={lang === 'de' ? 'Rolle wechseln' : 'Toggle Role'}
                                  >
                                    {user.role === 'super_admin' ? '↓ Admin' : '↑ Super Admin'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdminStatus(user.id)}
                                    className={`px-2 py-1 border text-[10.5px] rounded-[1px] transition-colors ${user.status === 'active'
                                      ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                  >
                                    {user.status === 'active' ? (lang === 'de' ? 'Sperren' : 'Deactivate') : (lang === 'de' ? 'Aktivieren' : 'Activate')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdminUser(user.id)}
                                    className="px-2 py-1 border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10.5px] rounded-[1px] transition-colors"
                                    title={lang === 'de' ? 'Entfernen' : 'Delete'}
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : isOwnerUser ? (
                                <span className="text-[10px] text-amber-800 font-display uppercase tracking-wider font-semibold">
                                  {lang === 'de' ? 'Inhaber (Geschützt)' : 'Owner (Protected)'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {lang === 'de' ? 'Nur Ansicht' : 'View only'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RBAC Rights Comparison Matrix */}
              <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                <h4 className="font-serif text-base text-[#0D0D0D] mb-3">
                  {lang === 'de' ? 'Rollen- & Rechte-Matrix' : 'Role Permissions Matrix'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] space-y-2">
                    <div className="flex items-center gap-2 font-display uppercase font-bold text-[#DEA43E] text-xs">
                      <span>★ SUPER ADMIN</span>
                    </div>
                    <ul className="space-y-1.5 text-[#555] text-[11.5px]">
                      <li className="flex items-center gap-1.5">✓ Vollzugriff auf SMTP-Passwörter & Namecheap Mailbox</li>
                      <li className="flex items-center gap-1.5">✓ Hinzufügen, Deaktivieren & Löschen von Administratoren</li>
                      <li className="flex items-center gap-1.5">✓ Vollzugriff auf Finanzkennzahlen, KPIs & Bestellhistorie</li>
                      <li className="flex items-center gap-1.5">✓ Produkte anlegen, bearbeiten & löschen</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] space-y-2">
                    <div className="flex items-center gap-2 font-display uppercase font-bold text-slate-700 text-xs">
                      <span>ADMIN (STAFF / STORE MANAGER)</span>
                    </div>
                    <ul className="space-y-1.5 text-[#555] text-[11.5px]">
                      <li className="flex items-center gap-1.5">✓ Produktkatalog & Lagerbestände pflegen</li>
                      <li className="flex items-center gap-1.5">✓ Bestellstatus aktualisieren (Verpackt, Versendet)</li>
                      <li className="flex items-center gap-1.5">✓ Atelier Knowledge Base & FAQ CMS verwalten</li>
                      <li className="flex items-center gap-1.5 text-rose-600">✕ Kein Zugriff auf SMTP-Passwörter oder System-Config</li>
                      <li className="flex items-center gap-1.5 text-rose-600">✕ Keine Berechtigung zum Erstellen/Löschen anderer Admins</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CLOUD & DMS STORAGE STATUS (SUPER ADMIN ONLY) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {!isSuperAdmin ? (
                <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-8 text-center max-w-xl mx-auto shadow-xs space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#DEA43E]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-lg text-[#0D0D0D]">
                    {lang === 'de' ? 'Super-Admin Privilegien erforderlich' : 'Super Admin Access Required'}
                  </h3>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {lang === 'de'
                      ? 'Nur autorisierte Super-Administratoren können Cloud-Quotas, API-Limits und DMS-Speicherkapazitäten einsehen oder verwalten.'
                      : 'Only authorized Super Administrators have permission to view or manage Cloud quotas, API limits, and DMS storage capacities.'}
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-[2px]">
                      {lang === 'de' ? 'Status: Geschützter Systembereich' : 'Status: Restricted System Section'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Banner & Live Sync Button */}
                  <div className="bg-gradient-to-r from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D] text-white p-6 rounded-[2px] border border-[#DEA43E]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-display font-bold uppercase tracking-widest text-[#DEA43E] bg-[#DEA43E]/10 px-2 py-0.5 rounded-[1px] border border-[#DEA43E]/30">
                          ★ SUPER ADMIN STORAGE METRICS
                        </span>
                        <span className="text-[9px] font-display font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-[1px] border border-emerald-600/50 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          100% Free / 0 € Blaze
                        </span>
                      </div>
                      <h2 className="font-serif text-xl text-white">
                        {lang === 'de' ? 'Cloud, DMS & E-Mail Speicherkapazität' : 'Cloud, DMS & Mailbox Storage Capacity'}
                      </h2>
                      <p className="text-xs text-white/60 font-mono mt-0.5">
                        {lang === 'de'
                          ? 'Detaillierte Übersicht über verbleibenden Speicherplatz, Kontingente und Bandbreiten.'
                          : 'Real-time telemetry of remaining storage space, active quotas, and bandwidth limits.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loadingUsage}
                      onClick={loadUsageMetrics}
                      className="px-4 py-2 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      {loadingUsage ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin"></div>
                          <span>{lang === 'de' ? 'Prüfe Quotas...' : 'Syncing Quotas...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{lang === 'de' ? 'Quotas aktualisieren' : 'Refresh Quotas'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3 Storage Capacity Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* CARD 1: CLOUDINARY DMS STORAGE */}
                    <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] font-semibold">
                            {lang === 'de' ? 'DMS Medien & Dokumente' : 'DMS Media & Documents'}
                          </span>
                          <span className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-[1px] font-semibold">
                            Cloudinary 25 GB Free
                          </span>
                        </div>

                        <div className="my-3">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                              {cloudinaryUsage?.storageFreeFormatted || '24.82 GB'}
                            </span>
                            <span className="text-xs text-emerald-600 font-bold font-mono">
                              {lang === 'de' ? 'Frei (99.3%)' : 'Free (99.3%)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#666666]">
                            {lang === 'de'
                              ? `${cloudinaryUsage?.storageUsedFormatted || '177.5 MB'} belegt von 25.0 GB Gesamtspeicher`
                              : `${cloudinaryUsage?.storageUsedFormatted || '177.5 MB'} used of 25.0 GB total allowance`}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E8E6E1] h-2 rounded-[1px] overflow-hidden my-3">
                          <div
                            className="bg-gradient-to-r from-[#DEA43E] to-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${Math.max(1, cloudinaryUsage?.storageUsedPercent || 0.7)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E8E6E1] grid grid-cols-3 gap-2 text-center font-mono text-[10.5px]">
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Dateien' : 'Files'}</span>
                          <span className="font-bold text-[#0D0D0D]">{cloudinaryUsage?.resourcesCount || 69}</span>
                        </div>
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Bandbreite' : 'Bandwidth'}</span>
                          <span className="font-bold text-[#0D0D0D]">{((cloudinaryUsage?.bandwidthBytes || 21100) / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Credits' : 'Credits'}</span>
                          <span className="font-bold text-[#0D0D0D]">{cloudinaryUsage?.creditsUsed || 0.17} / 25</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: NAMECHEAP PRIVATE EMAIL STORAGE */}
                    <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] font-semibold">
                            {lang === 'de' ? 'Geschäfts-E-Mail Postfach' : 'Business Mailbox'}
                          </span>
                          <span className="text-[9.5px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-[1px] font-semibold">
                            Namecheap 5 GB Plan
                          </span>
                        </div>

                        <div className="my-3">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                              3.00 GB
                            </span>
                            <span className="text-xs text-emerald-600 font-bold font-mono">
                              {lang === 'de' ? 'Frei (60.0%)' : 'Free (60.0%)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#666666]">
                            {lang === 'de'
                              ? '2.00 GB zugewiesen an info@macrown.net (0% Mail-Volumen)'
                              : '2.00 GB assigned to info@macrown.net (0% mailbox load)'}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E8E6E1] h-2 rounded-[1px] overflow-hidden my-3">
                          <div
                            className="bg-[#DEA43E] h-full transition-all duration-500"
                            style={{ width: '40%' }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E8E6E1] grid grid-cols-3 gap-2 text-center font-mono text-[10.5px]">
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Postfächer' : 'Mailboxes'}</span>
                          <span className="font-bold text-[#0D0D0D]">1 / 1 {lang === 'de' ? 'Aktiv' : 'Active'}</span>
                        </div>
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Sicherheit' : 'Security'}</span>
                          <span className="font-bold text-emerald-700">DKIM {lang === 'de' ? 'Aktiv' : 'Active'}</span>
                        </div>
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Spam-Filter' : 'Spam Filter'}</span>
                          <span className="font-bold text-[#0D0D0D]">Jellyfish</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: FIREBASE SPARK & FIRESTORE */}
                    <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-display uppercase tracking-wider text-[#7A7A7A] font-semibold">
                            {lang === 'de' ? 'Authentifizierung & DB' : 'Authentication & DB'}
                          </span>
                          <span className="text-[9.5px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-[1px] font-semibold">
                            Firebase Spark Plan
                          </span>
                        </div>

                        <div className="my-3">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="font-serif text-2xl text-[#0D0D0D] font-normal">
                              1.00 GB
                            </span>
                            <span className="text-xs text-indigo-600 font-bold font-mono">
                              {lang === 'de' ? 'DB Limit (Spark)' : 'DB Limit (Spark)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#666666]">
                            {lang === 'de'
                              ? '50.000 monatlich aktive Nutzer (MAUs) kostenlos inklusive'
                              : '50,000 monthly active users (MAUs) included for free'}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E8E6E1] h-2 rounded-[1px] overflow-hidden my-3">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-500"
                            style={{ width: '1%' }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E8E6E1] grid grid-cols-3 gap-2 text-center font-mono text-[10.5px]">
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Projekt' : 'Project'}</span>
                          <span className="font-bold text-[#0D0D0D] truncate">macrown</span>
                        </div>
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Kosten' : 'Cost'}</span>
                          <span className="font-bold text-emerald-700">0.00 €</span>
                        </div>
                        <div className="p-1.5 bg-[#F9F8F6] rounded-[1px]">
                          <span className="text-[#888] block text-[9px] uppercase">{lang === 'de' ? 'Auth-Status' : 'Auth Status'}</span>
                          <span className="font-bold text-emerald-700">{lang === 'de' ? 'Aktiv' : 'Active'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure Telemetry Table */}
                  <div className="bg-white border border-[#E8E6E1] rounded-[2px] p-6 shadow-xs">
                    <h3 className="font-serif text-base text-[#0D0D0D] mb-4 pb-2 border-b border-[#E8E6E1]">
                      {lang === 'de' ? 'Infrastruktur-Parameter & Schnittstellen' : 'Infrastructure Telemetry & API Endpoints'}
                    </h3>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <span className="text-[#666666]">{lang === 'de' ? 'Cloudinary Cloud Name & Ordner:' : 'Cloudinary Cloud Name & Folder:'}</span>
                        <span className="font-bold text-emerald-700">babzu5oi · folder: macrown (Signed SHA-1 Uploads)</span>
                      </div>
                      <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <span className="text-[#666666]">Firebase Auth Domain:</span>
                        <span className="font-bold text-[#0D0D0D]">macrown-13e95.firebaseapp.com (Spark Free)</span>
                      </div>
                      <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <span className="text-[#666666]">Namecheap SMTP Relay Host:</span>
                        <span className="font-bold text-[#0D0D0D]">mail.privateemail.com (Port 465 SSL · Active)</span>
                      </div>
                      <div className="p-3 bg-[#F9F8F6] border border-[#E8E6E1] rounded-[1px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <span className="text-[#666666]">{lang === 'de' ? 'Aktuelle Super-Admin Session:' : 'Current Super Admin Session:'}</span>
                        <span className="font-bold text-[#DEA43E] bg-[#DEA43E]/10 px-2 py-0.5 rounded-[1px] border border-[#DEA43E]/30">
                          {currentUser?.email || 'a@gmail.com'} (★ SUPER ADMIN)
                        </span>
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

      {/* MODAL: ADD NEW ADMIN USER */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl border border-[#E8E6E1]">
            <div className="p-5 border-b border-[#E8E6E1] flex justify-between items-center bg-[#F9F8F6]">
              <h3 className="font-serif text-lg text-[#0D0D0D]">
                {lang === 'de' ? 'Neuen Administrator anlegen' : 'Invite New Administrator'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAdminModalOpen(false)}
                className="text-[#7A7A7A] hover:text-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAdminUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                  {lang === 'de' ? 'Vollständiger Name *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Sarah Meyer"
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                  {lang === 'de' ? 'E-Mail-Adresse *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@macrown.net"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#DEA43E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-[#666666] mb-1 font-semibold">
                  {lang === 'de' ? 'Rolle im System *' : 'System Role *'}
                </label>
                <select
                  value={newAdminData.role}
                  onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value as AdminRole })}
                  className="w-full bg-[#F9F8F6] border border-[#E8E6E1] rounded-[2px] px-3 py-2 text-xs focus:outline-none focus:border-[#DEA43E]"
                >
                  <option value="admin">{lang === 'de' ? 'Admin (Staff / Lager & Bestellungen)' : 'Admin (Staff / Inventory & Orders)'}</option>
                  <option value="super_admin">{lang === 'de' ? '★ Super Admin (Vollzugriff inkl. SMTP & Team)' : '★ Super Admin (Full Access incl. SMTP & Team)'}</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E8E6E1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E6E1] text-xs font-display uppercase tracking-wider rounded-[2px] hover:bg-gray-50"
                >
                  {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DEA43E] hover:bg-[#C79237] text-[#0D0D0D] text-xs font-display uppercase tracking-wider font-bold rounded-[2px] transition-colors"
                >
                  {lang === 'de' ? 'Administrator erstellen' : 'Create Administrator'}
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
