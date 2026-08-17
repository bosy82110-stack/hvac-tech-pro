export type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  accent: string;
};

export type HvacDeviceType = "سبليت" | "مركزي" | "VRF" | "غرف تبريد" | "كونسيلد";

export type CustomDiagnosis = {
  id: string;
  type: HvacDeviceType;
  problem: string;
  solution: string;
  createdAt: number;
};

export type ManagedBrand = {
  id: string;
  name: string;
  local: string;
  models: string[];
};

export type CustomMaterial = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  size: string;
  createdAt: number;
};

export const materialCategories = [
  "قطعة",
  "عود",
  "متر",
  "لفة",
  "رول",
  "كيلو",
  "جرام",
  "لتر",
  "عبوة",
  "علبة",
  "كرتونة",
  "طقم",
  "متر مربع",
  "ورقة",
  "شريحة",
  "جركن",
  "أسطوانة",
  "بكرة",
];

export type CustomErrorCode = {
  id: string;
  type: HvacDeviceType;
  code: string;
  brand: string;
  model: string;
  models?: string[];
  drive: "عادي" | "إنفرتر";
  roomReceiverCode?: string;
  deviceReceiverCode?: string;
  problem: string;
  solution: string;
  createdAt: number;
};

export const brands: ManagedBrand[] = [
  { id: "carrier", name: "Carrier", local: "كاريير", models: [] },
  { id: "daikin", name: "Daikin", local: "دايكن", models: [] },
  { id: "lg", name: "LG", local: "إل جي", models: [] },
  { id: "midea", name: "Midea", local: "ميديا", models: [] },
  { id: "gree", name: "Gree", local: "جري", models: [] },
  { id: "tornado", name: "Tornado", local: "تورنيدو", models: [] },
];

export const errorCodes = [
  {
    id: "e6",
    code: "E6",
    type: "سبليت",
    brand: "Carrier",
    model: "عام",
    drive: "إنفرتر",
    title: "اتصال غير طبيعي بين الوحدتين",
    english: "Indoor / outdoor communication fault",
    cause: "خلل في كابل الاتصال أو لوحة التحكم أو التغذية.",
    steps: [
      "افصل الكهرباء وانتظر 3 دقائق.",
      "افحص كابل الاتصال والأطراف.",
      "قِس الجهد بين الوحدتين حسب مخطط الموديل.",
    ],
    part: "PCB / كابل اتصال",
  },
  {
    id: "p4",
    code: "P4",
    type: "مركزي",
    brand: "Midea",
    model: "عام",
    drive: "عادي",
    title: "حماية حرارة طرد الضاغط",
    english: "Compressor discharge temperature protection",
    cause: "ارتفاع حرارة الطرد بسبب شحنة غير مناسبة أو ضعف التهوية.",
    steps: [
      "افحص نظافة المكثف وتدفق الهواء.",
      "قِس ضغط السحب والطرد.",
      "قارن القراءة بمواصفات الموديل والفريون.",
    ],
    part: "حساس حرارة / مكثف",
  },
  {
    id: "u4",
    code: "U4",
    type: "VRF",
    brand: "Daikin",
    model: "عام",
    drive: "إنفرتر",
    title: "خطأ اتصال بين الوحدات",
    english: "Communication malfunction",
    cause: "انقطاع اتصال أو مشكلة في مصدر التغذية.",
    steps: [
      "تحقق من القاطع والتغذية.",
      "افحص التوصيلات والقطبية.",
      "راجع كود الموديل في الدليل الفني.",
    ],
    part: "PCB / Terminal",
  },
  {
    id: "ch10",
    code: "CH10",
    type: "غرف تبريد",
    brand: "LG",
    model: "عام",
    drive: "عادي",
    title: "حماية محرك المروحة الداخلية",
    english: "Indoor fan motor protection",
    cause: "مشكلة في المحرك أو حساس السرعة أو لوحة التحكم.",
    steps: [
      "افحص دوران المروحة يدويًا بعد فصل الكهرباء.",
      "افحص الفيشة والحساس.",
      "قِس الجهد حسب دليل الخدمة.",
    ],
    part: "Fan Motor / Sensor",
  },
];

export type RefrigerantReference = {
  id: string;
  name: string;
  use: string;
  oil: string;
  note: string;
  gwp: number;
  odp: number;
  ashraeClass: string;
  compatibilityWarning: string;
  charging?: string;
  compositionType?: string;
  composition?: string;
  cylinderColor?: string;
  cylinderColorHex?: string;
};

