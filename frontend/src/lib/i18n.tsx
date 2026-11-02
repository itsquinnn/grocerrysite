import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ne";

export const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toDevanagari(val: number | string): string {
  return String(val).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[parseInt(d, 10)]);
}

export const CATEGORY_NEPALI: Record<string, string> = {
  Fashion: "फेसन",
  Electronics: "इलेक्ट्रोनिक्स",
  "Home & Living": "घर तथा जीवनशैली",
  Beauty: "सौन्दर्य",
  "Sports & Outdoors": "खेलकुद तथा आउटडोर",
  Sports: "खेलकुद तथा आउटडोर",
  Outdoor: "आउटडोर",
  Accessories: "एक्सेसरीज",
};

export const SUBCATEGORY_NEPALI: Record<string, string> = {
  Outerwear: "बाहिरी पहिरन",
  Wearables: "स्मार्ट ग्याजेट",
  Audio: "अडियो तथा स्पिकर",
  Lighting: "बत्ती तथा ल्याम्प",
  Textiles: "कपडा तथा तन्ना",
  Bath: "नुहाउने सामग्री",
  Fragrance: "सुगन्ध तथा अत्तर",
  Yoga: "योगा तथा फिटनेस",
  Footwear: "जुत्ता तथा चप्पल",
  Eyewear: "चस्मा तथा सनग्लास",
  Bags: "झोला तथा ब्याग",
  Wallets: "वालेट तथा पर्स",
  Shirts: "सर्ट तथा टप्स",
  Shawls: "पश्मिना तथा शल",
  Trekking: "ट्रेकिङ तथा हाइकिङ",
  Decor: "गृह सजावट",
  Skincare: "छालाको स्याहार",
};

export const PRODUCT_NEPALI: Record<string, string> = {
  "Camel Wool Overcoat": "क्यामेल ऊनी ओभरकोट",
  "Pulse Smartwatch": "पल्स स्मार्टवाच",
  "Pebble Bluetooth Speaker": "पेबल ब्लुटुथ स्पिकर",
  "Brass Table Lamp": "पित्तलको टेबल ल्याम्प",
  "Striped Cotton Throw": "धर्के सुती थ्रो",
  "Herbal Soap Trio": "हर्बल साबुन सेट",
  "Amber Eau de Parfum": "एम्बर अत्तर (Eau de Parfum)",
  "Sage Yoga Mat": "सेज योगा म्याट",
  "Stride Running Shoes": "स्ट्राइड रनिङ जुत्ता",
  "Tortoise Sunglasses": "टोर्टोइज सनग्लास",
  "Market Canvas Tote": "मार्केट क्यानभास झोला",
  "Classic Leather Wallet": "क्लासिक छालाको वालेट",
  "Linen Button-Down Shirt": "लिनन सर्ट",
  "Pure Pashmina Shawl": "खाँटी पश्मिना शल",
  "Annapurna 45L Trekking Pack": "अन्नपूर्ण ४५ लि ट्रेकिङ ब्याकप्याक",
  "Terracotta Vase": "टेराकोटा माटोको फूलदानी",
  "Aura Wireless Headphones": "औरा वायरलेस हेडफोन",
  "Himalayan Face Serum": "हिमालयन फेस सेरम",
};

export const PROVINCE_NEPALI: Record<string, string> = {
  Koshi: "कोशी प्रदेश",
  Madhesh: "मधेश प्रदेश",
  Bagmati: "बागमती प्रदेश",
  Gandaki: "गण्डकी प्रदेश",
  Lumbini: "लुम्बिनी प्रदेश",
  Karnali: "कर्णाली प्रदेश",
  Sudurpashchim: "सुदूरपश्चिम प्रदेश",
};

export const STATUS_NEPALI: Record<string, string> = {
  pending: "लंबित",
  confirmed: "पुष्टि भएको",
  processing: "प्रशोधन हुँदै",
  shipped: "पठाइएको",
  out_for_delivery: "डेलिभरीमा छ",
  delivered: "डेलिभर भएको",
  cancelled: "रद्द गरिएको",
  refunded: "रकम फिर्ता",
  returned: "फिर्ता गरिएको",
};

