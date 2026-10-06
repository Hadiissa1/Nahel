export type Lang = "en" | "ar";

export type LocalizedText = Record<Lang, string>;

export interface Product {
  id: string;
  name: LocalizedText;
  origin: LocalizedText;
  desc: LocalizedText;
  price?: number; // optional — set a number to show prices & cart totals
}

export const CURRENCY: LocalizedText = { en: "$", ar: "$" };

/* ------------------------------------------------------------------ */
/*  Honey Collection                                                   */
/* ------------------------------------------------------------------ */
export const honeyProducts: Product[] = [
  {
    id: "oak",
    name: { en: "Lebanese Oak Honey", ar: "عسل سنديان لبناني" },
    origin: { en: "Lebanon", ar: "لبنان" },
    desc: {
      en: "Dark, robust honey from mountain oak forests — deep and mineral-rich.",
      ar: "عسل داكن وغني من غابات السنديان الجبلية، عميق النكهة وغني بالمعادن.",
    },
  },
  {
    id: "lemon",
    name: { en: "Lemon Blossom Honey", ar: "عسل ليمون" },
    origin: { en: "Citrus Groves", ar: "بساتين الحمضيات" },
    desc: {
      en: "Bright and floral with a delicate citrus aroma from blooming orchards.",
      ar: "عسل عطري ومنعش برائحة الحمضيات اللطيفة من البساتين المزهرة.",
    },
  },
  {
    id: "eucalyptus",
    name: { en: "Eucalyptus Honey", ar: "عسل كينا" },
    origin: { en: "Eucalyptus Forests", ar: "غابات الكينا" },
    desc: {
      en: "Amber honey with a soothing, herbal note — a classic wellness favorite.",
      ar: "عسل بلون العنبر بنكهة عشبية مهدئة، الخيار المفضل للعافية.",
    },
  },
  {
    id: "jardi",
    name: { en: "Lebanese Highland Wildflower", ar: "عسل جردي لبناني" },
    origin: { en: "Lebanese Highlands", ar: "الجرود اللبنانية" },
    desc: {
      en: "Multi-floral honey gathered from wild mountain meadows above the clouds.",
      ar: "عسل متعدد الأزهار يُجمع من مروج الجبال البرية فوق الغيوم.",
    },
  },
  {
    id: "baraka",
    name: { en: "Egyptian Baraka Honey", ar: "عسل بركة مصري" },
    origin: { en: "Egypt", ar: "مصر" },
    desc: {
      en: "Black seed (Nigella) honey — earthy, warming and prized for its richness.",
      ar: "عسل الحبة السوداء، ترابي ودافئ ومرغوب لقيمته الغذائية العالية.",
    },
  },
  {
    id: "sidr-egy",
    name: { en: "Egyptian Sidr Honey", ar: "عسل سدر مصري" },
    origin: { en: "Egypt", ar: "مصر" },
    desc: {
      en: "Rare Sidr (lote tree) honey with a luxurious caramel-toffee depth.",
      ar: "عسل السدر النادر بعمق فاخر من الكراميل والنكهة الغنية.",
    },
  },
  {
    id: "sidr-kashmir",
    name: { en: "Kashmiri Sidr Honey", ar: "عسل سدر كشميري" },
    origin: { en: "Kashmir", ar: "كشمير" },
    desc: {
      en: "Premium Himalayan Sidr — thick, golden and intensely aromatic.",
      ar: "عسل سدر الهيمالايا الفاخر، كثيف وذهبي وعطري بشكل مكثف.",
    },
  },
  {
    id: "clover",
    name: { en: "Egyptian Clover Honey", ar: "عسل برسيم مصري" },
    origin: { en: "Egypt", ar: "مصر" },
    desc: {
      en: "Light, smooth and mild — the everyday honey loved by the whole family.",
      ar: "عسل فاتح وناعم وخفيف، المفضل اليومي للعائلة بأكملها.",
    },
  },
  {
    id: "thyme",
    name: { en: "Egyptian Thyme Honey", ar: "عسل زعتر مصري" },
    origin: { en: "Egypt", ar: "مصر" },
    desc: {
      en: "Aromatic wild thyme honey with a bold herbal character.",
      ar: "عسل الزعتر البري العطري بطابع عشبي قوي ومميز.",
    },
  },
  {
    id: "comb",
    name: { en: "Honey with Comb", ar: "عسل بشهدو" },
    origin: { en: "Pure Comb", ar: "شهد طبيعي" },
    desc: {
      en: "Raw honey served straight in the natural honeycomb — pure and unfiltered.",
      ar: "عسل خام يُقدّم مباشرة في شمعه الطبيعي، نقي وغير مصفّى.",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Bee Health Products                                                 */
/* ------------------------------------------------------------------ */
export const healthProducts: Product[] = [
  {
    id: "pollen",
    name: { en: "Bee Pollen", ar: "حبوب لقاح" },
    origin: { en: "Natural Superfood", ar: "غذاء خارق طبيعي" },
    desc: {
      en: "Nutrient-dense golden granules packed with protein and vitamins.",
      ar: "حبيبات ذهبية غنية بالبروتين والفيتامينات.",
    },
  },
  {
    id: "royal-jelly",
    name: { en: "Lebanese Royal Jelly", ar: "غذاء ملكات لبناني" },
    origin: { en: "Lebanon", ar: "لبنان" },
    desc: {
      en: "Fresh royal jelly — the queen bee's secret to vitality and strength.",
      ar: "غذاء ملكات طازج، سرّ ملكة النحل للحيوية والقوة.",
    },
  },
  {
    id: "ginseng",
    name: { en: "Korean Ginseng", ar: "جينسج كوري" },
    origin: { en: "Korea", ar: "كوريا" },
    desc: {
      en: "Premium ginseng root, often blended with honey for a daily energy boost.",
      ar: "جذر الجينسنغ الفاخر، يُمزج غالباً مع العسل لطاقة يومية.",
    },
  },
  {
    id: "propolis-local",
    name: { en: "Local Propolis", ar: "عكبر بلدي" },
    origin: { en: "Local Apiaries", ar: "مناحل محلية" },
    desc: {
      en: "Natural bee resin known for its protective, immune-supporting properties.",
      ar: "راتنج النحل الطبيعي المعروف بخصائصه الواقية والداعمة للمناعة.",
    },
  },
  {
    id: "propolis-import",
    name: { en: "Imported Propolis", ar: "عكبر أجنبي" },
    origin: { en: "Imported", ar: "مستورد" },
    desc: {
      en: "High-grade imported propolis for premium supplement blends.",
      ar: "عكبر مستورد عالي الجودة لخلطات المكملات الفاخرة.",
    },
  },
  {
    id: "palm-pollen",
    name: { en: "Palm Pollen (Talh)", ar: "طلح نخيل" },
    origin: { en: "Date Palms", ar: "نخيل التمر" },
    desc: {
      en: "Traditional date-palm pollen valued as a natural tonic.",
      ar: "طلع النخيل التقليدي المقدّر كمنشّط طبيعي.",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Beekeeping Equipment                                                */
/* ------------------------------------------------------------------ */
export const equipmentProducts: Product[] = [
  {
    id: "foundation-wax",
    name: { en: "Foundation Wax", ar: "شمع أساس" },
    origin: { en: "Local · Chinese · Egyptian", ar: "بلدي · صيني · مصري" },
    desc: {
      en: "Pure beeswax foundation sheets in local, Chinese and Egyptian grades.",
      ar: "ألواح شمع أساس نقية بأنواع بلدي وصيني ومصري.",
    },
  },
  {
    id: "drawn-wax",
    name: { en: "Drawn Comb Wax", ar: "شمع ممطوط بلدي" },
    origin: { en: "Local", ar: "بلدي" },
    desc: {
      en: "Ready drawn-out comb to give your colonies a strong head start.",
      ar: "شمع ممطوط جاهز يمنح خلاياك انطلاقة قوية.",
    },
  },
  {
    id: "hives",
    name: { en: "Empty Beehives", ar: "قفران نحل فارغة" },
    origin: { en: "All Sizes", ar: "كل المقاسات" },
    desc: {
      en: "Sturdy empty hive boxes ready to house new and growing colonies.",
      ar: "صناديق قفران متينة جاهزة لإيواء الخلايا الجديدة والنامية.",
    },
  },
  {
    id: "frames",
    name: { en: "Frames", ar: "براويز" },
    origin: { en: "Standard Fit", ar: "مقاس قياسي" },
    desc: {
      en: "Durable wooden frames built to standard hive dimensions.",
      ar: "براويز خشبية متينة بمقاسات القفران القياسية.",
    },
  },
  {
    id: "supers",
    name: { en: "Bee Supers", ar: "طبقات للنحل" },
    origin: { en: "Modular", ar: "قابلة للتركيب" },
    desc: {
      en: "Stackable supers to expand your hives during the honey flow.",
      ar: "طبقات قابلة للتكديس لتوسيع خلاياك خلال موسم العسل.",
    },
  },
  {
    id: "barrels",
    name: { en: "Honey Barrels", ar: "براميل للعسل" },
    origin: { en: "All Sizes", ar: "كل المقاسات" },
    desc: {
      en: "Food-grade storage barrels for honey in every size you need.",
      ar: "براميل تخزين عسل بمعايير غذائية وبكل المقاسات.",
    },
  },
  {
    id: "pollen-traps",
    name: { en: "Pollen Traps", ar: "مصائد حبوب لقاح" },
    origin: { en: "Turkish · Local", ar: "تركي · بلدي" },
    desc: {
      en: "Efficient pollen traps in both Turkish and local designs.",
      ar: "مصائد حبوب لقاح فعّالة بتصميمين تركي وبلدي.",
    },
  },
  {
    id: "extractors",
    name: { en: "Honey Extractors", ar: "فرّازات للعسل" },
    origin: { en: "All Sizes", ar: "كل المقاسات" },
    desc: {
      en: "Manual and powered extractors to spin honey cleanly from the comb.",
      ar: "فرّازات يدوية وكهربائية لاستخلاص العسل من الشمع بنظافة.",
    },
  },
  {
    id: "suits",
    name: { en: "Suits & Gloves", ar: "بدلات وقفازات" },
    origin: { en: "Protective Gear", ar: "معدات حماية" },
    desc: {
      en: "Complete beekeeper suits and gloves for safe, comfortable work.",
      ar: "بدلات نحّال كاملة وقفازات لعمل آمن ومريح.",
    },
  },
  {
    id: "candy",
    name: { en: "Bee Candy / Fondant", ar: "كاندي وعجينة للنحل" },
    origin: { en: "Bee Feed", ar: "تغذية النحل" },
    desc: {
      en: "Energy-rich candy and fondant to feed colonies through lean seasons.",
      ar: "كاندي وعجينة غنية بالطاقة لتغذية الخلايا في المواسم الشحيحة.",
    },
  },
  {
    id: "bees",
    name: { en: "Local Bees for Sale", ar: "نحل بلدي للبيع" },
    origin: { en: "Live Colonies", ar: "خلايا حية" },
    desc: {
      en: "Healthy local bee colonies ready to start or grow your apiary.",
      ar: "خلايا نحل بلدي سليمة جاهزة لبدء منحلك أو توسيعه.",
    },
  },
];