export const refrigerants: RefrigerantReference[] = [
  {
    id: "r32",
    name: "R32",
    use: "أجهزة سبليت حديثة",
    oil: "POE",
    note: "قابل للاشتعال بدرجة منخفضة؛ اتبع إجراءات السلامة ومواصفات الشركة.",
    gwp: 675,
    odp: 0,
    ashraeClass: "A2L",
    compatibilityWarning:
      "لا تستبدله أو تخلطه دون اعتماد الجهاز؛ تحقق من زيت وضاغط النظام.",
    cylinderColor: "أزرق مخضر فاتح",
    cylinderColorHex: "#7CC9B5",
  },
  {
    id: "r410a",
    name: "R410A",
    use: "تكييف سبليت وإنفرتر",
    oil: "POE",
    note: "يعمل بضغط أعلى من R22؛ لا تعتمد على قيمة ضغط ثابتة.",
    gwp: 2088,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "استخدمه فقط في نظام مصمم له وبزيت POE المحدد من الشركة.",
    cylinderColor: "وردي",
    cylinderColorHex: "#F472B6",
  },
  {
    id: "r22",
    name: "R22",
    use: "أجهزة قديمة وتطبيقات تبريد",
    oil: "Mineral / حسب الضاغط",
    note: "تحقق من الأنظمة المحلية ومواصفات الجهاز قبل الخدمة.",
    gwp: 1810,
    odp: 0.055,
    ashraeClass: "A1",
    compatibilityWarning:
      "فريون HCFC مقيد في دول كثيرة؛ لا تُجرِ تحويلًا أو شحنًا قبل مراجعة اللوحة والدليل.",
    cylinderColor: "أخضر فاتح",
    cylinderColorHex: "#B7D77A",
  },
  {
    id: "r134a",
    name: "R134a",
    use: "ثلاجات وتطبيقات تبريد",
    oil: "POE أو حسب الضاغط",
    note: "الضغط يتغير مع درجة الحرارة والحمل وظروف التشغيل.",
    gwp: 1430,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "تحقق من نوع الزيت وملصق الضاغط؛ لا تستخدمه كبديل مباشر لفريون آخر.",
    cylinderColor: "أزرق سماوي فاتح",
    cylinderColorHex: "#8BC7E8",
  },
  {
    id: "r404a",
    name: "R404A",
    use: "تبريد تجاري ودرجات حرارة منخفضة",
    oil: "POE",
    note: "خليط؛ اشحنه بالحالة السائلة واتبع مواصفات الشركة.",
    gwp: 3922,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "خليط؛ اشحنه سائلًا وبالوزن في نظام معتمد، ولا تخلطه مع فريون آخر.",
    cylinderColor: "برتقالي ساطع",
    cylinderColorHex: "#F28C28",
  },
  {
    id: "r407c",
    name: "R407C",
    use: "تكييف ومضخات حرارية واستبدال بعض تطبيقات R22",
    oil: "POE",
    note: "خليط زيوتروبي؛ راعِ الانزلاق الحراري وإجراءات الشحن الصحيحة.",
    gwp: 1774,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "يتطلب زيت POE وتحققًا من الانزلاق الحراري وإجراءات الشركة عند التحويل.",
    cylinderColor: "بني",
    cylinderColorHex: "#B66A3C",
  },
  {
    id: "r407a",
    name: "R407A",
    use: "تبريد تجاري متوسط ومنخفض الحرارة",
    oil: "POE",
    note: "خليط؛ لا تخلطه مع فريون آخر وتحقق من توافق الضاغط.",
    gwp: 2107,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "ليس بديلًا عامًا؛ راجع توافق الضاغط والصمامات والزيت قبل الشحن.",
    cylinderColor: "أخضر ليموني",
    cylinderColorHex: "#B7D334",
  },
  {
    id: "r507a",
    name: "R507A",
    use: "تبريد تجاري منخفض الحرارة",
    oil: "POE",
    note: "خليط أزيوتروبي؛ استخدمه فقط في الأنظمة المعتمدة له.",
    gwp: 3985,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "استخدمه في نظام معتمد له وبزيت POE المناسب، ولا تخلطه مع فريون آخر.",
    cylinderColor: "أزرق مخضر",
    cylinderColorHex: "#2E8F8F",
  },
  {
    id: "r290",
    name: "R290",
    use: "تبريد وتكييف بأنظمة مصممة للبروبان",
    oil: "POE أو حسب الضاغط",
    note: "A3 عالي القابلية للاشتعال؛ لا يُستخدم إلا في جهاز معتمد وإجراءات أمان مناسبة.",
    gwp: 3.3,
    odp: 0,
    ashraeClass: "A3",
    compatibilityWarning:
      "قابل للاشتعال بدرجة عالية؛ لا تستخدمه إلا في جهاز وضاغط ومعدات معتمدة للبروبان.",
    cylinderColor: "رمادي فاتح مع شريط أحمر",
    cylinderColorHex: "#C7D2C4",
  },
  {
    id: "r600a",
    name: "R600a",
    use: "ثلاجات منزلية وتطبيقات تبريد صغيرة",
    oil: "زيت مخصص حسب الضاغط",
    note: "A3 قابل للاشتعال؛ الشحنة بالجرام وبحسب لوحة الجهاز فقط.",
    gwp: 1,
    odp: 0,
    ashraeClass: "A3",
    compatibilityWarning:
      "الشحنة بالجرام فقط وبحسب لوحة الجهاز؛ يلزم ضاغط ومكونات معتمدة لـ R600a.",
    cylinderColor: "رمادي فاتح مع شريط أحمر",
    cylinderColorHex: "#C7D2C4",
  },
  {
    id: "r717",
    name: "R717 (NH3)",
    use: "تبريد صناعي ومخازن تبريد",
    oil: "زيت متوافق مع الأمونيا",
    note: "B2L سام وقابل للاشتعال بدرجة منخفضة؛ يحتاج تجهيزات وكشف تسرب متخصص.",
    gwp: 1,
    odp: 0,
    ashraeClass: "B2L",
    compatibilityWarning:
      "سام ويتطلب نظامًا ومعدات وكشف تسرب متخصصًا؛ لا تستخدمه في دائرة غير مصممة للأمونيا.",
    cylinderColor: "رمادي فاتح موحد",
    cylinderColorHex: "#C7D2C4",
  },
  {
    id: "r744",
    name: "R744 (CO2)",
    use: "تبريد تجاري وصناعي وأنظمة ثاني أكسيد الكربون",
    oil: "POE أو زيت معتمد للنظام",
    note: "ضغوط تشغيل مرتفعة؛ لا تستخدم معدات عادية غير مخصصة لـ CO2.",
    gwp: 1,
    odp: 0,
    ashraeClass: "A1",
    compatibilityWarning:
      "ضغوطه مرتفعة جدًا؛ يجب استخدام ضاغط ومكونات وأدوات معتمدة لـ CO2.",
    cylinderColor: "رمادي فاتح موحد",
    cylinderColorHex: "#C7D2C4",
  },
  {
    id: "r1234yf",
    name: "R1234yf",
    use: "تكييف السيارات وبعض الأنظمة الحديثة",
    oil: "POE مخصص للنظام",
    note: "A2L منخفض القابلية للاشتعال؛ استخدم معدات خدمة معتمدة.",
    gwp: 1,
    odp: 0,
    ashraeClass: "A2L",
    compatibilityWarning:
      "استخدم زيت ومعدات خدمة مخصصة لـ R1234yf ولا تخلطه مع R134a.",
    cylinderColor: "رمادي فاتح مع شريط أحمر",
    cylinderColorHex: "#C7D2C4",
  },
  {
    id: "r1234ze",
    name: "R1234ze(E)",
    use: "تطبيقات تبريد ومضخات حرارية وأنظمة منخفضة GWP",
    oil: "حسب الضاغط والنظام",
    note: "A2L؛ تحقق من حدود الاستخدام وموافقة الشركة المصنعة.",
    gwp: 1,
    odp: 0,
    ashraeClass: "A2L",
    compatibilityWarning:
      "تحقق من أن الضاغط والزيت ومكونات النظام معتمدة لهذا الفريون تحديدًا.",
    cylinderColor: "رمادي فاتح مع شريط أحمر",
    cylinderColorHex: "#C7D2C4",
  },
  {
    id: "r454b",
    name: "R454B",
    use: "تكييف حديث كبديل منخفض GWP لـ R410A في أجهزة مصممة له",
    oil: "POE حسب الشركة المصنعة",
    note: "A2L؛ لا يُستخدم كبديل مباشر دون اعتماد الجهاز وإجراءاته.",
    gwp: 465,
    odp: 0,
    ashraeClass: "A2L",
    compatibilityWarning:
      "لا يُستخدم كبديل مباشر لـ R410A؛ يجب أن تكون الوحدة مصممة ومعتمدة لـ R454B.",
    cylinderColor: "رمادي فاتح مع شريط أحمر",
    cylinderColorHex: "#C7D2C4",
  },
];

