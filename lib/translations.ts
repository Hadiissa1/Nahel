import type { Lang, LocalizedText } from "./data";

export type { Lang, LocalizedText };

export const t = {
  brand: { en: "Nahel", ar: "نحّال" },
  tagline: {
    en: "Artisanal Honey & Beekeeping",
    ar: "عسل وأدوات نحل بصناعة حرفية",
  },

  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    honey: { en: "Honey", ar: "العسل" },
    equipment: { en: "Equipment", ar: "المعدات" },
    health: { en: "Bee Products", ar: "منتجات النحل" },
    why: { en: "Why Us", ar: "لماذا نحن" },
    pay: { en: "Payment", ar: "الدفع" },
    faq: { en: "FAQ", ar: "أسئلة" },
    offers: { en: "Offers", ar: "العروض" },
    contact: { en: "Contact", ar: "تواصل" },
  },

  hero: {
    badge: { en: "Lebanese & Egyptian Origins", ar: "أصول لبنانية ومصرية" },
    title: {
      en: "Pure Honey, Crafted by Nature",
      ar: "عسل نقي، صنعته الطبيعة",
    },
    subtitle: {
      en: "From mountain oak forests to desert Sidr trees — we bring you authentic, raw honey and professional beekeeping supplies trusted by beekeepers across the region.",
      ar: "من غابات السنديان الجبلية إلى أشجار السدر الصحراوية، نقدّم لك عسلاً خاماً أصيلاً ومعدات نحل احترافية يثق بها النحّالون في كل المنطقة.",
    },
    ctaPrimary: { en: "Explore Our Honey", ar: "اكتشف عسلنا" },
    ctaSecondary: { en: "Shop Equipment", ar: "تسوّق المعدات" },
    stat1: { en: "Honey Varieties", ar: "أنواع عسل" },
    stat2: { en: "Years of Craft", ar: "سنوات خبرة" },
    stat3: { en: "Natural & Raw", ar: "طبيعي وخام" },
  },

  honey: {
    eyebrow: { en: "The Honey Collection", ar: "تشكيلة العسل" },
    title: { en: "A Honey for Every Taste", ar: "عسل يناسب كل ذوق" },
    subtitle: {
      en: "Single-origin and wild-gathered honeys, harvested at peak season and never overheated.",
      ar: "أعسال أحادية المصدر وبرية، تُقطف في ذروة الموسم ولا تُسخّن أبداً.",
    },
  },

  equipment: {
    eyebrow: { en: "Beekeeping Equipment", ar: "معدات النحل" },
    title: { en: "Everything Your Apiary Needs", ar: "كل ما يحتاجه منحلك" },
    subtitle: {
      en: "Professional-grade hives, wax, tools and gear for hobbyists and commercial beekeepers alike.",
      ar: "قفران وشمع وأدوات ومعدات احترافية للهواة والنحّالين التجاريين على حد سواء.",
    },
  },

  health: {
    eyebrow: { en: "Bee Health Products", ar: "منتجات صحة النحل" },
    title: { en: "Nature's Wellness, From the Hive", ar: "عافية الطبيعة من قلب الخلية" },
    subtitle: {
      en: "Pollen, royal jelly, propolis and more — the hive's most powerful gifts for your health.",
      ar: "حبوب اللقاح وغذاء الملكات والعكبر وأكثر، أقوى هدايا الخلية لصحتك.",
    },
  },

  why: {
    eyebrow: { en: "Why Our Honey", ar: "لماذا عسلنا" },
    title: { en: "Honest Honey, Nothing Added", ar: "عسل صادق، بلا أي إضافات" },
    items: [
      {
        title: { en: "100% Raw & Pure", ar: "خام ونقي ١٠٠٪" },
        desc: {
          en: "No additives, no sugar feeding, no overheating — just honey as the bees made it.",
          ar: "بلا إضافات أو تغذية سكرية أو تسخين زائد، عسل كما صنعه النحل تماماً.",
        },
      },
      {
        title: { en: "Trusted Origins", ar: "مصادر موثوقة" },
        desc: {
          en: "Carefully sourced from Lebanese mountains and Egyptian valleys we know by name.",
          ar: "يُجمع بعناية من جبال لبنان ووديان مصر التي نعرفها بأسمائها.",
        },
      },
      {
        title: { en: "Beekeeper to You", ar: "من النحّال إليك" },
        desc: {
          en: "We are beekeepers first — selling the same honey and gear we use ourselves.",
          ar: "نحن نحّالون أولاً، نبيع العسل والمعدات ذاتها التي نستخدمها بأنفسنا.",
        },
      },
      {
        title: { en: "Lab-Honest Quality", ar: "جودة مضمونة" },
        desc: {
          en: "Every batch is tasted, checked and stored to keep its natural enzymes alive.",
          ar: "كل دفعة تُتذوّق وتُفحص وتُخزّن للحفاظ على إنزيماتها الطبيعية.",
        },
      },
    ],
  },

  payments: {
    eyebrow: { en: "Payment Methods", ar: "طرق الدفع" },
    title: { en: "Easy & Flexible Payment", ar: "دفع سهل ومرن" },
    subtitle: {
      en: "Pay the way that suits you — cash on delivery, bank card, or instantly with Whish Money.",
      ar: "ادفع بالطريقة التي تناسبك — نقداً عند الاستلام، ببطاقة مصرفية، أو فوراً عبر Whish Money.",
    },
    methods: [
      {
        name: { en: "Cash", ar: "نقداً" },
        desc: {
          en: "Pay with cash on delivery or at pickup — simple and secure.",
          ar: "ادفع نقداً عند الاستلام أو عند الاستلام من المتجر — بسيط وآمن.",
        },
        icon: "Cash" as const,
      },
      {
        name: { en: "Bank Card", ar: "بطاقة مصرفية" },
        desc: {
          en: "Visa & Mastercard accepted for a fast, secure checkout.",
          ar: "نقبل فيزا وماستركارد لعملية دفع سريعة وآمنة.",
        },
        icon: "Card" as const,
      },
      {
        name: { en: "Whish Money", ar: "ويش موني" },
        desc: {
          en: "Send your payment instantly through the Whish Money app.",
          ar: "أرسل دفعتك فوراً عبر تطبيق Whish Money.",
        },
        icon: "Wallet" as const,
      },
    ],
    secure: {
      en: "All transactions are handled securely.",
      ar: "تتم جميع المعاملات بشكل آمن.",
    },
  },

  shop: {
    eyebrow: { en: "Our Shop", ar: "متجرنا" },
    title: { en: "Honey, Hive Products & Equipment", ar: "عسل ومنتجات الخلية والمعدات" },
    subtitle: {
      en: "Search the full catalog or filter by category, then add what you need to your cart.",
      ar: "ابحث في الكتالوج الكامل أو صفِّ حسب الفئة، ثم أضف ما تحتاجه إلى السلة.",
    },
    all: { en: "All", ar: "الكل" },
    search: { en: "Search products…", ar: "ابحث عن منتج…" },
    noResults: { en: "No products match your search.", ar: "لا توجد منتجات مطابقة لبحثك." },
    results: { en: "products", ar: "منتج" },
    weight: { en: "Size", ar: "الحجم" },
    view: { en: "View product", ar: "عرض المنتج" },
    close: { en: "Close", ar: "إغلاق" },
    outOfStock: { en: "Out of stock", ar: "نفد من المخزون" },
    fullPage: { en: "Open product page", ar: "فتح صفحة المنتج" },
    backToShop: { en: "Shop", ar: "المتجر" },
    share: { en: "Share", ar: "مشاركة" },
    shareWhatsapp: { en: "WhatsApp", ar: "واتساب" },
    shareFacebook: { en: "Facebook", ar: "فيسبوك" },
    copyLink: { en: "Copy link", ar: "نسخ الرابط" },
    copied: { en: "Link copied!", ar: "تم نسخ الرابط!" },
    related: { en: "You may also like", ar: "قد يعجبك أيضاً" },
    onlyLeft: { en: "Only {n} left", ar: "بقي {n} فقط" },
    wasPrice: { en: "Was", ar: "كان" },
    saleBadge: { en: "{n}% off", ar: "خصم {n}%" },
  },

  trust: [
    {
      title: { en: "Direct from the beekeeper", ar: "مباشرة من النحّال" },
      desc: { en: "No middlemen, known origins", ar: "بدون وسطاء ومصادر معروفة" },
    },
    {
      title: { en: "Raw & unheated", ar: "خام وغير مسخّن" },
      desc: { en: "Natural enzymes preserved", ar: "إنزيمات طبيعية محفوظة" },
    },
    {
      title: { en: "Cash · Card · Whish Money", ar: "نقداً · بطاقة · ويش موني" },
      desc: { en: "Pay the way you prefer", ar: "ادفع بالطريقة التي تفضّلها" },
    },
    {
      title: { en: "Order on WhatsApp", ar: "اطلب عبر واتساب" },
      desc: { en: "A real person replies", ar: "يرد عليك شخص حقيقي" },
    },
  ],

  faq: {
    eyebrow: { en: "FAQ", ar: "الأسئلة الشائعة" },
    title: { en: "Questions About Our Honey", ar: "أسئلة حول عسلنا" },
    items: [
      {
        q: { en: "My honey has crystallized. Is it still good?", ar: "تبلور العسل لديّ، هل ما زال صالحاً؟" },
        a: {
          en: "Yes. Crystallization is natural for raw honey and is a sign it hasn't been over-processed. To make it liquid again, warm the jar gently in a water bath below 40 °C.",
          ar: "نعم. التبلور طبيعي في العسل الخام ودليل على أنه لم يُعالَج بشكل مفرط. لإعادته سائلاً، سخّن البرطمان بلطف في حمّام مائي دون 40 درجة مئوية.",
        },
      },
      {
        q: { en: "How should I store honey?", ar: "كيف أحفظ العسل؟" },
        a: {
          en: "Keep it in a closed jar at room temperature, away from sunlight and moisture. There's no need to refrigerate it.",
          ar: "احفظه في برطمان مغلق بدرجة حرارة الغرفة، بعيداً عن الشمس والرطوبة. لا حاجة لوضعه في الثلاجة.",
        },
      },
      {
        q: { en: "How do I place an order?", ar: "كيف أطلب؟" },
        a: {
          en: "Add products to your cart and tap “Order via WhatsApp”. Your order is sent as a message and we confirm availability, price and delivery with you.",
          ar: "أضف المنتجات إلى السلة واضغط «اطلب عبر واتساب». يُرسَل طلبك كرسالة ونؤكد معك التوفر والسعر والتوصيل.",
        },
      },
      {
        q: { en: "Do you deliver?", ar: "هل توصلون الطلبات؟" },
        a: {
          en: "Yes, contact us with your location and we'll confirm the delivery options and cost for your area.",
          ar: "نعم، تواصل معنا مع موقعك وسنؤكد لك خيارات التوصيل وتكلفتها في منطقتك.",
        },
      },
      {
        q: { en: "Do you sell to beekeepers and shops in bulk?", ar: "هل تبيعون بالجملة للنحّالين والمحلات؟" },
        a: {
          en: "Yes. For hives, extractors, wax and honey barrels in larger quantities, send us your list on WhatsApp and we'll prepare a quote.",
          ar: "نعم. للقفران والفرّازات والشمع وبراميل العسل بكميات كبيرة، أرسل لنا قائمتك عبر واتساب وسنجهّز لك عرض سعر.",
        },
      },
    ],
  },

  offers: {
    eyebrow: { en: "Offers & Sales", ar: "العروض والتخفيضات" },
    title: { en: "Be the First to Know", ar: "كن أول من يعلم" },
    subtitle: {
      en: "Get our promotions, new harvests and seasonal sales by email or WhatsApp.",
      ar: "تصلك عروضنا والقطاف الجديد والتخفيضات الموسمية عبر البريد الإلكتروني أو واتساب.",
    },
    email: { en: "Email", ar: "البريد الإلكتروني" },
    whatsapp: { en: "WhatsApp number", ar: "رقم واتساب" },
    whatsappHint: { en: "With country code, e.g. +961 70 123 456", ar: "مع رمز البلد، مثلاً ‎+961 70 123 456" },
    oneOf: { en: "Fill in at least one of the two.", ar: "املأ واحداً منهما على الأقل." },
    consent: {
      en: "I agree to receive Nahel offers. I can unsubscribe at any time.",
      ar: "أوافق على تلقي عروض نحّال، ويمكنني إلغاء الاشتراك في أي وقت.",
    },
    privacy: {
      en: "We only use your email or number to send offers, and never share them.",
      ar: "نستخدم بريدك أو رقمك فقط لإرسال العروض، ولا نشاركه مع أحد.",
    },
    submit: { en: "Subscribe", ar: "اشترك" },
    check_inbox: {
      en: "Almost done! Check your inbox and tap the link to confirm.",
      ar: "تبقّت خطوة! افتح بريدك واضغط على الرابط للتأكيد.",
    },
    subscribed: { en: "Thank you! You're subscribed.", ar: "شكراً! تم اشتراكك." },
    need_contact: { en: "Enter an email or a WhatsApp number.", ar: "أدخل بريداً إلكترونياً أو رقم واتساب." },
    invalid_email: { en: "This email address isn't valid.", ar: "البريد الإلكتروني غير صالح." },
    invalid_whatsapp: { en: "This number isn't valid.", ar: "الرقم غير صالح." },
    consent_error: { en: "Please tick the box to agree.", ar: "يرجى تحديد مربع الموافقة." },
    rate: { en: "Too many attempts. Please try again later.", ar: "محاولات كثيرة. حاول لاحقاً." },
    confirmTitle: { en: "Confirm your subscription", ar: "تأكيد الاشتراك" },
    confirmButton: { en: "Confirm", ar: "تأكيد" },
    confirmed: { en: "Your subscription is confirmed. Thank you!", ar: "تم تأكيد اشتراكك. شكراً لك!" },
    unsubTitle: { en: "Unsubscribe", ar: "إلغاء الاشتراك" },
    unsubText: {
      en: "You will no longer receive our offers, and your details will be deleted.",
      ar: "لن تصلك عروضنا بعد الآن، وستُحذف بياناتك.",
    },
    unsubButton: { en: "Unsubscribe", ar: "إلغاء الاشتراك" },
    unsubscribed: { en: "You're unsubscribed. Your details were deleted.", ar: "تم إلغاء اشتراكك وحذف بياناتك." },
    invalidLink: {
      en: "This link is invalid or was already used.",
      ar: "هذا الرابط غير صالح أو تم استخدامه من قبل.",
    },
    backToShop: { en: "Back to the shop", ar: "العودة إلى المتجر" },
  },

  cart: {
    title: { en: "Your Cart", ar: "سلة المشتريات" },
    empty: { en: "Your cart is empty.", ar: "سلة المشتريات فارغة." },
    emptyHint: {
      en: "Browse our honey and equipment to add items.",
      ar: "تصفّح العسل والمعدات لإضافة منتجات.",
    },
    add: { en: "Add to cart", ar: "أضف إلى السلة" },
    remove: { en: "Remove", ar: "إزالة" },
    clear: { en: "Clear cart", ar: "إفراغ السلة" },
    items: { en: "items", ar: "منتجات" },
    item: { en: "item", ar: "منتج" },
    total: { en: "Total", ar: "الإجمالي" },
    priceOnRequest: { en: "Price on request", ar: "السعر عند الطلب" },
    order: { en: "Order", ar: "اطلب" },
    continue: { en: "Continue shopping", ar: "متابعة التسوّق" },
    checkout: { en: "Continue to order", ar: "متابعة الطلب" },
    back: { en: "Back to cart", ar: "العودة إلى السلة" },
    yourDetails: { en: "Your details", ar: "بياناتك" },
    name: { en: "Full name", ar: "الاسم الكامل" },
    phone: { en: "Phone / WhatsApp", ar: "الهاتف / واتساب" },
    phoneHint: { en: "With country code, e.g. +961 70 123 456", ar: "مع رمز البلد، مثلاً ‎+961 70 123 456" },
    address: { en: "Delivery address (optional)", ar: "عنوان التوصيل (اختياري)" },
    note: { en: "Note (optional)", ar: "ملاحظة (اختياري)" },
    placeOrder: { en: "Place order", ar: "تأكيد الطلب" },
    placing: { en: "Recording your order…", ar: "جارٍ تسجيل طلبك…" },
    privacy: {
      en: "Your details are only used to prepare and deliver your order.",
      ar: "تُستخدم بياناتك فقط لتحضير طلبك وتوصيله.",
    },
    doneTitle: { en: "Order no. {n} recorded", ar: "تم تسجيل الطلب رقم {n}" },
    doneText: {
      en: "Last step: send it to us on WhatsApp so we can confirm availability, price and delivery.",
      ar: "الخطوة الأخيرة: أرسله لنا عبر واتساب لنؤكد معك التوفر والسعر والتوصيل.",
    },
    sendWhatsapp: { en: "Send on WhatsApp", ar: "أرسل عبر واتساب" },
    newOrder: { en: "Continue shopping", ar: "متابعة التسوّق" },
    err_name: { en: "Please enter your name.", ar: "يرجى إدخال اسمك." },
    err_phone: { en: "Please enter a valid phone number with country code.", ar: "يرجى إدخال رقم هاتف صالح مع رمز البلد." },
    err_too_long: { en: "Some text is too long.", ar: "بعض النص طويل جداً." },
    err_empty: { en: "Your cart is empty.", ar: "سلة المشتريات فارغة." },
    err_unavailable: {
      en: "Some items are no longer available in this quantity:",
      ar: "بعض المنتجات لم تعد متوفرة بهذه الكمية:",
    },
    err_rate: { en: "Too many orders. Please try again later.", ar: "طلبات كثيرة. حاول لاحقاً." },
    available: { en: "available: {n}", ar: "المتوفر: {n}" },
    subtotal: { en: "Subtotal", ar: "المجموع" },
    promo: { en: "Promo code", ar: "كود الخصم" },
    promoApply: { en: "Apply", ar: "تطبيق" },
    promoRemove: { en: "Remove code", ar: "إزالة الكود" },
    promoApplied: { en: "Code {c}", ar: "الكود {c}" },
    promoPercent: { en: "{n}% off", ar: "خصم {n}%" },
    promo_not_found: { en: "This code doesn't exist.", ar: "هذا الكود غير موجود." },
    promo_expired: { en: "This code has expired.", ar: "انتهت صلاحية هذا الكود." },
    promo_used_up: { en: "This code is no longer available.", ar: "هذا الكود لم يعد متاحاً." },
    promo_min_total: { en: "This code applies from {p} of purchases.", ar: "يُطبَّق هذا الكود ابتداءً من {p} من المشتريات." },
    promo_needs_prices: {
      en: "This code can't apply while some items are priced on request.",
      ar: "لا يمكن تطبيق الكود ما دامت بعض المنتجات سعرها عند الطلب.",
    },
    promo_rate: { en: "Too many tries. Please wait a few minutes.", ar: "محاولات كثيرة. انتظر بضع دقائق." },
    err_promo: {
      en: "Your promo code can no longer be used. Remove it to order:",
      ar: "لم يعد بالإمكان استخدام كود الخصم. أزِله لإتمام الطلب:",
    },
  },

  testimonials: {
    eyebrow: { en: "Testimonials", ar: "آراء العملاء" },
    title: { en: "Loved by Families & Beekeepers", ar: "محبوب من العائلات والنحّالين" },
    items: [
      {
        quote: {
          en: "The Sidr honey is unlike anything from the supermarket — rich, thick and clearly real.",
          ar: "عسل السدر لا يشبه أي شيء من السوبرماركت، غني وكثيف وحقيقي بوضوح.",
        },
        name: { en: "Rana K.", ar: "رنا ك." },
        role: { en: "Home Customer", ar: "زبونة منزلية" },
      },
      {
        quote: {
          en: "I equipped my whole apiary here. Solid hives, fair prices and real advice.",
          ar: "جهّزت منحلي بالكامل من هنا. قفران متينة وأسعار عادلة ونصائح حقيقية.",
        },
        name: { en: "Abu Hassan", ar: "أبو حسن" },
        role: { en: "Commercial Beekeeper", ar: "نحّال تجاري" },
      },
      {
        quote: {
          en: "The royal jelly and pollen became part of my family's daily routine. Excellent quality.",
          ar: "أصبح غذاء الملكات وحبوب اللقاح جزءاً من روتين عائلتي اليومي. جودة ممتازة.",
        },
        name: { en: "Mariam S.", ar: "مريم س." },
        role: { en: "Wellness Customer", ar: "زبونة عافية" },
      },
    ],
  },

  contact: {
    eyebrow: { en: "Get in Touch", ar: "تواصل معنا" },
    title: { en: "Order or Ask Us Anything", ar: "اطلب أو اسألنا عن أي شيء" },
    subtitle: {
      en: "Tell us what you're looking for — honey, equipment or bee products — and we'll get back to you.",
      ar: "أخبرنا بما تبحث عنه — عسل أو معدات أو منتجات نحل — وسنعاود التواصل معك.",
    },
    name: { en: "Your Name", ar: "اسمك" },
    phone: { en: "Phone / WhatsApp", ar: "الهاتف / واتساب" },
    message: { en: "Your Message", ar: "رسالتك" },
    send: { en: "Send via WhatsApp", ar: "أرسل عبر واتساب" },
    sendNote: {
      en: "Your message opens in WhatsApp, ready to send.",
      ar: "تُفتح رسالتك في واتساب جاهزة للإرسال.",
    },
    callUs: { en: "Call / WhatsApp", ar: "اتصل / واتساب" },
    emailUs: { en: "Email", ar: "البريد الإلكتروني" },
    visit: { en: "Find Us", ar: "موقعنا" },
    address: { en: "Lebanon & Egypt — Shipping Across the Region", ar: "لبنان ومصر — شحن إلى كل المنطقة" },
  },

  footer: {
    about: {
      en: "Authentic Lebanese and Egyptian honey and professional beekeeping supplies, crafted with care and delivered with trust.",
      ar: "عسل لبناني ومصري أصيل ومعدات نحل احترافية، بصناعة دقيقة وتسليم موثوق.",
    },
    quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
    products: { en: "Products", ar: "المنتجات" },
    follow: { en: "Follow Us", ar: "تابعنا" },
    rights: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  },

  common: {
    inquire: { en: "Inquire", ar: "استفسر" },
    viewAll: { en: "View All", ar: "عرض الكل" },
  },
} as const;

export function pick(text: LocalizedText, lang: Lang): string {
  return text[lang];
}
