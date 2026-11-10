/**
 * Content of "The life of a honey bee" (Apis mellifera): the four stages, the
 * castes, the photos and the sources. Edit texts and pictures here; the
 * components only display them.
 *
 * Durations are approximate: they change with temperature and the bee's race.
 * Sources are listed in SOURCES below.
 */

type Text = { en: string; ar: string };

export interface LifeStage {
  id: "egg" | "larva" | "pupa" | "adult";
  title: Text;
  /** Days of the worker's development covered by this stage. */
  days: Text;
  duration: Text;
  paragraphs: Text[];
  fact: Text;
  photo: {
    /** File in public/life-cycle/. */
    src: string;
    width: number;
    height: number;
    alt: Text;
    /** What exactly the picture shows (it may be another caste than the text). */
    caption: Text;
    author: string;
    license: string;
    licenseUrl: string;
    /** The picture's page on Wikimedia Commons. */
    source: string;
  };
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
const BY_SA_3 = { license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" };

export const LIFE_STAGES: LifeStage[] = [
  {
    id: "egg",
    title: { en: "The egg", ar: "البيضة" },
    days: { en: "Days 1–3", ar: "الأيام ١–٣" },
    duration: { en: "About 3 days", ar: "نحو ٣ أيام" },
    paragraphs: [
      {
        en: "The queen inspects each wax cell, then lays a single egg at the bottom. In the high season she can lay well over a thousand eggs in one day.",
        ar: "تفحص الملكة كل عين شمعية ثم تضع بيضة واحدة في قاعها. وفي ذروة الموسم يمكنها أن تضع أكثر من ألف بيضة في اليوم الواحد.",
      },
      {
        en: "The egg is white, slightly curved and about 1.5 mm long, like a tiny grain of rice. It stands upright on the first day, then leans a little more each day until it lies on the cell floor.",
        ar: "البيضة بيضاء، منحنية قليلاً وطولها نحو ١٫٥ ملم، تشبه حبة أرز صغيرة جداً. تقف منتصبة في اليوم الأول ثم تميل شيئاً فشيئاً حتى تستلقي على قاع العين.",
      },
    ],
    fact: {
      en: "A fertilised egg becomes a female (worker or queen); an unfertilised egg becomes a male (drone).",
      ar: "البيضة الملقّحة تعطي أنثى (عاملة أو ملكة)، والبيضة غير الملقّحة تعطي ذكراً.",
    },
    photo: {
      src: "/life-cycle/egg.webp",
      width: 1200,
      height: 900,
      alt: { en: "White honey bee eggs standing at the bottom of wax cells", ar: "بيوض نحل بيضاء منتصبة في قاع العيون الشمعية" },
      caption: { en: "Eggs at the bottom of the cells, seen from the side (cell walls partly removed).", ar: "بيوض في قاع العيون كما تُرى من الجانب (أُزيل جزء من جدران العيون)." },
      author: "Waugsberg",
      ...BY_SA_3,
      source: commons("Bienenwabe mit Eiern 39.jpg"),
    },
  },
  {
    id: "larva",
    title: { en: "The larva", ar: "اليرقة" },
    days: { en: "Days 4–9", ar: "الأيام ٤–٩" },
    duration: { en: "About 6 days (worker)", ar: "نحو ٦ أيام (العاملة)" },
    paragraphs: [
      {
        en: "On the third day the egg hatches into a larva: a white grub with no legs and no eyes, curled in a C at the bottom of its cell, floating on its food.",
        ar: "في اليوم الثالث تفقس البيضة وتخرج منها يرقة: دودة بيضاء بلا أرجل ولا عيون، ملتفّة على شكل حرف C في قاع العين وتطفو على غذائها.",
      },
      {
        en: "Young worker bees, the nurses, feed it hundreds of times a day. Every larva receives royal jelly for the first three days; future workers and drones then get a mix of honey and pollen, while a future queen is fed royal jelly all along.",
        ar: "تطعمها العاملات الصغيرات، أي «الحاضنات»، مئات المرات في اليوم. تتلقى كل يرقة الغذاء الملكي في الأيام الثلاثة الأولى؛ بعدها تأكل يرقات العاملات والذكور خليطاً من العسل وحبوب اللقاح، أما يرقة الملكة فتتغذى على الغذاء الملكي طوال الوقت.",
      },
      {
        en: "The larva grows very fast and sheds its skin several times, until it fills the whole cell.",
        ar: "تنمو اليرقة بسرعة كبيرة وتبدّل جلدها عدة مرات حتى تملأ العين كلها.",
      },
    ],
    fact: {
      en: "It is the food, not the egg, that decides whether a female larva becomes a worker or a queen.",
      ar: "الغذاء، لا البيضة، هو الذي يحدد إن كانت اليرقة الأنثى ستصبح عاملة أم ملكة.",
    },
    photo: {
      src: "/life-cycle/larva.webp",
      width: 1200,
      height: 900,
      alt: { en: "Curled white honey bee larvae and eggs in open wax cells", ar: "يرقات نحل بيضاء ملتفّة وبيوض في عيون شمعية مفتوحة" },
      caption: { en: "Curled larvae of different ages, with eggs in the cells below.", ar: "يرقات ملتفّة بأعمار مختلفة، وبيوض في العيون أسفلها." },
      author: "Waugsberg",
      ...BY_SA_3,
      source: commons("Bienenwabe mit Eiern und Brut 5.jpg"),
    },
  },
  {
    id: "pupa",
    title: { en: "The pupa", ar: "العذراء" },
    days: { en: "Days 10–20", ar: "الأيام ١٠–٢٠" },
    duration: { en: "About 12 days under the cap (worker)", ar: "نحو ١٢ يوماً تحت الغطاء (العاملة)" },
    paragraphs: [
      {
        en: "Around the ninth day the workers close the cell with a cap of wax that lets air through. Inside, the larva stretches out, spins a thin cocoon and becomes a pupa.",
        ar: "نحو اليوم التاسع تغلق العاملات العين بغطاء من الشمع يسمح بمرور الهواء. في الداخل تتمدد اليرقة وتنسج شرنقة رقيقة ثم تتحول إلى عذراء.",
      },
      {
        en: "The pupa no longer eats. Its body is rebuilt into an adult's: the head, the thorax and the abdomen separate, then the eyes, antennae, legs and wings take shape.",
        ar: "العذراء لا تأكل. يُعاد بناء جسمها ليصبح جسم نحلة بالغة: ينفصل الرأس عن الصدر والبطن، ثم تتكوّن العيون وقرون الاستشعار والأرجل والأجنحة.",
      },
      {
        en: "At first it is all white. The eyes colour first, from pink to purple to dark brown, then the whole body darkens.",
        ar: "تكون بيضاء كلها في البداية. تتلوّن العيون أولاً، من الوردي إلى البنفسجي ثم البني الداكن، وبعدها يغمق لون الجسم كله.",
      },
    ],
    fact: {
      en: "Beekeepers can tell the age of a pupa from the colour of its eyes.",
      ar: "يستطيع النحّال معرفة عمر العذراء من لون عينيها.",
    },
    photo: {
      src: "/life-cycle/pupa.webp",
      width: 1200,
      height: 900,
      alt: { en: "Eight honey bee pupae in a row, from all white to coloured, on a sheet of wax", ar: "ثماني عذارى نحل مصفوفة، من البيضاء تماماً إلى الملوّنة، على لوح شمع" },
      caption: { en: "Drone pupae taken out of their cells, from youngest to oldest: the eyes colour first.", ar: "عذارى ذكور أُخرجت من عيونها، من الأصغر إلى الأكبر: العيون تتلوّن أولاً." },
      author: "Waugsberg",
      ...BY_SA_3,
      source: commons("Drohnenpuppen 81b.jpg"),
    },
  },
  {
    id: "adult",
    title: { en: "The adult bee", ar: "النحلة البالغة" },
    days: { en: "Day 21", ar: "اليوم ٢١" },
    duration: { en: "A summer worker then lives about 5–6 weeks", ar: "تعيش العاملة الصيفية بعدها نحو ٥–٦ أسابيع" },
    paragraphs: [
      {
        en: "The young bee chews through the wax cap and climbs out of its cell. It is pale and soft at first; its body hardens and its hair dries within hours.",
        ar: "تقضم النحلة الصغيرة غطاء الشمع وتخرج من عينها. تكون شاحبة وطرية في البداية، ثم يتصلب جسمها ويجف شعرها خلال ساعات.",
      },
      {
        en: "A worker changes job as she ages: she first cleans cells, then nurses the larvae, builds comb, stores nectar and guards the entrance. Only in her last weeks does she fly out to gather nectar and pollen.",
        ar: "تغيّر العاملة عملها مع تقدمها في العمر: تنظف العيون أولاً، ثم تحضن اليرقات وتبني الشمع وتخزّن الرحيق وتحرس المدخل. ولا تخرج لجمع الرحيق وحبوب اللقاح إلا في أسابيعها الأخيرة.",
      },
      {
        en: "The queen is the colony's only egg-laying female and can live several years. The drones are the males: they do no work in the hive, and their role is to mate with young queens.",
        ar: "الملكة هي الأنثى الوحيدة التي تضع البيض في الخلية وقد تعيش عدة سنوات. أما الذكور فلا يعملون في الخلية، ودورهم تلقيح الملكات الصغيرات.",
      },
    ],
    fact: {
      en: "Workers born in autumn live for months instead of weeks: they carry the colony through the winter.",
      ar: "العاملات المولودات في الخريف يعشن شهوراً بدل أسابيع: هنّ من يحملن الخلية خلال الشتاء.",
    },
    photo: {
      src: "/life-cycle/adult.webp",
      width: 1200,
      height: 900,
      alt: { en: "A young honey bee pushing its head out of its wax cell", ar: "نحلة صغيرة تُخرج رأسها من عينها الشمعية" },
      caption: { en: "A drone coming out of its cell.", ar: "ذكر نحل يخرج من عينه." },
      author: "Waugsberg",
      ...BY_SA_3,
      source: commons("Schluepfender Drohn 24a.jpg"),
    },
  },
];

/** From egg to adult, by caste (approximate days). */
export const CASTES: { icon: string; name: Text; days: number; split: Text; role: Text }[] = [
  {
    icon: "👑",
    name: { en: "Queen", ar: "الملكة" },
    days: 16,
    split: { en: "egg 3 · larva 5½ · pupa 7½", ar: "بيضة ٣ · يرقة ٥٫٥ · عذراء ٧٫٥" },
    role: { en: "Lays the eggs", ar: "تضع البيض" },
  },
  {
    icon: "🐝",
    name: { en: "Worker", ar: "العاملة" },
    days: 21,
    split: { en: "egg 3 · larva 6 · pupa 12", ar: "بيضة ٣ · يرقة ٦ · عذراء ١٢" },
    role: { en: "Does all the work of the hive", ar: "تقوم بكل أعمال الخلية" },
  },
  {
    icon: "♂",
    name: { en: "Drone", ar: "الذكر" },
    days: 24,
    split: { en: "egg 3 · larva 6½ · pupa 14½", ar: "بيضة ٣ · يرقة ٦٫٥ · عذراء ١٤٫٥" },
    role: { en: "Mates with young queens", ar: "يلقّح الملكات الصغيرات" },
  },
];

export const SOURCES: { label: string; url: string }[] = [
  { label: "Bee Health (U.S. Cooperative Extension) — Biology of Individual Honey Bees", url: "https://bee-health.extension.org/biology-of-individual-honey-bees" },
  { label: "SARE — The life cycle of honey bees (PDF)", url: "https://projects.sare.org/media/pdf/T/h/e/The-life-cycle-of-honey-bees.pdf" },
  { label: "Wikipedia — Honey bee life cycle", url: "https://en.wikipedia.org/wiki/Honey_bee_life_cycle" },
];