export type DiagnosisIndicator = {
  id: string;
  fault: string;
  english: string;
  discharge: string;
  suction: string;
  superheat: string;
  subcooling: string;
  amp: string;
  note: string;
};

export const diagnosisIndicators: DiagnosisIndicator[] = [
  {
    id: "overcharge",
    fault: "شحنة زائدة",
    english: "Overcharge",
    discharge: "مرتفع ↑",
    suction: "مرتفع ↑",
    superheat: "منخفض ↓",
    subcooling: "مرتفع ↑",
    amp: "مرتفع ↑",
    note: "اشتباه شحنة زائدة؛ قارن القراءات بدرجة الجو وبيانات لوحة الجهاز قبل استرجاع أي فريون.",
  },
  {
    id: "undercharge",
    fault: "شحنة ناقصة",
    english: "Undercharge",
    discharge: "منخفض ↓",
    suction: "منخفض ↓",
    superheat: "مرتفع ↑",
    subcooling: "منخفض ↓",
    amp: "منخفض ↓",
    note: "اشتباه نقص شحنة أو تسريب؛ افحص التسريب ولا تضف فريونًا قبل تحديد السبب.",
  },
  {
    id: "restriction",
    fault: "سدد",
    english: "Restriction",
    discharge: "منخفض ↓",
    suction: "منخفض ↓",
    superheat: "مرتفع جدًا ↑",
    subcooling: "مرتفع ↑",
    amp: "منخفض ↓",
    note: "اشتباه سدد في الفلتر أو خط السائل أو صمام التمدد؛ افحص فرق الحرارة ومكان السدد.",
  },
  {
    id: "dirty-evaporator",
    fault: "اتساخ المبخر",
    english: "Dirty Evaporator",
    discharge: "منخفض ↓",
    suction: "منخفض ↓",
    superheat: "مرتفع ↑",
    subcooling: "منخفض ↓",
    amp: "منخفض ↓",
    note: "افحص الفلاتر وتدفق الهواء ونظافة المبخر قبل الحكم على الشحنة.",
  },
  {
    id: "dirty-condenser",
    fault: "اتساخ المكثف",
    english: "Dirty Condenser",
    discharge: "مرتفع ↑",
    suction: "مرتفع ↑",
    superheat: "مرتفع ↑",
    subcooling: "مرتفع ↑",
    amp: "مرتفع ↑",
    note: "نظف المكثف وافحص المروحة وتدفق الهواء؛ ارتفاع الحرارة قد يرفع كل القراءات.",
  },
  {
    id: "low-compression",
    fault: "ضاغط ضعيف",
    english: "Low Compression",
    discharge: "منخفض ↓",
    suction: "مرتفع ↑",
    superheat: "مرتفع ↑",
    subcooling: "مرتفع ↑",
    amp: "منخفض ↓",
    note: "اشتباه ضعف كفاءة الضاغط؛ أجرِ اختبار ضغط ومقارنة تشغيلية وفق دليل الجهاز.",
  },
];