const translations = {
  en: {
    // Navigation & Common
    home: "Home",
    shop: "Shop",
    all_products: "All products",
    offers: "Offers",
    compare: "Compare",
    stores: "Stores",
    our_story: "Our Story",
    track_order: "Track order",
    support: "Help & support",
    faq: "FAQ",
    saved: "Saved",
    cart: "Cart",
    account: "Account",
    my_account: "My account",
    my_orders: "My orders",
    notifications: "Notifications",
    admin_dashboard: "Admin dashboard",
    sign_in: "Sign in",
    sign_out: "Sign out",
    register: "Register",
    search: "Search",
    search_placeholder: "Search shirts, headphones, pashmina…",
    close_search: "Close search",
    currency_prefix: "Rs. ",

    // Announcement
    announcement: "Free delivery across Nepal on orders over Rs. 5,000 · Use",
    announcement_suffix: "for 10% off",

    // USPs
    usp_delivery: "Free delivery over Rs. 5,000",
    usp_cod: "Cash on delivery",
    usp_returns: "7-day easy returns",
    usp_genuine: "100% genuine products",

    // Home Hero
    hero_season: "Autumn / Winter 2026",
    hero_title: "Made to be lived with.",
    hero_subtitle: "Fewer, better things — from pashmina woven in the valley to headphones for the commute.",
    shop_collection: "Shop the collection",
    see_offers: "See offers",

    // Sections
    shop_by_category: "Shop by category",
    browse: "Browse",
    trending: "Trending this week",
    best_sellers: "Best sellers",
    new_arrivals: "New arrivals",
    recommended: "Recommended for you",
    recently_viewed: "Recently viewed",
    view_all: "View all",
    customer_reviews: "What our customers say",

    // Product Card & Actions
    add_to_cart: "Add to cart",
    out_of_stock: "Out of stock",
    in_stock: "In stock",
    off: "off",
    reviews_count: "reviews",
    select_size: "Select size",
    select_color: "Select color",
    quantity: "Quantity",
    buy_now: "Buy now",

    // Cart & Summary
    your_cart: "Your cart",
    empty_cart: "Your cart is empty",
    empty_cart_sub: "Items added to your bag will appear here.",
    subtotal: "Subtotal",
    checkout: "Proceed to checkout",
    continue_shopping: "Continue shopping",
    shopping_cart: "Shopping cart",
    order_summary: "Order summary",
    apply: "Apply",
    coupon_code: "Coupon code",
    discount: "Discount",
    shipping_fee: "Shipping",
    free: "Free",
    vat: "VAT",
    total: "Total",
    remove: "Remove",

    // Checkout
    checkout_title: "Checkout",
    delivery_address: "Delivery address",
    shipping_method: "Shipping method",
    payment_method: "Payment method",
    review_order: "Review order",
    place_order: "Place order",
    placing_order: "Placing order...",
    full_name: "Full name",
    mobile_number: "Mobile number",
    province: "Province",
    district: "District",
    city_municipality: "City / Municipality",
    street_tole: "Street / Tole",
    landmark_optional: "Landmark (optional)",
    add_new_address: "Add a new address",
    save_to_address_book: "Save to my address book",
    billing_same_as_delivery: "Billing address same as delivery",
    billing_address: "Billing address",
    cod_label: "Cash on delivery (COD)",
    cod_desc: "Pay with cash or mobile banking QR code upon doorstep delivery across all 77 districts.",
    standard_shipping: "Standard",
    standard_shipping_desc: "3–6 days · free over Rs. 5,000",
    express_shipping: "Express",
    express_shipping_desc: "1–2 days in major cities",
    coming_soon: "Coming soon",
    sign_in_to_checkout: "Sign in to check out",
    cart_waiting: "Your cart is saved and will be waiting.",
    create_account: "Create an account",

    // Track Order
    track_title: "Track your order",
    order_number: "Order number",
    phone_used: "Phone used at checkout",
    track_btn: "Track",
    order_status: "Status",
    order_placed_on: "Placed on",
    est_delivery: "Est. delivery",
    ship_to: "Ship to",
    tracking_num: "Tracking #",

    // Account Links
    profile: "Profile",
    orders_invoices: "Orders & invoices",
    addresses: "Addresses",
    support_tickets: "Support tickets",

    // Orders & Invoices
    orders_and_invoices: "Orders & Invoices",
    orders_subtitle: "Track past orders, view delivery status, or download official Tax Invoices (PDF).",
    download_pdf_invoice: "Download Invoice (PDF)",
    download_tax_invoice: "Download Tax Invoice (PDF)",
    pdf_invoice: "PDF Invoice",
    all_orders: "All orders",
    order_confirmed: "Thank you! Your order is confirmed.",
    order_confirmed_sub: "Pay in cash upon doorstep delivery.",

    // Language Toggle
    current_lang: "English",
    switch_lang: "नेपालीमा हेर्नुहोस्",
  },
  ne: {
    // Navigation & Common
    home: "गृहपृष्ठ",
    shop: "किनमेल",
    all_products: "सबै उत्पादनहरू",
    offers: "अफरहरू",
    compare: "तुलना",
    stores: "स्टोरहरू",
    our_story: "हाम्रो कथा",
    track_order: "अर्डर ट्र्याक",
    support: "सहायता तथा सम्पर्क",
    faq: "प्रायः सोधिने प्रश्न",
    saved: "सुरक्षित",
    cart: "कार्ट",
    account: "खाता",
    my_account: "मेरो खाता",
    my_orders: "मेरो अर्डरहरू",
    notifications: "सूचनाहरू",
    admin_dashboard: "एडमिन ड्यासबोर्ड",
    sign_in: "लग-इन",
    sign_out: "साइन आउट",
    register: "दर्ता गर्नुहोस्",
    search: "खोज्नुहोस्",
    search_placeholder: "लुगा, हेडफोन, पश्मिना खोज्नुहोस्...",
    close_search: "खोज बन्द गर्नुहोस्",
    currency_prefix: "रु ",

    // Announcement
    announcement: "रु ५,००० भन्दा माथिको अर्डरमा नेपालभर नि:शुल्क डेलिभरी · १०% छुटको लागि",
    announcement_suffix: "प्रयोग गर्नुहोस्",

    // USPs
    usp_delivery: "रु ५,००० माथि नि:शुल्क डेलिभरी",
    usp_cod: "क्यास अन डेलिभरी (COD)",
    usp_returns: "७ दिनमा सजिलो फिर्ता",
    usp_genuine: "१००% सक्कली उत्पादनहरू",

    // Home Hero
    hero_season: "शरद / शिशिर २०२६",
    hero_title: "दैनिक जीवनका लागि उत्कृष्ट सामग्री।",
    hero_subtitle: "काठमाडौँ उपत्यकामा बुनिएको पश्मिनादेखि आधुनिक ग्याजेटहरूसम्म — उच्च गुणस्तर, उचित मूल्य।",
    shop_collection: "उत्पादनहरू हेर्नुहोस्",
    see_offers: "अफरहरू हेर्नुहोस्",

    // Sections
    shop_by_category: "वर्ग अनुसार किनमेल",
    browse: "ब्राउज गर्नुहोस्",
    trending: "यस हप्ताका चर्चित सामग्री",
    best_sellers: "सबैभन्दा बढी रुचाइएका",
    new_arrivals: "नयाँ सामग्रीहरू",
    recommended: "तपाईंको लागि विशेष",
    recently_viewed: "भर्खरै हेरिएका सामग्री",
    view_all: "सबै हेर्नुहोस्",
    customer_reviews: "ग्राहकहरूको अनुभव",

    // Product Card & Actions
    add_to_cart: "कार्टमा थप्नुहोस्",
    out_of_stock: "स्टक सकिएको",
    in_stock: "उपलब्ध छ",
    off: "छुट",
    reviews_count: "समीक्षा",
    select_size: "साइज छान्नुहोस्",
    select_color: "रंग छान्नुहोस्",
    quantity: "परिमाण",
    buy_now: "अहिले किन्नुहोस्",

    // Cart & Summary
    your_cart: "तपाईंको कार्ट",
    empty_cart: "तपाईंको कार्ट खाली छ",
    empty_cart_sub: "तपाईंले छान्नुभएका सामग्रीहरू यहाँ देखिनेछन्।",
    subtotal: "उप-जम्मा",
    checkout: "चेकआउट गर्नुहोस्",
    continue_shopping: "किनमेल जारी राख्नुहोस्",
    shopping_cart: "शपिङ कार्ट",
    order_summary: "अर्डर विवरण",
    apply: "लागू गर्नुहोस्",
    coupon_code: "कुपन कोड",
    discount: "छुट",
    shipping_fee: "डेलिभरी शुल्क",
    free: "निःशुल्क",
    vat: "भ्याट",
    total: "जम्मा",
    remove: "हटाउनुहोस्",

    // Checkout
    checkout_title: "चेकआउट",
    delivery_address: "डेलिभरी ठेगाना",
    shipping_method: "डेलिभरी विधि",
    payment_method: "भुक्तानी विधि",
    review_order: "अर्डर समीक्षा",
    place_order: "अर्डर गर्नुहोस्",
    placing_order: "अर्डर प्रक्रिया हुँदैछ...",
    full_name: "पूरा नाम",
    mobile_number: "मोबाइल नम्बर",
    province: "प्रदेश",
    district: "जिल्ला",
    city_municipality: "सहर / नगरपालिका",
    street_tole: "सडक / टोल",
    landmark_optional: "नजिकैको चिनारी (ऐच्छिक)",
    add_new_address: "नयाँ ठेगाना थप्नुहोस्",
    save_to_address_book: "मेरो ठेगाना पुस्तिकामा सुरक्षित गर्नुहोस्",
    billing_same_as_delivery: "बिलिङ ठेगाना र डेलिभरी ठेगाना एउटै",
    billing_address: "बिलिङ ठेगाना",
    cod_label: "क्यास अन डेलिभरी (COD)",
    cod_desc: "घरमै सामान प्राप्त भएपछि नगद वा मोबाइल क्युआर कोडमार्फत भुक्तानी गर्नुहोस्।",
    standard_shipping: "साधारण डेलिभरी",
    standard_shipping_desc: "३–६ दिन · रु ५,००० भन्दा माथि निःशुल्क",
    express_shipping: "एक्सप्रेस डेलिभरी",
    express_shipping_desc: "प्रमुख सहरहरूमा १–२ दिन",
    coming_soon: "चाँडै आउँदैछ",
    sign_in_to_checkout: "चेकआउट गर्न लग-इन गर्नुहोस्",
    cart_waiting: "तपाईंको कार्ट सुरक्षित छ र तपाईंलाई पर्खिरहेको छ।",
    create_account: "नयाँ खाता खोल्नुहोस्",

    // Track Order
    track_title: "अर्डर ट्र्याक गर्नुहोस्",
    order_number: "अर्डर नम्बर",
    phone_used: "चेकआउट गर्दा प्रयोग गरिएको फोन",
    track_btn: "ट्र्याक गर्नुहोस्",
    order_status: "स्थिति",
    order_placed_on: "अर्डर गरिएको मिति",
    est_delivery: "अनुमानित डेलिभरी",
    ship_to: "डेलिभरी ठेगाना",
    tracking_num: "ट्र्याकिङ नम्बर",

    // Account Links
    profile: "प्रोफाइल",
    orders_invoices: "अर्डर तथा कर बिल",
    addresses: "ठेगानाहरू",
    support_tickets: "सहायता टिकट",

    // Orders & Invoices
    orders_and_invoices: "अर्डर तथा कर बिलहरू",
    orders_subtitle: "विगतका अर्डरहरू हेर्नुहोस्, डेलिभरी ट्र्याक गर्नुहोस् वा आधिकारिक कर बिल (PDF) डाउनलोड गर्नुहोस्।",
    download_pdf_invoice: "बिल डाउनलोड (PDF)",
    download_tax_invoice: "कर बिल डाउनलोड गर्नुहोस् (PDF)",
    pdf_invoice: "PDF कर बिल",
    all_orders: "सबै अर्डरहरू",
    order_confirmed: "धन्यवाद! तपाईंको अर्डर पुष्टि भयो।",
    order_confirmed_sub: "घरमा सामान आइपुगेपछि नगद भुक्तानी गर्नुहोस्।",

    // Language Toggle
    current_lang: "नेपाली",
    switch_lang: "Switch to English",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type I18nContextType = {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  formatPrice: (amount: number | string | null | undefined) => string;
  formatStatus: (status: string) => string;
  translateCategory: (catName: string) => string;
  translateSubcategory: (subName: string) => string;
  translateProduct: (prodName: string) => string;
  translateProvince: (provName: string) => string;
  isNepali: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "dovan_locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "ne") {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "en" ? "ne" : "en";
      try {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[locale] as Record<string, string>)[key] ?? translations.en[key] ?? key;
    },
    [locale],
  );

  const formatPrice = useCallback(
    (amount: number | string | null | undefined): string => {
      const num = Number(amount ?? 0);
      const formattedNum = num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
      if (locale === "ne") {
        return "रु " + toDevanagari(formattedNum);
      }
      return "Rs. " + formattedNum;
    },
    [locale],
  );

  const formatStatus = useCallback(
    (status: string): string => {
      if (locale === "ne" && STATUS_NEPALI[status]) {
        return STATUS_NEPALI[status];
      }
      return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    },
    [locale],
  );

  const translateCategory = useCallback(
    (catName: string): string => {
      if (locale === "ne" && CATEGORY_NEPALI[catName]) {
        return CATEGORY_NEPALI[catName];
      }
      return catName;
    },
    [locale],
  );

  const translateSubcategory = useCallback(
    (subName: string): string => {
      if (locale === "ne" && SUBCATEGORY_NEPALI[subName]) {
        return SUBCATEGORY_NEPALI[subName];
      }
      return subName;
    },
    [locale],
  );

  const translateProduct = useCallback(
    (prodName: string): string => {
      if (locale === "ne" && PRODUCT_NEPALI[prodName]) {
        return PRODUCT_NEPALI[prodName];
      }
      return prodName;
    },
    [locale],
  );

  const translateProvince = useCallback(
    (provName: string): string => {
      if (locale === "ne" && PROVINCE_NEPALI[provName]) {
        return PROVINCE_NEPALI[provName];
      }
      return provName;
    },
    [locale],
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      formatPrice,
      formatStatus,
      translateCategory,
      translateSubcategory,
      translateProduct,
      translateProvince,
      isNepali: locale === "ne",
    }),
    [
      locale,
      setLocale,
      toggleLocale,
      t,
      formatPrice,
      formatStatus,
      translateCategory,
      translateSubcategory,
      translateProduct,
      translateProvince,
    ],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
