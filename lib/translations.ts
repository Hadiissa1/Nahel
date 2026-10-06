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
    order: { en: "Order via WhatsApp", ar: "اطلب عبر واتساب" },
    continue: { en: "Continue shopping", ar: "متابعة التسوّق" },
    orderIntro: {
      en: "Hello Nahel! I would like to order:",
      ar: "مرحباً نحّال! أرغب بطلب:",
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
    send: { en: "Send Message", ar: "إرسال الرسالة" },
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