export type FieldDiagnosisGuide = {
  id: string;
  title: string;
  english: string;
  category: string;
  causes: string[];
  steps: string[];
};

export const fieldDiagnosisGuides: FieldDiagnosisGuide[] = [
  {
    id: "high-pressure-low-amp",
    title: "ضغط عالي وامبير منخفض",
    english: "High Pressure + Low Amp Draw",
    category: "الضغط والأمبير",
    causes: [],
    steps: [
      "الحل الاول",
      "لو الجهاز بارد ساخت هيكون البلف العاكس تالف",
      "تتأكد ازاي ( ماسوره الدخول ساخنه جدا وباقي ٣ مواسير لخروج حراره متساويه ) في الحاله دي الامبير قريب من الطبيعي",
      "الحل الثاني",
      "سد في خزان السائل اعراضه تكون تلج بعد الخزان والامبي قريب من الصفر الطبيعي",
      "الحال الثالث",
      "تفويت الضاغط",
      "وده بيكون امبيره حسب نسبه التفويت والافضل تشوف الضغوط غالبا تكون متساويه بين الهاي واللو",
    ],
  },
  {
    id: "low-suction-low-amp",
    title: "ضغط السحب منخفض والامبير منخفض",
    english: "Low Suction Pressure + Low Amp Draw",
    category: "الضغط والأمبير",
    causes: [],
    steps: [
      "المشكله في الوحده الداخليه",
      "مثل فلتر متسخه- مبخر متسخ- بلاور غير نظيف او مكسور",
      "-كباسور بلاور- نقص فريون",
      "- وجود تلج علي ماسوره الطرد = نقص فريون",
      "وجود تلج علي ماسوره الراجع = مروحه تالفة",
    ],
  },
  {
    id: "high-suction-high-amp",
    title: "ضغط السحب عالي والامبير عالي",
    english: "High Suction Pressure + High Amp Draw",
    category: "الضغط والأمبير",
    causes: [],
    steps: [
      "حل المشكله في الوحده الخارجيه",
      "نظافه الجهاز",
      "تهويه غير جيده",
      "مروحه ضعيفه",
      "انخفاض التيار الكهربائي",
      "هواء دائره الفريون",
      "زياده في الشحنه",
      "تحجيم ملفات",
    ],
  },
  {
    id: "low-suction-high-amp",
    title: "ضغط السحب منخفض وامبير مرتفع",
    english: "Low Suction Pressure + High Amp Draw",
    category: "الضغط والأمبير",
    causes: [],
    steps: [
      "سدد جزئي في كابلاري",
    ],
  },
  {
    id: "no-cooling-field-check",
    title: "فحص جهاز لا يبرد",
    english: "Field Diagnostic Check",
    category: "فحص ميداني",
    causes: [
      "فحص الفولت لا يقل عن 200V",
      "فحص الأمبير ومطابقته للوحة البيانات",
      "نقص الشحنة أو ارتفاع حرارة المكثف",
    ],
    steps: [
      "قياس الفولتية قبل وأثناء التشغيل",
      "مطابقة الأمبير مع بيانات الجهاز وتحديد سبب الزيادة",
      "فحص الشحنة ونظافة المكثف ومروحة الوحدة الخارجية",
    ],
  },
  {
    id: "ice-liquid-line",
    title: "تلج على الماسورة الرفيعة",
    english: "Ice on Liquid Line",
    category: "دورة التبريد",
    causes: [
      "نقص شحنة الفريون",
      "وجود تسريب في دورة التبريد",
      "انسداد جزئي في الفلتر أو الكبري",
    ],
    steps: [
      "التأكد من وجود تسريب واكتشافه بالضغط أو النيتروجين",
      "معالجة التسريب واللحام باحترافية",
      "عمل فاكيوم تام ثم شحن الجهاز بالوزن أو الضغط المقنن",
    ],
  },
  {
    id: "ice-suction-line",
    title: "تلج على الماسورة التخينة",
    english: "Ice on Suction Line",
    category: "دورة التبريد",
    causes: [
      "عدم سحب برودة المبخر",
      "بطء أو توقف مروحة البلور الداخلية",
      "اتساخ أو مشكلة فلترة المبخر بسبب غسيل ضعيف",
      "ضعف موتور مروحة المكثف أو تلف مكثف المروحة",
    ],
    steps: [
      "مراجعة نظافة الوحدة الداخلية",
      "فحص موتور المروحة والتأكد من دوران البلور بالسرعة المطلوبة",
      "فحص الفلتر ومسار الهواء وقياس الضغوط",
      "فحص موتور مروحة المكثف ومكثف المروحة",
    ],
  },
  {
    id: "gradual-high-amp",
    title: "سحب أمبير عالي تدريجي",
    english: "Gradual High Amp Draw",
    category: "الأداء والضغط",
    causes: [
      "سخونة المكثف الخارجي وعدم التبريد الجيد",
      "انخفاض الفولتية تدريجيًا",
      "بطء موتور مروحة المكثف",
      "مكان ضيق ومكتوم لوضع الوحدة الخارجية",
    ],
    steps: [
      "غسيل المكثف بالماء وضبط ضغط الهواء",
      "فحص موتور المروحة والمكثف وتحسين التهوية",
      "قياس الفولتية أثناء التشغيل والتأكد من ثباتها",
    ],
  },
  {
    id: "sudden-high-amp",
    title: "سحب أمبير عالي مفاجئ",
    english: "Sudden High Amp Draw",
    category: "الكهرباء والأمبير",
    causes: [
      "مشكلة في مكثف التقويم أو التشغيل",
      "توصيلات الكابلات الكهربائية غير محكمة أو متآكلة",
      "فولتية ضعيفة وغير مستقرة أقل من 190V",
    ],
    steps: [
      "فحص المكثف وقياسه واستبداله عند الحاجة",
      "مراجعة الأبواش والتوصيلات وقص الأطراف التالفة",
      "قياس الفولتية والتأكد من سلامة مصدر التغذية",
    ],
  },
  {
    id: "compressor-fault-signs",
    title: "علامات تلف الكباس",
    english: "Compressor Faults",
    category: "الكباس",
    causes: [
      "سحب أمبير عالي مستمر",
      "عدم انتظام قياس المقاومة بين الأطراف C,R,S",
      "عدم سخونة جسم الكباس بصورة طبيعية",
      "وجود قصر بين جسم الكباس والأرضي أو الشورت",
      "تسريب زيت وضعف كفاءة الضغط الداخلية",
    ],
    steps: [
      "قياس أطراف الكباس بالأوميتر",
      "فحص العزل الأرضي والتأكد من عدم وجود شورت",
      "التأكد من جودة دورة الزيت والضغط قبل قرار الاستبدال",
    ],
  },
];

