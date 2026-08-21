export type AirFilter = {
  id: string;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  shortEn: string;
  color: string;
  iconKind: "carbon" | "pocket" | "pleated" | "hepa" | "metal";
  functionAr: string;
  functionEn: string;
  ahuPositionAr: string;
  ahuPositionEn: string;
  ratingLabel: string;
  ratingValue: string;
  usesAr: string[];
  usesEn: string[];
  cloggingSignsAr: string[];
  cloggingSignsEn: string[];
  maintenanceAr: string[];
  maintenanceEn: string[];
  replacementAr: string;
  replacementEn: string;
  notesAr: string[];
  notesEn: string[];
};

export const airflowStages = [
  { id: "fresh-air", ar: "هواء نقي", en: "Fresh Air" },
  { id: "pre-filter", ar: "فلتر أولي", en: "Pre-Filter" },
  { id: "pleated", ar: "فلتر مطوي", en: "Pleated" },
  { id: "bag", ar: "فلتر جيب", en: "Bag" },
  { id: "hepa", ar: "فلتر HEPA", en: "HEPA" },
  { id: "supply-air", ar: "هواء تغذية", en: "Supply Air" },
] as const;

export const airFilters: AirFilter[] = [
  {
    id: "carbon",
    nameAr: "فلتر كربوني",
    nameEn: "Carbon Filter",
    shortAr: "إزالة الروائح والغازات",
    shortEn: "Odor and gas removal",
    color: "#475569",
    iconKind: "carbon",
    functionAr: "يمتص الروائح والغازات العضوية وبعض المركبات الكيميائية المتطايرة باستخدام الكربون المنشط.",
    functionEn: "Adsorbs odors, organic gases, and selected volatile compounds using activated carbon.",
    ahuPositionAr: "بعد فلتر الـ Pre أو كمرحلة معالجة روائح حسب تصميم وحدة مناولة الهواء.",
    ahuPositionEn: "After the pre-filter, or as an odor-control stage according to the AHU design.",
    ratingLabel: "ISO ePM",
    ratingValue: "حسب وسيط الكربون؛ لا يُعبّر عنه عادةً بـ MERV وحده",
    usesAr: ["مولات", "فنادق", "مطاعم", "مصانع"],
    usesEn: ["Malls", "Hotels", "Restaurants", "Factories"],
    cloggingSignsAr: ["انخفاض Airflow", "زيادة Pressure Drop", "عودة الروائح", "تشبع وسيط الكربون"],
    cloggingSignsEn: ["Reduced airflow", "Higher pressure drop", "Odor breakthrough", "Carbon media saturation"],
    maintenanceAr: ["فحص الرائحة وحالة الكربون", "قياس فرق الضغط", "استبدال الكاسيت عند التشبع"],
    maintenanceEn: ["Check odor breakthrough", "Measure pressure drop", "Replace the cassette when saturated"],
    replacementAr: "يُستبدل عند عودة الرائحة أو بلوغ فرق الضغط الحد المسموح في مواصفات الوحدة.",
    replacementEn: "Replace when odors break through or the pressure drop reaches the AHU limit.",
    notesAr: ["لا تستخدم فلتر الكربون بديلًا عن فلتر الجسيمات.", "احفظه جافًا ومغلقًا قبل التركيب."],
    notesEn: ["Carbon is not a substitute for a particulate filter.", "Keep the media dry and sealed before installation."],
  },
  {
    id: "pocket",
    nameAr: "فلتر جيب",
    nameEn: "Bag Filter",
    shortAr: "ترشيح متوسط بسعة غبار عالية",
    shortEn: "Medium filtration with high dust holding",
    color: "#0E7490",
    iconKind: "pocket",
    functionAr: "يحجز الجسيمات والغبار بكفاءة أعلى من الفلتر الأولي بفضل الجيوب ذات المساحة الكبيرة.",
    functionEn: "Captures dust and particles more efficiently than a pre-filter through large-area pockets.",
    ahuPositionAr: "بعد فلتر الـ Pre وقبل مرحلة HEPA أو الفلتر النهائي.",
    ahuPositionEn: "After the pre-filter and before HEPA or the final filtration stage.",
    ratingLabel: "MERV / ISO ePM",
    ratingValue: "MERV 8–14 أو ISO ePM حسب الموديل",
    usesAr: ["مولات", "مستشفيات", "فنادق", "مبانٍ إدارية"],
    usesEn: ["Malls", "Hospitals", "Hotels", "Office buildings"],
    cloggingSignsAr: ["انخفاض Airflow", "زيادة Pressure Drop", "انتفاخ أو انهيار الجيوب", "ضعف التبريد"],
    cloggingSignsEn: ["Reduced airflow", "Higher pressure drop", "Collapsed or overfilled pockets", "Poor cooling"],
    maintenanceAr: ["فحص الجيوب والإطار", "قراءة فرق الضغط", "لا يُغسل عادةً؛ يُستبدل عند الاتساخ"],
    maintenanceEn: ["Inspect pockets and frame", "Read the differential pressure", "Usually not washable; replace when loaded"],
    replacementAr: "يُستبدل عند وصول Pressure Drop إلى الحد المحدد أو عند تلف الجيوب.",
    replacementEn: "Replace at the specified pressure-drop limit or when pockets are damaged.",
    notesAr: ["تأكد أن الجيوب في اتجاه الهواء الصحيح.", "لا تضغط الجيوب أثناء التركيب حتى لا يقل سطح الترشيح."],
    notesEn: ["Install the pockets in the correct airflow direction.", "Do not compress the pockets during installation."],
  },
  {
    id: "pleated",
    nameAr: "فلتر مطوي",
    nameEn: "Pleated Filter",
    shortAr: "ترشيح عام للمراحل المتوسطة",
    shortEn: "General-purpose intermediate filtration",
    color: "#2563EB",
    iconKind: "pleated",
    functionAr: "يحجز الغبار والجسيمات المحمولة بالهواء ويحمي الملفات والفلاتر النهائية.",
    functionEn: "Captures airborne dust and protects coils and final filters.",
    ahuPositionAr: "بعد فلتر الـ Pre أو كفلتر متوسط قبل فلتر الجيب أو HEPA.",
    ahuPositionEn: "After the pre-filter, or as an intermediate stage before bag or HEPA filtration.",
    ratingLabel: "MERV",
    ratingValue: "MERV 8–13 حسب الخامة والعمق",
    usesAr: ["مولات", "فنادق", "مكاتب", "منازل"],
    usesEn: ["Malls", "Hotels", "Offices", "Homes"],
    cloggingSignsAr: ["انخفاض Airflow", "زيادة Pressure Drop", "اتساخ سطح الطيات", "ضعف التبريد"],
    cloggingSignsEn: ["Reduced airflow", "Higher pressure drop", "Loaded pleat surface", "Poor cooling"],
    maintenanceAr: ["فحص بصري", "قياس فرق الضغط", "تنظيف الإطار فقط؛ لا تُنظف الخامة الورقية بالماء"],
    maintenanceEn: ["Visual inspection", "Measure pressure drop", "Clean the frame only; do not wash paper media"],
    replacementAr: "يُستبدل عند الاتساخ الواضح أو بلوغ فرق الضغط الحد المسموح، وغالبًا حسب جدول الصيانة.",
    replacementEn: "Replace when visibly loaded or at the allowable pressure-drop limit, often per the maintenance schedule.",
    notesAr: ["ركّب السهم في اتجاه سريان الهواء.", "اختَر نفس المقاس والعمق لتجنب تسريب الهواء حول الفلتر."],
    notesEn: ["Point the arrow in the airflow direction.", "Match the original size and depth to prevent bypass air."],
  },
  {
    id: "hepa",
    nameAr: "فلتر HEPA",
    nameEn: "HEPA Filter",
    shortAr: "ترشيح نهائي للجسيمات الدقيقة جدًا",
    shortEn: "Final filtration for very fine particles",
    color: "#7C3AED",
    iconKind: "hepa",
    functionAr: "يحتجز نسبة عالية جدًا من الجسيمات الدقيقة، ويُستخدم كمرحلة نهائية عندما تكون جودة الهواء الحرجة مطلوبة.",
    functionEn: "Removes a very high fraction of fine particles as a final stage where critical air cleanliness is required.",
    ahuPositionAr: "مرحلة نهائية بعد الفلاتر السابقة، وقد يكون طرفيًا عند نقطة التغذية.",
    ahuPositionEn: "Final stage after upstream filters, sometimes terminal at the supply point.",
    ratingLabel: "ISO ePM / EN 1822",
    ratingValue: "ISO ePM1 أو تصنيف HEPA معتمد حسب الكتالوج",
    usesAr: ["مستشفيات", "غرف عمليات", "Clean Rooms", "مختبرات"],
    usesEn: ["Hospitals", "Operating rooms", "Clean Rooms", "Laboratories"],
    cloggingSignsAr: ["زيادة Pressure Drop", "انخفاض Airflow", "إنذار فرق الضغط", "ضعف أداء الوحدة"],
    cloggingSignsEn: ["Higher pressure drop", "Reduced airflow", "Differential-pressure alarm", "Lower unit performance"],
    maintenanceAr: ["قياس فرق الضغط دوريًا", "فحص الإطار والجوان", "عدم لمس الوسط أو تنظيفه بالهواء المضغوط"],
    maintenanceEn: ["Measure pressure drop routinely", "Inspect the frame and gasket", "Do not touch or blow out the media"],
    replacementAr: "يُستبدل حسب فرق الضغط أو نتيجة اختبار التسريب أو جدول المنشأة، ولا يُغسل.",
    replacementEn: "Replace based on pressure drop, leak-test results, or facility schedule; never wash it.",
    notesAr: ["يجب إحكام الجوان لمنع تسريب الهواء حول الفلتر.", "اتبع إجراءات العزل والسلامة عند استبداله."],
    notesEn: ["Seal the gasket to prevent air bypass.", "Follow isolation and safety procedures during replacement."],
  },
  {
    id: "metal-mesh",
    nameAr: "فلتر شبكي معدني",
    nameEn: "Metal Mesh Filter",
    shortAr: "فلترة أولية قابلة للتنظيف",
    shortEn: "Cleanable primary filtration",
    color: "#16A34A",
    iconKind: "metal",
    functionAr: "يحجز الأتربة والجسيمات الكبيرة ويحمي المكونات الداخلية كمرحلة أولية قابلة للتنظيف.",
    functionEn: "Captures coarse dust and protects internal components as a cleanable primary stage.",
    ahuPositionAr: "أول مرحلة عند مدخل الهواء أو قبل فلتر الـ Pre.",
    ahuPositionEn: "First stage at the air inlet or upstream of the pre-filter.",
    ratingLabel: "MERV",
    ratingValue: "عادةً MERV 1–4 حسب التصميم",
    usesAr: ["مصانع", "مولات", "مطابخ", "وحدات خارجية"],
    usesEn: ["Factories", "Malls", "Kitchens", "Outdoor-air units"],
    cloggingSignsAr: ["تراكم أتربة واضح", "انخفاض Airflow", "زيادة Pressure Drop", "اتساخ الملف بعده"],
    cloggingSignsEn: ["Visible dust loading", "Reduced airflow", "Higher pressure drop", "Dirty downstream coil"],
    maintenanceAr: ["فك وتنظيف الشبك", "تجفيفه تمامًا", "فحص الإطار قبل الإعادة"],
    maintenanceEn: ["Remove and clean the mesh", "Dry it completely", "Inspect the frame before refitting"],
    replacementAr: "يُستبدل عند الصدأ أو تلف الشبك أو عدم إحكامه داخل الحامل.",
    replacementEn: "Replace if corroded, damaged, or no longer seals in the rack.",
    notesAr: ["لا تُعد تركيب الفلتر وهو مبلل.", "تأكد من عدم وجود فراغات حول الإطار."],
    notesEn: ["Never refit the filter while wet.", "Check for gaps around the frame."],
  },
];

export const airFilterComparisonIds = ["pleated", "pocket", "hepa"] as const;
