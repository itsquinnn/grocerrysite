import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ne";

export const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toDevanagari(val: number | string): string {
  return String(val).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[parseInt(d, 10)]);
}

export const CATEGORY_NEPALI: Record<string, string> = {
  // Store Categories
  "Fresh Vegetables": "ताजा तरकारीहरू",
  "Fresh Fruits": "ताजा फलफूलहरू",
  "Dairy & Breakfast": "डेरी तथा बिहानी खाजा",
  "Bakery & Bread": "बेकरी तथा पाउरोटी",
  "Pantry & Cooking Essentials": "किराना तथा भान्सा सामग्री",
  "Snacks & Munchies": "खाजा तथा स्न्याक्स",
  "Daily Essentials": "दैनिक उपभोग्य सामग्री",
  "Personal Care": "व्यक्तिगत स्याहार",
  "Home Care": "घर सरसफाइ सामग्री",
  "Kitchen & Dining": "भान्सा तथा भोजन सामग्री",
  "Rice & Grains": "चामल, दाल तथा अन्न",
  "Oils & Ghee": "तेल तथा शुद्ध घिउ",
  "Organic & Local": "अर्ग्यानिक तथा स्थानीय",
  "Drinks & Beverages": "पेय पदार्थ तथा जुस",
  "Snacks & Instant Foods": "खाजा तथा तयारी खाना",
  "Spices & Seasonings": "मसला तथा जडिबुटी",
  "Meat & Seafood": "मासु तथा माछा",

  // Shorter / Single Word Keys
  Grocery: "किराना तथा खाद्यान्न",
  Groceries: "किराना तथा खाद्यान्न",
  Vegetables: "ताजा तरकारी",
  Fruits: "ताजा फलफूल",
  Dairy: "दूध तथा दुग्धजन्य",
  Bakery: "बेकरी तथा पाउरोटी",
  Beverages: "पेय पदार्थ",
  Snacks: "खाजा तथा स्न्याक्स",
  Organic: "अर्ग्यानिक उत्पादन",
  Spices: "मसला तथा जडिबुटी",
  Meat: "मासु तथा अण्डा",
  Essentials: "दैनिक उपभोग्य",
  Household: "घरेलु सामग्री",
  Kitchen: "भान्सा सामग्री",
  Grains: "चामल, दाल तथा अन्न",
  Oils: "तेल तथा घिउ",
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
  // Store Subcategories from Live Database
  "Daily Veggies": "दैनिक उपभोग्य तरकारी",
  "Leafy Greens": "सागपात तथा हरियो तरकारी",
  "Exotic & Seasonal": "मौसमी तथा विशेष तरकारी",
  "Daily Fruits": "दैनिक उपभोग्य फलफूल",
  "Citrus & Berries": "कागति, सुन्तला तथा बेरी",
  "Exotic & Melons": "खर्बुजा तथा विशेष फलफूल",
  "Milk & Butter": "दूध तथा नौनी घिउ",
  "Paneer & Cheese": "पनिर तथा चीज",
  "Eggs & Yogurt": "अण्डा तथा दही",
  "Fresh Breads & Buns": "ताजा पाउरोटी तथा बन",
  "Cookies & Rusks": "कुकिज तथा टोस्ट बिस्कुट",
  "Rice, Atta & Grains": "चामल, आँटा तथा अन्न",
  "Oils & Ghee": "तेल तथा शुद्ध घिउ",
  "Spices, Salt & Sugar": "मसला, नुन तथा चिनी",
  "Chips & Namkeen": "चिप्स तथा नमकिन",
  "Chocolates & Sweets": "चकलेट तथा मिठाई",
  "Nuts & Dry Fruits": "काजु, बदाम तथा ड्राइ फ्रुट्स",

  // Generic Subcategory Mappings
  Fresh: "ताजा उत्पादन",
  Organic: "प्राङ्गारिक / अर्ग्यानिक",
  Vegetables: "तरकारी",
  Fruits: "फलफूल",
  Milk: "दूध",
  Cheese: "चीज तथा पनिर",
  Bread: "पाउरोटी तथा केक",
  Biscuits: "बिस्कुट तथा कुकिज",
  Tea: "चियापत्ती",
  Coffee: "कफी",
  Juice: "फ्रेस जुस",
  Water: "मिनरल वाटर",
  Spices: "मसला",
  Pulses: "दाल तथा गेडागुडी",
  Rice: "चामल तथा बासमती",
  Flour: "आँटा तथा मैदा",
  Oil: "तोरी/सूर्यमुखी तेल",
  Ghee: "शुद्ध गाई/भैँसीको घिउ",
  Salt: "नुन तथा आयोडिन",
  Sugar: "चिनी तथा सख्खर",
  Noodles: "चाउचाउ तथा पास्ता",
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
  // All 50 Active Products from Live Database
  "English Salad Cucumber": "सलाद काँक्रो (English Cucumber)",
  "Farm Fresh Snow White Cauliflower": "बारीको ताजा काउली (Cauliflower)",
  "Sweet Green Garden Peas (Matar)": "ताजा हरियो केराउ / मटर",
  "Organic Green Broccoli Florets": "अर्ग्यानिक हरियो ब्रोकाउली",
  "Kashmiri Royal Gala Apples": "कश्मीरी रोयल गाला स्याउ",
  "Cavendish Fresh Yellow Bananas": "ताजा पाकेको केरा (दर्जन)",
  "Nagpur Sweet Juicy Oranges": "गुलियो ताजा सुन्तला",
  "Green Seedless Table Grapes": "हरियो बीउ नभएको अंगुर",
  "Semi-Ripe Sweet Red Papaya": "ताजा गुलियो मेवा (Papaya)",
  "Queen Fresh Sweet Pineapple": "ताजा रसिलो भुइँकटहर (Pineapple)",
  "Ruby Red Pomegranate (Anar)": "ताजा रातो अनार (Pomegranate)",
  "Fresh Zespri Green Kiwi Pack": "ताजा किवी फल (Kiwi)",
  "Organic Red Onions (Nashik)": "अर्ग्यानिक रातो प्याज (Red Onions)",
  "Mountain Russet Potatoes": "पहाडी रातो आलु (Potatoes)",
  "Crisp Green Capsicum": "ताजा हरियो भेडे खुर्सानी (Capsicum)",
  "Kiran Seedless Sweet Watermelon": "गुलियो रातो खर्बुजा (Watermelon)",
  "Amul Taaza Fresh Toned Milk": "अमुल ताजा दूध (Toned Milk)",
  "Farm Fresh White Eggs (Pack of 12)": "ताजा कुखुराको अण्डा (१२ वटाको क्रेट)",
  "Amul Pure Salted Butter": "अमुल शुद्ध बटर (Salted Butter)",
  "Fresh Malai Paneer Cubes": "ताजा मलाई पनिर (Fresh Paneer)",
  "Mother Dairy Classic Dahi (Curd)": "मदर डेरी ताजा दही (Curd)",
  "Amul Processed Cheese Slices": "अमुल प्रोसेस चीज स्लाइस",
  "Epigamia Greek Strawberry Yogurt": "स्ट्रबेरी योगर्ट (Greek Yogurt)",
  "Nestle Sweetened Condensed Milk": "नेस्ले कन्डेन्स्ड मिल्क (Milkmaid)",
  "100% Whole Wheat Artisanal Brown Bread": "१००% गहुँको ब्राउन ब्रेड",
  "Soft White Sandwich Milk Bread": "नरम सेतो स्यान्डविच ब्रेड",
  "Brioche Sesame Burger Buns": "तिलवाला बर्गर बन्स (Burger Buns)",
  "Britannia Good Day Rich Butter Cookies": "ब्रिटानिया गुड डे बटर बिस्कुट",
  "Dark Chocolate Fudge Brownie Muffins": "डार्क चकलेट ब्राउनी मफिन्स",
  "India Gate Super Basmati Rice": "इन्डिया गेट सुपर बासमती चामल",
  "Aashirvaad Shudh Chakki Whole Wheat Atta": "आशीर्वाद शुद्ध चक्की आँटा",
  "Fortune Sunlite Refined Sunflower Oil": "फर्च्युन शुद्ध सूर्यमुखी तेल (Sunflower Oil)",
  "Tata Sampann Unpolished Toor Dal": "टाटा सम्पन्न रहर दाल (Toor Dal)",
  "Yellow Moong Dal Split (Dhuli)": "पहेंलो मुंग दाल (Moong Dal)",
  "Tata Salt Vacuum Evaporated Iodized Salt": "टाटा आयोडिनयुक्त नुन (Tata Salt)",
  "Everest Super Garam Masala Blend": "एभरेस्ट गरम मसला (Garam Masala)",
  "Catch Pure Sun-Dried Turmeric Powder": "क्याच शुद्ध बेसार धुलो (Turmeric Powder)",
  "Everest Kashmiri Lal Mirch Powder": "एभरेस्ट कश्मीरी रातो खुर्सानी धुलो",
  "24 Mantra Organic Pure Jaggery Powder (Gud)": "अर्ग्यानिक शुद्ध सख्खर/गुड (Jaggery Powder)",
  "Kurkure Masala Munch Crispy Snack": "कुरकुरे मसला मन्च स्न्याक्स",
  "Haldiram's Nagpur Spicy Aloo Bhujia": "हल्दीराम्स आलु भुजिया (Aloo Bhujia)",
  "Cadbury Dairy Milk Silk Chocolate Bar": "क्याडबरी डेरी मिल्क सिल्क चकलेट",
  "Maggi 2-Minute Masala Instant Noodles": "म्यागी २-मिनेट मसला चाउचाउ",
  "Farm Fresh Red Tomatoes": "बारीको ताजा रातो गोलभेँडा (Tomatoes)",
  "California Raw Crunchy Almonds (Badam)": "क्यालिफोर्निया बदाम (Almonds)",
  "Lay's India's Magic Masala Potato Chips": "लेज म्याजिक मसला आलु चिप्स",
  "Fresh Mountain Red Carrots": "ताजा पहाडी रातो गाजर (Carrots)",
  "Tender Baby Spinach (Palak)": "ताजा हरियो पालुङ्गो साग (Spinach)",
  "Golden Seedless Afghani Raisins (Kishmish)": "सुनौलो किसमिस (Raisins)",
  "Whole King Cashew Nuts (Kaju W240)": "साबुत काजु (King Cashew Nuts)",

  // Legacy / Lifestyle Products
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
    all_categories: "All categories",
    more_categories: "More",
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
    all_categories: "सबै विधाहरू",
    more_categories: "थप विधाहरू",
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
    add_to_cart: "झोला (कार्ट) मा थप्नुहोस्",
    out_of_stock: "अहिले सकिएको छ",
    in_stock: "उपलब्ध छ",
    off: "छुट",
    reviews_count: "समीक्षा",
    select_size: "साइज छान्नुहोस्",
    select_color: "रंग छान्नुहोस्",
    quantity: "परिमाण",
    buy_now: "अहिले किन्नुहोस्",

    // Cart & Summary
    your_cart: "तपाईंको झोला (कार्ट)",
    empty_cart: "तपाईंको झोला खाली छ",
    empty_cart_sub: "तपाईंले किन्न खोज्नुभएका सामानहरू यहाँ देखिनेछन्।",
    subtotal: "सामानको जम्मा मूल्य",
    checkout: "अर्डर अगाडि बढाउनुहोस्",
    continue_shopping: "थप किनमेल गर्नुहोस्",
    shopping_cart: "किनमेलको झोला",
    order_summary: "अर्डरको हिसाब-किताब",
    apply: "छुट जोड्नुहोस्",
    coupon_code: "छुट कुपन कोड भए हाल्नुहोस्",
    discount: "पाउनुभएको छुट",
    shipping_fee: "डेलिभरी खर्च (घरसम्म ल्याएको)",
    free: "निःशुल्क (फ्री)",
    vat: "भ्याट (सरकारी कर)",
    total: "तपाईंले तिर्नुपर्ने जम्मा रकम",
    remove: "हटाउनुहोस्",

    // Checkout
    checkout_title: "सामान अर्डर गर्नुहोस्",
    delivery_address: "सामान कहाँ ल्याउने? (ठेगाना)",
    shipping_method: "डेलिभरी समय छान्नुहोस्",
    payment_method: "पैसा कसरी तिर्ने?",
    review_order: "अर्डरको हिसाब जाँच गर्नुहोस्",
    place_order: "अर्डर पक्का गर्नुहोस्",
    placing_order: "अर्डर पक्का हुँदैछ...",
    full_name: "तपाईंको पूरा नाम",
    mobile_number: "सम्पर्क गर्ने मोबाइल नम्बर",
    province: "प्रदेश",
    district: "जिल्ला",
    city_municipality: "नगरपालिका / गाउँपालिका",
    street_tole: "टोल, बाटो वा ठाउँको नाम",
    landmark_optional: "नजिकैको चिनिने ठाउँ (जस्तै: मन्दिर, स्कुल, चोक)",
    add_new_address: "नयाँ ठेगाना थप्नुहोस्",
    save_to_address_book: "भविष्यका लागि सुरक्षित राख्नुहोस्",
    billing_same_as_delivery: "बिल र डेलिभरी ठेगाना एउटै हो",
    billing_address: "बिलिङ ठेगाना",
    cod_label: "सामान घरमै पाएपछि हातैमा पैसा दिने (Cash on Delivery)",
    cod_desc: "सामान घरमै आइपुगेपछि डेलिभरी साथीलाई नगद पैसा वा मोबाइल बैंकिङ QR बाट तिर्न सक्नुहुन्छ।",
    standard_shipping: "नियमित डेलिभरी (२-४ घण्टा भित्र)",
    standard_shipping_desc: "३–६ दिन · रु ५,००० भन्दा माथिको अर्डरमा निःशुल्क",
    express_shipping: "चाँडो डेलिभरी (३० मिनेट भित्र)",
    express_shipping_desc: "प्रमुख सहरहरूमा तत्कालै घरमै आइपुग्छ",
    coming_soon: "चाँडै आउँदैछ",
    sign_in_to_checkout: "अर्डर गर्न आफ्नो फोन नम्बरबाट लग-इन गर्नुहोस्",
    cart_waiting: "तपाईंले छान्नुभएका सामानहरू सुरक्षित छन्।",
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
    order_confirmed: "धन्यवाद! तपाईंको अर्डर पक्का भयो।",
    order_confirmed_sub: "सामान लिएर आउँदा हाम्रा डेलिभरी साथीले तपाईंलाई फोन गर्नुहुनेछ। सामान हातमा परेपछि मात्र पैसा दिनुहोस्।",

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
  translateProvince: (provName?: string) => string;
  isNepali: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "dovan_locale";
const DYNAMIC_CACHE_KEY = "dovan_dynamic_i18n_v1";
const dynamicCache: Record<string, string> = {};
const pendingTranslate = new Set<string>();

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(DYNAMIC_CACHE_KEY);
    if (raw) Object.assign(dynamicCache, JSON.parse(raw));
  } catch {}
}

function requestAutoTranslation(text: string, onDone?: () => void) {
  if (typeof window === "undefined" || !text) return;
  const clean = text.trim();
  const lower = clean.toLowerCase();
  if (!clean || pendingTranslate.has(lower) || dynamicCache[lower]) return;

  pendingTranslate.add(lower);
  fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean }),
  })
    .then((r) => r.json())
    .then((d) => {
      const trans = d?.translation || d?.data?.translation;
      if (trans && typeof trans === "string" && trans.toLowerCase() !== lower) {
        dynamicCache[lower] = trans;
        try {
          localStorage.setItem(DYNAMIC_CACHE_KEY, JSON.stringify(dynamicCache));
        } catch {}
        if (onDone) onDone();
      }
    })
    .catch(() => {})
    .finally(() => {
      pendingTranslate.delete(lower);
    });
}

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