export const pressureAmpGuide = {
  ampRows: [
    { btu: "12,000", hp: "1.5", r22: "4.5–6 A", r410a: "5–6.5 A" },
    { btu: "18,000", hp: "2.25", r22: "7–9 A", r410a: "7.5–9.5 A" },
    { btu: "24,000", hp: "3", r22: "9–12 A", r410a: "10–13 A" },
    { btu: "30,000", hp: "4", r22: "13–16 A", r410a: "14–17 A" },
    { btu: "36,000", hp: "5", r22: "16–20 A", r410a: "17–21 A" },
    { btu: "48,000", hp: "6", r22: "20–24 A", r410a: "21–26 A" },
    { btu: "60,000", hp: "7", r22: "24–30 A", r410a: "25–32 A" },
  ],
  operatingPressures: [
    { refrigerant: "R22", suction: "60–75 PSI", discharge: "220–280 PSI" },
    { refrigerant: "R410A", suction: "110–140 PSI", discharge: "350–450 PSI" },
    { refrigerant: "R32", suction: "120–160 PSI", discharge: "350–500 PSI" },
    { refrigerant: "R134a", suction: "30–50 PSI", discharge: "140–220 PSI" },
    { refrigerant: "R404A", suction: "60–85 PSI", discharge: "250–360 PSI" },
    { refrigerant: "R407C", suction: "65–85 PSI", discharge: "240–350 PSI" },
    { refrigerant: "R507A", suction: "65–90 PSI", discharge: "260–380 PSI" },
    { refrigerant: "R290", suction: "50–75 PSI", discharge: "220–320 PSI" },
    { refrigerant: "R600a", suction: "0–10 PSI", discharge: "80–130 PSI" },
    { refrigerant: "R448A", suction: "55–80 PSI", discharge: "250–360 PSI" },
    { refrigerant: "R449A", suction: "55–80 PSI", discharge: "250–360 PSI" },
    { refrigerant: "R452A", suction: "60–85 PSI", discharge: "280–400 PSI" },
    { refrigerant: "R454B", suction: "105–135 PSI", discharge: "300–420 PSI" },
    { refrigerant: "R1234yf", suction: "25–45 PSI", discharge: "120–190 PSI" },
  ],
  equalizedPressures: [
    { refrigerant: "R22", pressure: "110–140 PSI" },
    { refrigerant: "R410A", pressure: "200–250 PSI" },
    { refrigerant: "R32", pressure: "190–240 PSI" },
    { refrigerant: "R134a", pressure: "60–85 PSI" },
    { refrigerant: "R404A", pressure: "180–220 PSI" },
    { refrigerant: "R407C", pressure: "135–175 PSI" },
    { refrigerant: "R507A", pressure: "190–230 PSI" },
    { refrigerant: "R290", pressure: "120–160 PSI" },
    { refrigerant: "R600a", pressure: "40–60 PSI" },
    { refrigerant: "R448A", pressure: "170–215 PSI" },
    { refrigerant: "R449A", pressure: "170–215 PSI" },
    { refrigerant: "R452A", pressure: "190–240 PSI" },
    { refrigerant: "R454B", pressure: "180–230 PSI" },
    { refrigerant: "R1234yf", pressure: "70–95 PSI" },
  ],
} as const;

