import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en";

export const DEVANAGARI_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function toDevanagari(val: number | string): string {
  return String(val);
}

export const CATEGORY_NEPALI: Record<string, string> = {};
export const SUBCATEGORY_NEPALI: Record<string, string> = {};
export const PRODUCT_NEPALI: Record<string, string> = {};
export const PROVINCE_NEPALI: Record<string, string> = {};
export const STATUS_NEPALI: Record<string, string> = {};

const translations = {
  en: {
    // Navigation & Common
    home: "Home",
    shop: "Shop",
    all_products: "All products",
    all_categories: "All categories",
    more_categories: "More",
    offers: "Offers",
    compare: "Compare",
    stores: "77 Districts",
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
    cod_desc: "Pay in cash or scan QR when your package arrives at your door.",
    standard_shipping: "Standard Delivery (2-4 hours)",
    standard_shipping_desc: "3–6 days · Free over Rs. 5,000",
    express_shipping: "Express Delivery (within 30 mins)",
    express_shipping_desc: "Instant doorstep delivery in select cities",
    coming_soon: "Coming soon",
    sign_in_to_checkout: "Sign in with your phone number to complete order",
    cart_waiting: "Your bag is waiting.",
    create_account: "Create an account",

    // Track Order
    track_title: "Track an order",
    order_number: "Order number",
    phone_used: "Phone number used at checkout",
    track_btn: "Track order",
    order_status: "Status",
    order_placed_on: "Order placed on",
    est_delivery: "Estimated delivery",
    ship_to: "Shipping to",
    tracking_num: "Tracking number",

    // Account Links
    profile: "Profile",
    orders_invoices: "Orders & Invoices",
    addresses: "Addresses",
    support_tickets: "Support tickets",

    // Orders & Invoices
    orders_and_invoices: "Orders & Invoices",
    orders_subtitle: "View your order history, track shipments, and download tax invoices for your records.",
    download_pdf_invoice: "Download Invoice (PDF)",
    download_tax_invoice: "Download Tax Invoice (PDF)",
    pdf_invoice: "Tax Invoice PDF",
    all_orders: "All orders",
    order_confirmed: "Thank you! Your order is placed.",
    order_confirmed_sub: "We'll send you an SMS with tracking details once your package is on its way. Cash on delivery accepted upon arrival.",

    // Language Toggle
    current_lang: "English",
    switch_lang: "English",
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
  translateProvince: (provName?: string) => string;
  isNepali: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "dovan_locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, "en");
      document.documentElement.lang = "en";
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setLocale = useCallback((_newLocale: Locale) => {}, []);
  const toggleLocale = useCallback(() => {}, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations.en[key] ?? key;
    },
    [],
  );

  const formatPrice = useCallback(
    (amount: number | string | null | undefined): string => {
      const num = Number(amount ?? 0);
      const formattedNum = num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
      return "Rs. " + formattedNum;
    },
    [],
  );

  const formatStatus = useCallback(
    (status: string): string => {
      return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    },
    [],
  );

  const translateCategory = useCallback((catName: string): string => catName || "", []);
  const translateSubcategory = useCallback((subName: string): string => subName || "", []);
  const translateProduct = useCallback((prodName: string): string => prodName || "", []);
  const translateProvince = useCallback((provName?: string): string => provName || "", []);

  const contextValue = useMemo<I18nContextType>(
    () => ({
      locale: "en",
      setLocale,
      toggleLocale,
      t,
      formatPrice,
      formatStatus,
      translateCategory,
      translateSubcategory,
      translateProduct,
      translateProvince,
      isNepali: false,
    }),
    [
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