export const spareParts = [
  {
    id: "capacitor",
    name: "مكثف تشغيل",
    english: "Capacitor",
    group: "كهرباء",
    detail: "بدء وتشغيل المحرك والضاغط حسب قيمة µF والجهد.",
  },
  {
    id: "sensor",
    name: "حساس حرارة",
    english: "Temperature Sensor",
    group: "كهرباء",
    detail: "قياس حرارة الهواء أو الأنابيب وإرسالها للوحة التحكم.",
  },
  {
    id: "pcb",
    name: "لوحة تحكم",
    english: "PCB Board",
    group: "كهرباء",
    detail: "إدارة الإشارات والتشغيل؛ يجب مطابقة رقم القطعة.",
  },
  {
    id: "filter-drier",
    name: "فلتر مجفف",
    english: "Filter Drier",
    group: "دائرة التبريد",
    detail: "إزالة الرطوبة والشوائب من دائرة التبريد.",
  },
  {
    id: "fan-motor",
    name: "موتور مروحة",
    english: "Fan Motor",
    group: "ميكانيكا",
    detail: "تحريك الهواء عبر المبخر أو المكثف.",
  },
  {
    id: "compressor",
    name: "ضاغط",
    english: "Compressor",
    group: "ميكانيكا",
    detail: "ضغط وسيط التبريد؛ المطابقة تشمل الفريون والسعة والزيت.",
  },
];

export const tools = [
  { name: "Manifold Gauge", local: "عداد ضغط", icon: "speed" },
  { name: "Vacuum Pump", local: "مضخة تفريغ", icon: "build" },
  { name: "Clamp Meter", local: "كلامب ميتر", icon: "bolt" },
  { name: "Leak Detector", local: "كاشف تسريب", icon: "search" },
];

export const checklists = [
  {
    id: "split-service",
    title: "صيانة تكييف سبليت",
    duration: "45 دقيقة",
    items: [
      "فصل الكهرباء",
      "فحص الوحدة الداخلية",
      "تنظيف الفلاتر",
      "فحص المبخر والمروحة",
      "تنظيف الوحدة الخارجية",
      "فحص المكثف",
      "قياس الضغوط والأمبير",
      "قياس فرق الحرارة ΔT",
      "فحص الصرف والتسريب",
      "اختبار التشغيل وتسجيل القراءات",
    ],
  },
  {
    id: "vacuum",
    title: "تفريغ Vacuum",
    duration: "30 دقيقة",
    items: [
      "اختبار إحكام الدائرة",
      "توصيل مضخة التفريغ",
      "فتح صمامات المانيفولد",
      "متابعة قراءة الميكرون",
      "عزل المضخة ومراقبة الثبات",
      "تسجيل النتيجة",
    ],
  },
  {
    id: "gas-charge",
    title: "شحن فريون",
    duration: "35 دقيقة",
    items: [
      "تحديد نوع الفريون",
      "مراجعة وزن الشحنة",
      "فحص التسريب",
      "توصيل الميزان والمانيفولد",
      "الشحن بالوزن أو حسب الإجراء",
      "تسجيل القراءات",
    ],
  },
];

export const referenceItems: ReferenceItem[] = [
  ...errorCodes.map((item) => ({
    id: item.id,
    title: item.code,
    subtitle: `${item.brand} · ${item.title}`,
    category: "أكواد الأعطال",
    icon: "warning",
    accent: "#F97316",
  })),
  ...refrigerants.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `${item.use} · زيت ${item.oil}`,
    category: "فريونات",
    icon: "ac-unit",
    accent: "#22D3EE",
  })),
  ...spareParts.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `${item.english} · ${item.group}`,
    category: "قطع غيار",
    icon: "settings",
    accent: "#0E7490",
  })),
];
