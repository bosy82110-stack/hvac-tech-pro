import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  brands,
  checklists,
  diagnosisIndicators,
  fieldDiagnosisGuides,
  errorCodes,
  pressureAmpGuide,
  refrigerants,
  spareParts,
  type CustomDiagnosis,
  type CustomErrorCode,
  type CustomMaterial,
  type HvacDeviceType,
  type ManagedBrand,
} from "@/shared/hvac-data";
import { compressorModels } from "@/shared/compressor-data";

type MaterialRecord = CustomMaterial & {
  name: string;
  english: string;
  unit: string;
  detail: string;
};

const calculatorOptions: Record<string, string[]> = {
  التبريد: ["السعة التبريدية"],
  الطول: ["الطول"],
  المساحة: ["المساحة"],
  الحجم: ["الحجم"],
  الكتلة: ["الكتلة"],
  الزمن: ["الزمن"],
  السرعة: ["السرعة"],
  التسارع: ["التسارع"],
  القوة: ["القوة"],
  الضغط: ["الضغط"],
  الطاقة: ["الطاقة"],
  القدرة: ["القدرة"],
  الزخم: ["الزخم"],
  الكثافة: ["الكثافة"],
  التردد: ["التردد"],
  "الشحنة الكهربائية": ["الشحنة الكهربائية"],
  "التيار الكهربائي": ["التيار الكهربائي"],
  "الجهد الكهربائي": ["الجهد الكهربائي"],
  المقاومة: ["المقاومة"],
  "السعة الكهربائية": ["السعة الكهربائية"],
  "درجة الحرارة": ["درجة الحرارة"],
};
const calculatorUnits: Record<string, string[]> = {
  "السعة التبريدية": [
    "وحدة حرارية بريطانية (BTU)",
    "حصان تبريد (HP)",
    "طن تبريد (ton)",
    "كيلوواط تبريد (kWₜ)",
    "سعر حراري في الساعة (kcal/h)",
    "واط تبريد (Wₜ)",
    "مليون وحدة حرارية في الساعة (MBH)",
    "ميجاواط تبريد (MWₜ)",
  ],
  الطول: ["متر", "سنتيمتر", "ملليمتر", "قدم", "بوصة"],
  المساحة: ["متر مربع", "قدم مربع", "بوصة مربع"],
  الحجم: ["متر مكعب", "لتر", "قدم مكعب", "جالون أمريكي"],
  الكتلة: ["كيلوجرام", "جرام", "رطل"],
  الزمن: ["ثانية", "دقيقة", "ساعة", "يوم"],
  السرعة: ["متر/ثانية", "كيلومتر/ساعة", "ميل/ساعة"],
  التسارع: ["متر/ثانية²", "قدم/ثانية²"],
  القوة: ["نيوتن", "كيلونيوتن", "رطل قوة"],
  الضغط: [
    "باسكال (Pa)",
    "كيلوباسكال (kPa)",
    "ميجاباسكال (MPa)",
    "بار (bar)",
    "مليبار (mbar)",
    "رطل لكل بوصة مربعة (psi)",
    "ضغط جوي (atm)",
    "تور (torr)",
    "مليمتر زئبق (mmHg)",
    "بوصة زئبق (inHg)",
    "بوصة ماء (inW.C)",
    "قدم ماء (ftH2O)",
    "كيلوجرام قوة لكل سنتيمتر مربع (kgf/cm²)",
  ],
  الطاقة: [
    "جول (J)",
    "كيلوجول (kJ)",
    "ميجاجول (MJ)",
    "سعرة حرارية (cal)",
    "كيلوسعرة (kcal)",
    "وحدة حرارية بريطانية (BTU)",
    "كيلوواط ساعي (kWh)",
    "إلكترون فولت (eV)",
    "قدم-باوند (ft·lb)",
    "ثيرم (therm)",
    "طن نفط مكافئ (toe)",
    "حصان-ساعة (hp·h)",
  ],
  القدرة: [
    "واط (W)",
    "كيلوواط (kW)",
    "ميجاواط (MW)",
    "حصان متري (hp_metric)",
    "حصان إمبراطوري (hp_imperial)",
    "وحدة حرارية بريطانية لكل ساعة (BTU/h)",
    "طن تبريد (ton_refrig)",
    "سعرة حرارية لكل ساعة (kcal/h)",
    "قدم-باوند لكل ثانية (ft·lb/s)",
  ],
  الزخم: ["kg·m/s", "N·s"],
  الكثافة: ["kg/m³", "g/cm³", "lb/ft³"],
  التردد: ["Hz", "kHz", "MHz"],
  "الشحنة الكهربائية": ["كولوم", "Ah"],
  "التيار الكهربائي": ["A", "mA"],
  "الجهد الكهربائي": ["V", "mV", "kV"],
  المقاومة: ["Ω", "kΩ", "MΩ"],
  "السعة الكهربائية": ["F", "µF", "nF"],
  "درجة الحرارة": ["°C", "°F", "K"],
};
const calculatorFactors: Record<string, Record<string, number>> = {
  "السعة التبريدية": {
    "وحدة حرارية بريطانية (BTU)": 1,
    "حصان تبريد (HP)": 8000,
    "طن تبريد (ton)": 12000,
    "كيلوواط تبريد (kWₜ)": 3412.142,
    "سعر حراري في الساعة (kcal/h)": 3.96832,
    "واط تبريد (Wₜ)": 3.412142,
    "مليون وحدة حرارية في الساعة (MBH)": 1000,
    "ميجاواط تبريد (MWₜ)": 3412142,
  },
  الطول: { متر: 1, سنتيمتر: 0.01, ملليمتر: 0.001, قدم: 0.3048, بوصة: 0.0254 },
  المساحة: { "متر مربع": 1, "قدم مربع": 0.092903, "بوصة مربع": 0.00064516 },
  الحجم: {
    "متر مكعب": 1,
    لتر: 0.001,
    "قدم مكعب": 0.0283168,
    "جالون أمريكي": 0.00378541,
  },
  الكتلة: { كيلوجرام: 1, جرام: 0.001, رطل: 0.453592 },
  الزمن: { ثانية: 1, دقيقة: 60, ساعة: 3600, يوم: 86400 },
  السرعة: { "متر/ثانية": 1, "كيلومتر/ساعة": 0.277778, "ميل/ساعة": 0.44704 },
  التسارع: { "متر/ثانية²": 1, "قدم/ثانية²": 0.3048 },
  القوة: { نيوتن: 1, كيلونيوتن: 1000, "رطل قوة": 4.44822 },
  الضغط: {
    "باسكال (Pa)": 1,
    "كيلوباسكال (kPa)": 1000,
    "ميجاباسكال (MPa)": 1000000,
    "بار (bar)": 100000,
    "مليبار (mbar)": 100,
    "رطل لكل بوصة مربعة (psi)": 6894.757293,
    "ضغط جوي (atm)": 101325,
    "تور (torr)": 133.322368,
    "مليمتر زئبق (mmHg)": 133.322387,
    "بوصة زئبق (inHg)": 3386.389,
    "بوصة ماء (inW.C)": 249.08891,
    "قدم ماء (ftH2O)": 2988.98,
    "كيلوجرام قوة لكل سنتيمتر مربع (kgf/cm²)": 98066.5,
  },
  الطاقة: {
    "جول (J)": 1,
    "كيلوجول (kJ)": 1000,
    "ميجاجول (MJ)": 1000000,
    "سعرة حرارية (cal)": 4.184,
    "كيلوسعرة (kcal)": 4184,
    "وحدة حرارية بريطانية (BTU)": 1055.05585262,
    "كيلوواط ساعي (kWh)": 3600000,
    "إلكترون فولت (eV)": 1.602176634e-19,
    "قدم-باوند (ft·lb)": 1.355817948,
    "ثيرم (therm)": 105506000,
    "طن نفط مكافئ (toe)": 41868000000,
    "حصان-ساعة (hp·h)": 2684519.538,
  },
  القدرة: {
    "واط (W)": 1,
    "كيلوواط (kW)": 1000,
    "ميجاواط (MW)": 1000000,
    "حصان متري (hp_metric)": 735.49875,
    "حصان إمبراطوري (hp_imperial)": 745.699872,
    "وحدة حرارية بريطانية لكل ساعة (BTU/h)": 0.29307107,
    "طن تبريد (ton_refrig)": 3516.85284,
    "سعرة حرارية لكل ساعة (kcal/h)": 1.163,
    "قدم-باوند لكل ثانية (ft·lb/s)": 1.355817948,
  },
  الزخم: { "kg·m/s": 1, "N·s": 1 },
  الكثافة: { "kg/m³": 1, "g/cm³": 1000, "lb/ft³": 16.0185 },
  التردد: { Hz: 1, kHz: 1000, MHz: 1000000 },
  "الشحنة الكهربائية": { كولوم: 1, Ah: 3600 },
  "التيار الكهربائي": { A: 1, mA: 0.001 },
  "الجهد الكهربائي": { V: 1, mV: 0.001, kV: 1000 },
  المقاومة: { Ω: 1, kΩ: 1000, MΩ: 1000000 },
  "السعة الكهربائية": { F: 1, µF: 0.000001, nF: 0.000000001 },
};

const info: Record<string, { title: string; subtitle: string; icon: any }> = {
  "error-codes": {
    title: "أكواد الأعطال",
    subtitle: "ابحث في قاعدة أكواد HVAC",
    icon: "warning",
  },
  brands: {
    title: "الماركات والموديلات",
    subtitle: "اختر الماركة للوصول إلى بيانات الجهاز",
    icon: "fan.fill",
  },
  "compressor-models": {
    title: "موديلات الكباسات",
    subtitle: "بيانات وقدرات موديلات الكباسات حسب الماركة",
    icon: "fan.fill",
  },
  refrigerants: {
    title: "الفريونات والزيوت",
    subtitle: "مرجع مختصر مع ملاحظات السلامة",
    icon: "snowflake",
  },
  parts: {
    title: "قطع الغيار",
    subtitle: "الوظيفة والمطابقة والبدائل",
    icon: "settings",
  },
  materials: {
    title: "الخامات",
    subtitle: "مواد التركيب والصيانة",
    icon: "build",
  },
  "pipe-diameters": {
    title: "أقطار المواسير",
    subtitle: "جدول أقطار مواسير النحاس بالبوصة والملليمتر",
    icon: "settings",
  },
  "pressure-amp-guide": {
    title: "دليل الضغوط والأمبير",
    subtitle: "مرجع تقريبي لـ R22 وR410A عند 220 فولت",
    icon: "bolt.fill",
  },
  "circuit-reference": {
    title: "مرجع الدوائر",
    subtitle: "رسومات وشرح دوائر التبريد والميكانيكا والكهرباء",
    icon: "book.fill",
  },
  calculators: {
    title: "حاسبات HVAC",
    subtitle: "تحويلات وحسابات سريعة للفني",
    icon: "calculator",
  },
  diagnosis: {
    title: "تشخيص عطل",
    subtitle: "ابدأ من الأسهل إلى الأصعب",
    icon: "wrench.and.screwdriver.fill",
  },
  assistant: {
    title: "مساعد الفني",
    subtitle: "اكتب المشكلة وسنرتب لك خطوات الفحص",
    icon: "sparkles",
  },
  search: {
    title: "البحث الشامل",
    subtitle: "نتائج من كل أقسام المرجع",
    icon: "magnifyingglass",
  },
};

const pipeDiameters = [
  ["1/8", "3.17"],
  ["1/4", "6.35"],
  ["3/8", "9.52"],
  ["1/2", "12.70"],
  ["5/8", "15.88"],
  ["3/4", "19.05"],
  ["7/8", "22.22"],
  ["1", "25.40"],
  ["1-1/8", "28.58"],
  ["1-1/4", "31.75"],
  ["1-3/8", "34.93"],
  ["1-1/2", "38.10"],
  ["1-5/8", "41.28"],
  ["1-3/4", "44.45"],
  ["1-7/8", "47.63"],
  ["2", "50.80"],
  ["2-1/8", "53.98"],
] as const;

const compressorBrandNames = Array.from(
  new Set(compressorModels.map((item) => item.brand)),
);

type PtPoint = { tempC: number; psig: number };

// نقاط مرجعية تقريبية من جداول PT القياسية، مع استيفاء خطي بين النقاط.
// الإدخال في الحاسبة بوحدة PSI، والنتيجة بدرجة مئوية.
const ptTables: Record<string, PtPoint[]> = {
  r22: [
    { tempC: -40, psig: 5.3 },
    { tempC: -30, psig: 16.0 },
    { tempC: -20, psig: 29.0 },
    { tempC: -10, psig: 42.5 },
    { tempC: 0, psig: 57.5 },
    { tempC: 10, psig: 85.3 },
    { tempC: 20, psig: 124.5 },
    { tempC: 30, psig: 171.0 },
    { tempC: 40, psig: 224.4 },
    { tempC: 50, psig: 288.4 },
    { tempC: 60, psig: 360.0 },
  ],
  r410a: [
    { tempC: -40, psig: 14.0 },
    { tempC: -30, psig: 25.0 },
    { tempC: -20, psig: 43.0 },
    { tempC: -10, psig: 67.0 },
    { tempC: 0, psig: 101.5 },
    { tempC: 10, psig: 145.8 },
    { tempC: 20, psig: 204.0 },
    { tempC: 30, psig: 283.0 },
    { tempC: 40, psig: 359.0 },
    { tempC: 50, psig: 447.0 },
    { tempC: 60, psig: 550.0 },
  ],
};

const saturationTempFromPressure = (
  refrigerantId: string,
  pressurePsi: number,
  pressureMode: "gauge" | "absolute",
) => {
  const table = ptTables[refrigerantId];
  if (!table || !Number.isFinite(pressurePsi)) return null;
  const psig = pressureMode === "absolute" ? pressurePsi - 14.7 : pressurePsi;
  if (psig < table[0].psig || psig > table[table.length - 1].psig) return null;
  for (let index = 1; index < table.length; index += 1) {
    const lower = table[index - 1];
    const upper = table[index];
    if (psig <= upper.psig) {
      const ratio = (psig - lower.psig) / (upper.psig - lower.psig);
      return lower.tempC + ratio * (upper.tempC - lower.tempC);
    }
  }
  return null;
};

const formatMeasurement = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)} °C`;

const parseNumericInput = (value: string) =>
  value.trim() === "" ? null : Number(value);


export default function SectionScreen() {
  const colors = useColors();
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = Array.isArray(section) ? section[0] : section;
  const current = info[key] ?? info.search;
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [calcCategory, setCalcCategory] = useState("التبريد");
  const [calcConversion, setCalcConversion] = useState("السعة التبريدية");
  const [calcFromUnit, setCalcFromUnit] = useState(
    "وحدة حرارية بريطانية (BTU)",
  );
  const [calcToUnit, setCalcToUnit] = useState("طن تبريد (ton)");
  const [calcValue, setCalcValue] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const [savedDiagnoses, setSavedDiagnoses] = useState<CustomDiagnosis[]>([]);
  const [openType, setOpenType] = useState<string | null>(null);
  const [openCalculatorCategory, setOpenCalculatorCategory] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<CustomDiagnosis | null>(null);
  const [selectedFieldGuideId, setSelectedFieldGuideId] = useState<
    string | null
  >(null);
  const [customErrorCodes, setCustomErrorCodes] = useState<CustomErrorCode[]>(
    [],
  );
  const [selectedError, setSelectedError] = useState<{
    code: string;
    brand: string;
    model: string;
    drive: string;
    problem: string;
    solution: string;
    type: string;
  } | null>(null);
  const [errorDevice, setErrorDevice] = useState<HvacDeviceType>("سبليت");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCompressorBrand, setSelectedCompressorBrand] = useState<
    string | null
  >(null);
  const [selectedCompressorKey, setSelectedCompressorKey] = useState<
    string | null
  >(null);
  const [compareCompressorKeyA, setCompareCompressorKeyA] = useState<
    string | null
  >(null);
  const [compareCompressorKeyB, setCompareCompressorKeyB] = useState<
    string | null
  >(null);
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<string | null>(
    null,
  );
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [managedBrands, setManagedBrands] = useState<ManagedBrand[]>(brands);
  const [customMaterials, setCustomMaterials] = useState<CustomMaterial[]>([]);
  const [orderItems, setOrderItems] = useState<
    Array<{ material: MaterialRecord; quantity: number }>
  >([]);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [orderMaterialId, setOrderMaterialId] = useState<string | null>(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [circuitZoom, setCircuitZoom] = useState(1);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(
    null,
  );
  const [ptRefrigerant, setPtRefrigerant] = useState("r22");
  const [ptPressureMode, setPtPressureMode] = useState<"gauge" | "absolute">(
    "gauge",
  );
  const [ptSuctionPressure, setPtSuctionPressure] = useState("");
  const [ptLiquidPressure, setPtLiquidPressure] = useState("");
  const [ptAmbientTemp, setPtAmbientTemp] = useState("");
  const [ptCondenserInTemp, setPtCondenserInTemp] = useState("");
  const [ptCondenserOutTemp, setPtCondenserOutTemp] = useState("");
  const [ptLiquidLineTemp, setPtLiquidLineTemp] = useState("");
  const [ptSuctionLineTemp, setPtSuctionLineTemp] = useState("");
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("hvac_custom_diagnoses"),
      AsyncStorage.getItem("hvac_custom_error_codes"),
      AsyncStorage.getItem("hvac_managed_brands"),
      AsyncStorage.getItem("hvac_custom_materials"),
    ])
      .then(([diagnosesValue, errorsValue, brandsValue, materialsValue]) => {
        if (diagnosesValue) setSavedDiagnoses(JSON.parse(diagnosesValue));
        if (errorsValue) setCustomErrorCodes(JSON.parse(errorsValue));
        if (brandsValue) setManagedBrands(JSON.parse(brandsValue));
        if (materialsValue) setCustomMaterials(JSON.parse(materialsValue));
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    AsyncStorage.getItem("hvac_material_order")
      .then((value) => {
        if (value) setOrderItems(JSON.parse(value));
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(
      "hvac_material_order",
      JSON.stringify(orderItems),
    ).catch(() => undefined);
  }, [orderItems]);
  const normalizedQuery = query.trim().toLowerCase();
  const getCompressorByKey = (key: string | null) =>
    key
      ? compressorModels.find(
          (item, index) => `${item.brand}__${item.model}__${index}` === key,
        ) ?? null
      : null;
  const toggleCompressorCompare = (key: string) => {
    if (compareCompressorKeyA === key) {
      setCompareCompressorKeyA(null);
      return;
    }
    if (compareCompressorKeyB === key) {
      setCompareCompressorKeyB(null);
      return;
    }
    if (!compareCompressorKeyA) {
      setCompareCompressorKeyA(key);
    } else if (!compareCompressorKeyB) {
      setCompareCompressorKeyB(key);
    } else {
      setCompareCompressorKeyA(key);
    }
  };
  const filteredCodes = errorCodes.filter(
    (x) =>
      x.type === errorDevice &&
      normalizedQuery.length > 0 &&
      `${x.code} ${x.brand} ${x.model} ${x.title}`
        .toLowerCase()
        .includes(normalizedQuery),
  );
  const filteredCustomCodes = customErrorCodes.filter(
    (x) =>
      x.type === errorDevice &&
      normalizedQuery.length > 0 &&
      `${x.code} ${x.brand} ${x.model} ${x.problem}`
        .toLowerCase()
        .includes(normalizedQuery),
  );

  const toggle = (id: string) =>
    setDone((items) =>
      items.includes(id) ? items.filter((x) => x !== id) : [...items, id],
    );
  const calculateResult = () => {
    const value = Number(calcValue);
    if (!calcValue.trim() || Number.isNaN(value)) return null;
    if (calcCategory === "درجة الحرارة") {
      if (calcFromUnit === "°C" && calcToUnit === "°F")
        return (value * 9) / 5 + 32;
      if (calcFromUnit === "°F" && calcToUnit === "°C")
        return ((value - 32) * 5) / 9;
      if (calcFromUnit === "°C" && calcToUnit === "K") return value + 273.15;
      if (calcFromUnit === "K" && calcToUnit === "°C") return value - 273.15;
      return value;
    }
    const factors =
      calculatorFactors[calcConversion] ??
      calculatorFactors["السعة التبريدية"] ??
      {};
    return (value * (factors[calcFromUnit] ?? 1)) / (factors[calcToUnit] ?? 1);
  };
  const calcResult = calculateResult();
  const ptSaturationSuction = saturationTempFromPressure(
    ptRefrigerant,
    parseNumericInput(ptSuctionPressure) ?? Number.NaN,
    ptPressureMode,
  );
  const ptSaturationLiquid = saturationTempFromPressure(
    ptRefrigerant,
    parseNumericInput(ptLiquidPressure) ?? Number.NaN,
    ptPressureMode,
  );
  const ptLiquidLine = parseNumericInput(ptLiquidLineTemp);
  const ptSuctionLine = parseNumericInput(ptSuctionLineTemp);
  const ptCondenserIn = parseNumericInput(ptCondenserInTemp);
  const ptCondenserOut = parseNumericInput(ptCondenserOutTemp);
  const ptSuperheat =
    ptSaturationSuction !== null && ptSuctionLine !== null && Number.isFinite(ptSuctionLine)
      ? ptSuctionLine - ptSaturationSuction
      : null;
  const ptSubcooling =
    ptSaturationLiquid !== null && ptLiquidLine !== null && Number.isFinite(ptLiquidLine)
      ? ptSaturationLiquid - ptLiquidLine
      : null;
  const ambientTemp = parseNumericInput(ptAmbientTemp);
  const ptCondenserSplit =
    ptCondenserOut !== null && ambientTemp !== null && Number.isFinite(ptCondenserOut) && Number.isFinite(ambientTemp)
      ? ptCondenserOut - ambientTemp
      : null;
  const brandList = managedBrands;
  const renderCards = () => {
    if (key === "circuit-reference") {
      return (
        <View>
          <View
            style={[
              styles.detailCard,
              { backgroundColor: colors.surface, borderColor: "#7C3AED" },
            ]}
          >
            <View style={[styles.circleIcon, { backgroundColor: "#EDE9FE" }]}>
              <IconSymbol name="book.fill" size={24} color="#7C3AED" />
            </View>
            <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
              دوائر التبريد
            </Text>
            <Text style={[styles.detailsBody, { color: colors.muted }]}>
              دورة التبريد الأساسية ومسار الفريون بين الضاغط والمكثف والمجفف
              وصمام التمدد والمبخر.
            </Text>
            <View
              style={[
                styles.imageViewer,
                { backgroundColor: "#F8FAFC", borderColor: colors.border },
              ]}
            >
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator
                contentContainerStyle={styles.imageScroller}
              >
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  contentContainerStyle={styles.imageVerticalScroller}
                  style={{
                    width: Math.max(520, 520 * circuitZoom),
                    height: 300,
                  }}
                >
                  <Image
                    source={require("@/assets/images/refrigeration-cycle.png")}
                    resizeMode="contain"
                    style={{
                      width: 520 * circuitZoom,
                      height: 347 * circuitZoom,
                    }}
                  />
                </ScrollView>
              </ScrollView>
            </View>
            <View style={styles.zoomRow}>
              <Pressable
                onPress={() =>
                  setCircuitZoom((value) =>
                    Math.min(2.5, Number((value + 0.25).toFixed(2))),
                  )
                }
                style={[styles.zoomButton, { backgroundColor: "#7C3AED" }]}
              >
                <Text style={styles.zoomButtonText}>+</Text>
              </Pressable>
              <Text style={[styles.zoomLabel, { color: colors.muted }]}>
                تكبير الصورة: {Math.round(circuitZoom * 100)}%
              </Text>
              <Pressable
                onPress={() =>
                  setCircuitZoom((value) =>
                    Math.max(1, Number((value - 0.25).toFixed(2))),
                  )
                }
                style={[
                  styles.zoomButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: "#7C3AED",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.zoomButtonText, { color: "#7C3AED" }]}>
                  −
                </Text>
              </Pressable>
            </View>
            <View style={[styles.pipeNote, { backgroundColor: "#F5F3FF" }]}>
              <Text style={[styles.pipeNoteTitle, { color: "#6D28D9" }]}>
                مكونات الدورة
              </Text>
              <Text style={[styles.pipeNoteText, { color: "#4C1D95" }]}>
                • الضاغط Compressor: يرفع ضغط وحرارة غاز الفريون.
              </Text>
              <Text style={[styles.pipeNoteText, { color: "#4C1D95" }]}>
                • المكثف Condenser: يطرد الحرارة ويحوّل الفريون إلى سائل.
              </Text>
              <Text style={[styles.pipeNoteText, { color: "#4C1D95" }]}>
                • مجفف/خزان الفريون Receiver / Drier: تنقية وتجميع وسيط التبريد.
              </Text>
              <Text style={[styles.pipeNoteText, { color: "#4C1D95" }]}>
                • صمام التمدد Expansion Valve: يخفض الضغط وينظم التدفق.
              </Text>
              <Text style={[styles.pipeNoteText, { color: "#4C1D95" }]}>
                • المبخر Evaporator: يمتص الحرارة ويعيد الفريون إلى خط السحب.
              </Text>
            </View>
            <View
              style={[
                styles.pipeNote,
                { backgroundColor: "#EFF6FF", marginTop: 8 },
              ]}
            >
              <Text style={[styles.pipeNoteTitle, { color: "#1D4ED8" }]}>
                مسارات الفريون
              </Text>
              <Text style={[styles.pipeNoteText, { color: "#1E3A8A" }]}>
                الأحمر: خط الطرد/الغاز الساخن عالي الضغط، الأصفر: خط السائل عالي
                الضغط، الأزرق: خط السحب/البخار منخفض الضغط.
              </Text>
            </View>
          </View>
        </View>
      );
    }
    if (key === "pressure-amp-guide") {
      return (
        <View>
          <View
            style={[
              styles.detailCard,
              { backgroundColor: colors.surface, borderColor: "#D97706" },
            ]}
          >
            <View style={[styles.circleIcon, { backgroundColor: "#FEF3C7" }]}>
              <IconSymbol name="bolt.fill" size={24} color="#B45309" />
            </View>
            <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
              الأمبير الطبيعي أثناء التشغيل عند 220 فولت
            </Text>
            <Text style={[styles.detailsBody, { color: colors.muted }]}>
              للمكيفات السبليت العادية On/Off. القيم تقريبية وتتأثر بدرجة الجو
              والحمل وطول المواسير وحالة الجهاز.
            </Text>
            <View style={[styles.ptCard, { backgroundColor: colors.background, borderColor: "#0E7490" }]}>
              <Text style={[styles.detailsTitle, { color: colors.foreground }]}>حاسبة PT وتشخيص دورة التبريد</Text>
              <Text style={[styles.detailsBody, { color: colors.muted }]}>أدخل القياسات بدرجة مئوية والضغوط بالـ PSI. النتائج إرشادية ولا تغني عن جدول الشركة المصنعة.</Text>
              <Text style={[styles.ptLabel, { color: colors.foreground }]}>نوع الفريون</Text>
              <View style={styles.ptChoiceRow}>
                {refrigerants.filter((item) => ptTables[item.id]).map((item) => (
                  <Pressable key={item.id} onPress={() => setPtRefrigerant(item.id)} style={[styles.ptChoice, { borderColor: ptRefrigerant === item.id ? "#0E7490" : colors.border, backgroundColor: ptRefrigerant === item.id ? "#CFFAFE" : colors.surface }]}>
                    <Text style={[styles.ptChoiceText, { color: ptRefrigerant === item.id ? "#064E5C" : colors.foreground }]}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.ptLabel, { color: colors.foreground }]}>نوع الضغط</Text>
              <View style={styles.ptChoiceRow}>
                <Pressable onPress={() => setPtPressureMode("gauge")} style={[styles.ptChoice, { borderColor: ptPressureMode === "gauge" ? "#0E7490" : colors.border, backgroundColor: ptPressureMode === "gauge" ? "#CFFAFE" : colors.surface }]}>
                  <Text style={[styles.ptChoiceText, { color: ptPressureMode === "gauge" ? "#064E5C" : colors.foreground }]}>Gauge (PSIG)</Text>
                </Pressable>
                <Pressable onPress={() => setPtPressureMode("absolute")} style={[styles.ptChoice, { borderColor: ptPressureMode === "absolute" ? "#0E7490" : colors.border, backgroundColor: ptPressureMode === "absolute" ? "#CFFAFE" : colors.surface }]}>
                  <Text style={[styles.ptChoiceText, { color: ptPressureMode === "absolute" ? "#064E5C" : colors.foreground }]}>Absolute (PSIA)</Text>
                </Pressable>
              </View>
              <View style={styles.ptGrid}>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>ضغط السحب</Text><TextInput value={ptSuctionPressure} onChangeText={setPtSuctionPressure} keyboardType="decimal-pad" placeholder="مثال 68.5" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>ضغط السائل</Text><TextInput value={ptLiquidPressure} onChangeText={setPtLiquidPressure} keyboardType="decimal-pad" placeholder="مثال 224" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>حرارة الجو</Text><TextInput value={ptAmbientTemp} onChangeText={setPtAmbientTemp} keyboardType="decimal-pad" placeholder="°C" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>هواء المكثف دخول</Text><TextInput value={ptCondenserInTemp} onChangeText={setPtCondenserInTemp} keyboardType="decimal-pad" placeholder="°C" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>هواء المكثف خروج</Text><TextInput value={ptCondenserOutTemp} onChangeText={setPtCondenserOutTemp} keyboardType="decimal-pad" placeholder="°C" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>حرارة خط السائل</Text><TextInput value={ptLiquidLineTemp} onChangeText={setPtLiquidLineTemp} keyboardType="decimal-pad" placeholder="°C" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
                <View style={styles.ptField}><Text style={[styles.ptLabel, { color: colors.foreground }]}>حرارة خط السحب</Text><TextInput value={ptSuctionLineTemp} onChangeText={setPtSuctionLineTemp} keyboardType="decimal-pad" placeholder="°C" placeholderTextColor={colors.muted} style={[styles.ptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>
              </View>
              <View style={styles.ptResults}>
                <View style={[styles.ptResult, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.ptResultTitle, { color: colors.muted }]}>تشبع السحب</Text><Text style={[styles.ptResultValue, { color: colors.foreground }]}>{formatMeasurement(ptSaturationSuction)}</Text></View>
                <View style={[styles.ptResult, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.ptResultTitle, { color: colors.muted }]}>تشبع السائل</Text><Text style={[styles.ptResultValue, { color: colors.foreground }]}>{formatMeasurement(ptSaturationLiquid)}</Text></View>
                <View style={[styles.ptResult, { backgroundColor: "#ECFDF5", borderColor: "#10B981" }]}><Text style={[styles.ptResultTitle, { color: "#065F46" }]}>Superheat</Text><Text style={[styles.ptResultValue, { color: "#064E3B" }]}>{formatMeasurement(ptSuperheat)}</Text></View>
                <View style={[styles.ptResult, { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" }]}><Text style={[styles.ptResultTitle, { color: "#1E40AF" }]}>Subcooling</Text><Text style={[styles.ptResultValue, { color: "#1E3A8A" }]}>{formatMeasurement(ptSubcooling)}</Text></View>
                <View style={[styles.ptResult, { backgroundColor: "#FFF7ED", borderColor: "#F97316" }]}><Text style={[styles.ptResultTitle, { color: "#9A3412" }]}>Condenser Split</Text><Text style={[styles.ptResultValue, { color: "#7C2D12" }]}>{formatMeasurement(ptCondenserSplit)}</Text></View>
              </View>
              <Text style={[styles.ptHint, { color: colors.muted }]}>المعادلة: Superheat = حرارة خط السحب − تشبع السحب، وSubcooling = تشبع السائل − حرارة خط السائل، وCondenser Split = هواء الخروج − الجو.</Text>
            </View>
            <View style={[styles.pipeTable, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.pipeRow,
                  styles.pipeHeader,
                  {
                    backgroundColor: "#FEF3C7",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  القدرة BTU
                </Text>
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  حصان
                </Text>
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  R22
                </Text>
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  R410A
                </Text>
              </View>
              {pressureAmpGuide.ampRows.map((row) => (
                <View
                  key={row.btu}
                  style={[styles.pipeRow, { borderBottomColor: colors.border }]}
                >
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.btu}
                  </Text>
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.hp}
                  </Text>
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.r22}
                  </Text>
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.r410a}
                  </Text>
                </View>
              ))}
            </View>
            <Text
              style={[
                styles.detailsTitle,
                { color: colors.foreground, marginTop: 8 },
              ]}
            >
              ضغوط التشغيل الطبيعية
            </Text>
            <View style={[styles.pipeTable, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.pipeRow,
                  styles.pipeHeader,
                  {
                    backgroundColor: "#D9F6FA",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  الفريون
                </Text>
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  ضغط السحب
                </Text>
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  ضغط الطرد
                </Text>
              </View>
              {pressureAmpGuide.operatingPressures.map((row) => (
                <View
                  key={row.refrigerant}
                  style={[styles.pipeRow, { borderBottomColor: colors.border }]}
                >
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.refrigerant}
                  </Text>
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.suction}
                  </Text>
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.discharge}
                  </Text>
                </View>
              ))}
            </View>
            <Text
              style={[
                styles.detailsTitle,
                { color: colors.foreground, marginTop: 8 },
              ]}
            >
              ضغوط التوقف بعد تساوي الضغط
            </Text>
            <View style={[styles.pipeTable, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.pipeRow,
                  styles.pipeHeader,
                  {
                    backgroundColor: "#DCFCE7",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  الفريون
                </Text>
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  الضغط
                </Text>
              </View>
              {pressureAmpGuide.equalizedPressures.map((row) => (
                <View
                  key={row.refrigerant}
                  style={[styles.pipeRow, { borderBottomColor: colors.border }]}
                >
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.refrigerant}
                  </Text>
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    {row.pressure}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.pipeNote, { backgroundColor: "#FFF7ED" }]}>
              <Text style={styles.pipeNoteTitle}>تنبيه فني</Text>
              <Text style={styles.pipeNoteText}>
                لا تعتمد على الضغط أو الأمبير وحده لتحديد الشحنة أو العطل؛ راجع
                لوحة الجهاز ودرجة الحرارة وحمل التبريد وتعليمات الشركة.
              </Text>
            </View>
          </View>
        </View>
      );
    }
    if (key === "pipe-diameters") {
      return (
        <View>
          <View
            style={[
              styles.detailCard,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
          >
            <View style={[styles.circleIcon, { backgroundColor: "#FEF3C7" }]}>
              <IconSymbol name="settings" size={24} color="#B45309" />
            </View>
            <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
              أقطار مواسير النحاس
            </Text>
            <Text style={[styles.detailsBody, { color: colors.muted }]}>
              جدول مرجعي للقطر الخارجي لمواسير النحاس المستخدمة في أعمال التكييف
              والتبريد.
            </Text>
            <View style={[styles.pipeTable, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.pipeRow,
                  styles.pipeHeader,
                  {
                    backgroundColor: "#CFFAFE",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.pipeCell, styles.pipeHeaderText]}>
                  القطر بالبوصة
                </Text>
                <Text style={[styles.pipeCell, styles.pipeHeaderText]}>
                  القطر بالملليمتر
                </Text>
              </View>
              {pipeDiameters.map(([inch, mm]) => (
                <View
                  key={inch}
                  style={[styles.pipeRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.pipeCell, { color: colors.foreground }]}>
                    {inch}″
                  </Text>
                  <Text style={[styles.pipeCell, { color: colors.foreground }]}>
                    {mm} مم
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.pipeNote, { backgroundColor: "#ECFEFF" }]}>
              <Text style={styles.pipeNoteTitle}>ملاحظات مهمة</Text>
              <Text style={styles.pipeNoteText}>
                • خط السائل يكون عادةً أصغر قطرًا.
              </Text>
              <Text style={styles.pipeNoteText}>
                • خط السحب يكون عادةً أكبر قطرًا.
              </Text>
              <Text style={styles.pipeNoteText}>
                • المقاس النهائي يعتمد على قدرة الجهاز وطول المواسير وتعليمات
                الشركة المصنعة.
              </Text>
            </View>
          </View>
        </View>
      );
    }
    if (key === "compressor-models") {
      const selectedCompressor = selectedCompressorKey
        ? compressorModels.find(
            (item, index) =>
              `${item.brand}__${item.model}__${index}` ===
              selectedCompressorKey,
          )
        : null;
      const brandModels = selectedCompressorBrand
        ? compressorModels.filter(
            (item) => item.brand === selectedCompressorBrand,
          )
        : [];
      const compareCompressorA = getCompressorByKey(compareCompressorKeyA);
      const compareCompressorB = getCompressorByKey(compareCompressorKeyB);
      const comparisonRows = [
        ["الماركة", "brand"],
        ["الموديل", "model"],
        ["القدرة HP", "horsepower"],
        ["القدرة W", "watts"],
        ["التردد", "frequencyHz"],
        ["الأمبير RLA", "rla"],
        ["الإزاحة CC", "displacementCc"],
        ["السعة kcal/h", "coolingKcalHr"],
        ["السعة BTU/h", "coolingBtuHr"],
        ["السعة عند -23°C", "capacityMinus23C"],
        ["السعة عند -5°C", "capacityMinus5C"],
        ["السعة عند +7.2°C", "capacityPlus7C"],
        ["التطبيق", "application"],
        ["الفريون", "refrigerant"],
        ["الزيت/المكثف", "oilOrCapacitor"],
      ] as const;
      if (selectedCompressor) {
        const detailRows = [
          ["الماركة", selectedCompressor.brand],
          ["الموديل", selectedCompressor.model],
          ["القدرة HP", selectedCompressor.horsepower],
          ["القدرة W", selectedCompressor.watts],
          ["التردد", selectedCompressor.frequencyHz],
          ["الأمبير RLA", selectedCompressor.rla],
          ["الإزاحة CC", selectedCompressor.displacementCc],
          ["السعة kcal/h", selectedCompressor.coolingKcalHr],
          ["السعة BTU/h", selectedCompressor.coolingBtuHr],
          ["السعة عند -23°C", selectedCompressor.capacityMinus23C],
          ["السعة عند -5°C", selectedCompressor.capacityMinus5C],
          ["السعة عند +7.2°C", selectedCompressor.capacityPlus7C],
          ["التطبيق", selectedCompressor.application],
          ["الفريون", selectedCompressor.refrigerant],
          ["بيانات إضافية", selectedCompressor.notes],
          ["الزيت/المكثف", selectedCompressor.oilOrCapacitor],
        ].filter(([, value]) => value);
        return (
          <View>
            <Pressable
              onPress={() => setSelectedCompressorKey(null)}
              style={styles.backRow}
            >
              <IconSymbol name="arrow.left" size={18} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                العودة إلى موديلات {selectedCompressor.brand}
              </Text>
            </Pressable>
            <View
              style={[
                styles.detailCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: "#0E7490" }]}>
                <Text style={styles.avatarText}>
                  {selectedCompressor.brand[0]}
                </Text>
              </View>
              <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
                {selectedCompressor.model}
              </Text>
              <Text style={[styles.detailsBody, { color: colors.muted }]}>
                بيانات فنية مستخرجة من ملف الكباسات المرفق.
              </Text>
              {detailRows.map(([label, value]) => (
                <View
                  key={`${label}-${value}`}
                  style={[
                    styles.detailsRowBox,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.detailsRowLabel, { color: colors.muted }]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.detailsRowValue,
                      { color: colors.foreground },
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      }
      if (selectedCompressorBrand) {
        const filteredModels = brandModels.filter((item) =>
          `${item.model} ${item.refrigerant ?? ""} ${item.application ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery),
        );
        return (
          <View>
            <Pressable
              onPress={() => {
                setSelectedCompressorBrand(null);
                setSelectedCompressorKey(null);
              }}
              style={styles.backRow}
            >
              <IconSymbol name="arrow.left" size={18} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                العودة إلى ماركات الكباسات
              </Text>
            </Pressable>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              موديلات {selectedCompressorBrand}
            </Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              {filteredModels.length} موديل — استخدم البحث لتصفية النتائج.
            </Text>
            {compareCompressorA && compareCompressorB ? (
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    marginBottom: 14,
                  },
                ]}
              >
                <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
                  مقارنة موديلين
                </Text>
                <Text style={[styles.detailsBody, { color: colors.muted }]}>
                  الفروق بين الموديلين المختارين
                </Text>
                {comparisonRows.map(([label, field]) => {
                  const valueA = String(compareCompressorA[field] ?? "—");
                  const valueB = String(compareCompressorB[field] ?? "—");
                  const isDifferent = valueA !== valueB;
                  return (
                    <View
                      key={label}
                      style={[
                        styles.detailsRowBox,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.detailsRowLabel, { color: colors.muted }]}>
                        {label}
                      </Text>
                      <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                        <Text
                          style={{
                            flex: 1,
                            color: isDifferent ? colors.primary : colors.foreground,
                            fontWeight: isDifferent ? "800" : "500",
                            textAlign: "right",
                          }}
                        >
                          {valueA}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            color: isDifferent ? colors.primary : colors.foreground,
                            fontWeight: isDifferent ? "800" : "500",
                            textAlign: "right",
                          }}
                        >
                          {valueB}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <Pressable
                  onPress={() => {
                    setCompareCompressorKeyA(null);
                    setCompareCompressorKeyB(null);
                  }}
                  style={[
                    styles.backRow,
                    { justifyContent: "center", marginTop: 8 },
                  ]}
                >
                  <Text style={[styles.backText, { color: colors.error }]}>
                    مسح المقارنة
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.sectionHint, { color: colors.muted }]}>
                اختر موديلين من زر «مقارنة» لعرضهما جنبًا إلى جنب.
              </Text>
            )}
            {filteredModels.map((item) => {
              const originalIndex = compressorModels.indexOf(item);
              const itemKey = `${item.brand}__${item.model}__${originalIndex}`;
              return (
                <Pressable
                  key={itemKey}
                  onPress={() => setSelectedCompressorKey(itemKey)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  <View
                    style={[styles.circleIcon, { backgroundColor: "#E0F7FA" }]}
                  >
                    <IconSymbol
                      name="fan.fill"
                      size={21}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                    >
                      {item.model}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.muted }]}>
                      {item.refrigerant ?? "فريون غير محدد"} ·{" "}
                      {item.application ?? "بيانات تشغيل"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleCompressorCompare(itemKey);
                    }}
                    style={{
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      backgroundColor:
                        compareCompressorKeyA === itemKey ||
                        compareCompressorKeyB === itemKey
                          ? colors.primary
                          : colors.background,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      marginRight: 6,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          compareCompressorKeyA === itemKey ||
                          compareCompressorKeyB === itemKey
                            ? colors.surface
                            : colors.primary,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {compareCompressorKeyA === itemKey ||
                      compareCompressorKeyB === itemKey
                        ? "تم الاختيار"
                        : "مقارنة"}
                    </Text>
                  </Pressable>
                  <IconSymbol
                    name="chevron.right"
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              );
            })}
          </View>
        );
      }
      const visibleBrands = compressorBrandNames.filter((brand) => {
        if (!normalizedQuery) return true;
        return (
          brand.toLowerCase().includes(normalizedQuery) ||
          compressorModels.some(
            (item) =>
              item.brand === brand &&
              `${item.model} ${item.refrigerant ?? ""} ${item.application ?? ""}`
                .toLowerCase()
                .includes(normalizedQuery),
          )
        );
      });
      return (
        <View>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>
            تم تنظيم {compressorModels.length.toLocaleString("ar-EG")} موديلًا
            من {compressorBrandNames.length} ماركة.
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن ماركة أو موديل كباس..."
            placeholderTextColor={colors.muted}
            style={[
              styles.searchInput,
              {
                color: colors.foreground,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
          {visibleBrands.map((brand) => {
            const count = compressorModels.filter(
              (item) => item.brand === brand,
            ).length;
            return (
              <Pressable
                key={brand}
                onPress={() => {
                  setSelectedCompressorBrand(brand);
                  setSelectedCompressorKey(null);
                }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: "#0E7490" }]}>
                  <Text style={styles.avatarText}>{brand[0]}</Text>
                </View>
                <View style={styles.cardCopy}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {brand}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {count} موديل محفوظ
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            );
          })}
        </View>
      );
    }
    if (key === "brands") {
      const brand = brandList.find((item) => item.id === selectedBrand);
      if (selectedBrand && brand) {
        const modelNames = brand.models;
        if (selectedModel) {
          return (
            <View>
              <Pressable
                onPress={() => setSelectedModel(null)}
                style={styles.backRow}
              >
                <IconSymbol
                  name="arrow.left"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.backText, { color: colors.primary }]}>
                  العودة إلى موديلات {brand.name}
                </Text>
              </Pressable>
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: "#0E7490" }]}>
                  <Text style={styles.avatarText}>{brand.name[0]}</Text>
                </View>
                <Text
                  style={[styles.detailsTitle, { color: colors.foreground }]}
                >
                  {selectedModel}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الماركة: {brand.name} ({brand.local})
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الفئة: أجهزة تكييف HVAC
                </Text>
                <Text style={[styles.detailsBody, { color: colors.muted }]}>
                  اضغط على زر الرجوع لاختيار موديل آخر من نفس الماركة.
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View>
            <Pressable
              onPress={() => setSelectedBrand(null)}
              style={styles.backRow}
            >
              <IconSymbol name="arrow.left" size={18} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                العودة إلى الماركات
              </Text>
            </Pressable>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              موديلات {brand.name}
            </Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              اختر موديلًا لعرض بياناته.
            </Text>
            {modelNames.map((model) => (
              <Pressable
                key={model}
                onPress={() => setSelectedModel(model)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <View
                  style={[styles.circleIcon, { backgroundColor: "#E0F7FA" }]}
                >
                  <IconSymbol
                    name="fan.fill"
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cardCopy}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {model}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    اضغط لعرض التفاصيل
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            ))}
          </View>
        );
      }
      return brandList.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            setSelectedBrand(item.id);
            setSelectedModel(null);
          }}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.72 },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: "#0E7490" }]}>
            <Text style={styles.avatarText}>{item.name[0]}</Text>
          </View>
          <View style={styles.cardCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {item.name}
            </Text>
            <Text style={[styles.cardSub, { color: colors.muted }]}>
              {item.local} · {item.models.length} موديل محفوظ
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </Pressable>
      ));
    }
    if (key === "refrigerants") {
      const filteredRefrigerants = refrigerants.filter(
        (item) =>
          !normalizedQuery ||
          `${item.name} ${item.use} ${item.oil} ${item.note}`
            .toLowerCase()
            .includes(normalizedQuery),
      );
      const selected = refrigerants.find(
        (item) => item.id === selectedRefrigerant,
      );
      return (
        <View>
          {selected && (
            <>
              <Pressable
                onPress={() => setSelectedRefrigerant(null)}
                style={styles.backRow}
              >
                <IconSymbol
                  name="arrow.left"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.backText, { color: colors.primary }]}>
                  العودة إلى الفريونات
                </Text>
              </Pressable>
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View
                  style={[styles.circleIcon, { backgroundColor: "#E0F7FA" }]}
                >
                  <IconSymbol name="snowflake" size={24} color="#0891B2" />
                </View>
                <Text
                  style={[styles.detailsTitle, { color: colors.foreground }]}
                >
                  {selected.name}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الاستخدام: {selected.use}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  نوع الزيت: {selected.oil}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  طريقة الشحن:{" "}
                  {selected.charging ?? "حسب التطبيق وتعليمات الشركة المصنعة"}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  النوع: {selected.compositionType ?? "حسب تركيبة المنتج"}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  عبارة عن: {selected.composition ?? selected.name}
                </Text>
                <View style={styles.cylinderRow}>
                  <Text
                    style={[styles.detailsRow, { color: colors.foreground }]}
                  >
                    لون الأسطوانة:{" "}
                    {selected.cylinderColor ?? "غير محدد — راجع الملصق"}
                  </Text>
                  <View
                    style={[
                      styles.cylinderSwatch,
                      {
                        backgroundColor: selected.cylinderColorHex ?? "#B7C4B0",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.cylinderDisclaimer, { color: colors.muted }]}
                >
                  اللون مرجعي فقط وقد يختلف حسب الشركة أو الدولة؛ اعتمد على اسم
                  الفريون والملصق وتعليمات الشركة المصنعة.
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  GWP: {selected.gwp}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  ODP: {selected.odp}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  تصنيف ASHRAE: {selected.ashraeClass}
                </Text>
                <View style={[styles.advice, { backgroundColor: "#FFF7ED" }]}>
                  <IconSymbol name="warning" size={20} color="#F97316" />
                  <Text style={styles.adviceText}>
                    {selected.compatibilityWarning}
                  </Text>
                </View>
                <Text style={[styles.detailsLabel, { color: colors.primary }]}>
                  ملاحظة السلامة
                </Text>
                <Text
                  style={[styles.detailsBody, { color: colors.foreground }]}
                >
                  {selected.note}
                </Text>
              </View>
            </>
          )}
          {!selected &&
            (filteredRefrigerants.length ? (
              filteredRefrigerants.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedRefrigerant(item.id)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  <View
                    style={[styles.circleIcon, { backgroundColor: "#E0F7FA" }]}
                  >
                    <IconSymbol name="snowflake" size={21} color="#0891B2" />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.muted }]}>
                      {item.use} · زيت {item.oil}
                    </Text>
                    <Text style={[styles.note, { color: colors.warning }]}>
                      {item.note}
                    </Text>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              ))
            ) : (
              <Text style={[styles.emptySearch, { color: colors.muted }]}>
                لا يوجد فريون مطابق للبحث.
              </Text>
            ))}
        </View>
      );
    }
    if (key === "parts") {
      const selected = spareParts.find((item) => item.id === selectedPart);
      return (
        <View>
          {selected && (
            <>
              <Pressable
                onPress={() => setSelectedPart(null)}
                style={styles.backRow}
              >
                <IconSymbol
                  name="arrow.left"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.backText, { color: colors.primary }]}>
                  العودة إلى قطع الغيار
                </Text>
              </Pressable>
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View
                  style={[styles.circleIcon, { backgroundColor: "#E8F1F5" }]}
                >
                  <IconSymbol name="settings" size={24} color="#475569" />
                </View>
                <Text
                  style={[styles.detailsTitle, { color: colors.foreground }]}
                >
                  {selected.name}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الاسم بالإنجليزية: {selected.english}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  التصنيف: {selected.group}
                </Text>
                <Text style={[styles.detailsLabel, { color: colors.primary }]}>
                  الوظيفة والمطابقة
                </Text>
                <Text
                  style={[styles.detailsBody, { color: colors.foreground }]}
                >
                  {selected.detail}
                </Text>
                <View style={[styles.advice, { backgroundColor: "#FFF7ED" }]}>
                  <IconSymbol name="warning" size={20} color="#F97316" />
                  <Text style={styles.adviceText}>
                    طابق رقم القطعة والجهد والسعة ونوع الجهاز مع دليل الشركة قبل
                    الاستبدال.
                  </Text>
                </View>
              </View>
            </>
          )}
          {!selected &&
            spareParts.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedPart(item.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <View
                  style={[styles.circleIcon, { backgroundColor: "#E8F1F5" }]}
                >
                  <IconSymbol name="settings" size={21} color="#475569" />
                </View>
                <View style={styles.cardCopy}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {item.english} · {item.group}
                  </Text>
                  <Text style={[styles.note, { color: colors.muted }]}>
                    اضغط لعرض التفاصيل
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            ))}
        </View>
      );
    }
    if (key === "materials") {
      const allMaterials: MaterialRecord[] = customMaterials.map((item) => ({
        ...item,
        name: item.nameAr,
        english: item.nameEn,
        unit: item.category,
        detail: `${item.nameEn} · ${item.category} · ${item.size || "بدون مقاس إضافي"}`,
      }));
      const selected = allMaterials.find(
        (item) => item.id === selectedMaterial,
      );
      const selectedOrderMaterial = allMaterials.find(
        (item) => item.id === orderMaterialId,
      );
      const addOrderItem = () => {
        if (!selectedOrderMaterial) return;
        const quantity = Math.max(1, Number.parseInt(orderQuantity, 10) || 1);
        setOrderItems((items) => {
          const existing = items.find(
            (item) => item.material.id === selectedOrderMaterial.id,
          );
          return existing
            ? items.map((item) =>
                item.material.id === selectedOrderMaterial.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...items, { material: selectedOrderMaterial, quantity }];
        });
        setOrderMaterialId(null);
        setOrderQuantity("1");
        setOrderPickerOpen(false);
      };
      const exportOrderPdf = async () => {
        if (!orderItems.length) return;
        const rows = orderItems
          .map(
            (item) =>
              `<tr><td>${item.material.name}</td><td>${item.material.english}</td><td>${item.material.unit}</td><td>${item.material.size || "—"}</td><td>${item.quantity}</td></tr>`,
          )
          .join("");
        const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}h1{text-align:center;color:#0e7490}p{font-size:14px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #94a3b8;padding:10px;text-align:right}th{background:#cffafe;color:#0f172a}</style></head><body><h1>طلب خامات من المخزن</h1><p>HVAC TECH PRO</p><table><thead><tr><th>الخامة</th><th>English</th><th>الوحدة</th><th>المقاس/الحجم</th><th>العدد</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
        try {
          const { uri } = await Print.printToFileAsync({ html, base64: false });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: "application/pdf",
              dialogTitle: "مشاركة طلب المخزن",
              UTI: "com.adobe.pdf",
            });
          }
        } catch {
          // Keep the screen usable if the Android share sheet is unavailable.
        }
      };
      const sendToWarehouse = async () => {
        if (orderItems.length) await exportOrderPdf();
      };
      return (
        <View>
          {selected && (
            <>
              <Pressable
                onPress={() => setSelectedMaterial(null)}
                style={styles.backRow}
              >
                <IconSymbol
                  name="arrow.left"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.backText, { color: colors.primary }]}>
                  العودة إلى الخامات
                </Text>
              </Pressable>
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View
                  style={[styles.circleIcon, { backgroundColor: "#D9F6FA" }]}
                >
                  <IconSymbol
                    name="wrench.and.screwdriver.fill"
                    size={24}
                    color="#0E7490"
                  />
                </View>
                <Text
                  style={[styles.detailsTitle, { color: colors.foreground }]}
                >
                  {selected.name}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الاسم بالإنجليزية: {selected.english}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  المقاس أو الحجم: {selected.size ?? "غير محدد"}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  التصنيف / الوحدة: {selected.unit}
                </Text>
                <Text style={[styles.detailsLabel, { color: colors.primary }]}>
                  الاستخدام والمواصفات
                </Text>
                <Text
                  style={[styles.detailsBody, { color: colors.foreground }]}
                >
                  {selected.detail}
                </Text>
              </View>
            </>
          )}
          {!selected && (
            <>
              <View style={styles.materialActionRow}>
                <Pressable
                  onPress={sendToWarehouse}
                  style={[
                    styles.materialActionButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <IconSymbol name="bookmark.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.materialActionText}>إرسال للمخزن</Text>
                </Pressable>
                <Pressable
                  onPress={exportOrderPdf}
                  style={[
                    styles.materialActionButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <IconSymbol
                    name="doc.text.fill"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.materialActionText,
                      { color: colors.primary },
                    ]}
                  >
                    تصدير PDF
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.materialHint, { color: colors.muted }]}>
                اضغط على زر + لإضافة الخامات المطلوبة بالعدد إلى طلب المخزن.
              </Text>
              <View
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[styles.detailsTitle, { color: colors.foreground }]}
                >
                  قائمة طلب المخزن
                </Text>
                {orderItems.length ? (
                  orderItems.map((item) => (
                    <View
                      key={item.material.id}
                      style={[
                        styles.orderRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <Pressable
                        onPress={() =>
                          setOrderItems((items) =>
                            items.filter(
                              (x) => x.material.id !== item.material.id,
                            ),
                          )
                        }
                        style={styles.removeOrder}
                      >
                        <Text style={styles.removeOrderText}>×</Text>
                      </Pressable>
                      <View style={styles.orderCopy}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {item.material.name}
                        </Text>
                        <Text style={[styles.cardSub, { color: colors.muted }]}>
                          {item.material.english} · {item.material.unit}
                          {item.material.size
                            ? ` · ${item.material.size}`
                            : ""}{" "}
                          · العدد: {item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptySearch, { color: colors.muted }]}>
                    لم تتم إضافة خامات للطلب بعد.
                  </Text>
                )}
              </View>
              {orderPickerOpen && (
                <View
                  style={[
                    styles.orderPicker,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[styles.detailsLabel, { color: colors.primary }]}
                  >
                    اختر خامة محفوظة
                  </Text>
                  {allMaterials.length ? (
                    allMaterials.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => setOrderMaterialId(item.id)}
                        style={[
                          styles.dropdownItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor:
                              orderMaterialId === item.id
                                ? "#EDE9FE"
                                : colors.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              color:
                                orderMaterialId === item.id
                                  ? "#0F172A"
                                  : colors.foreground,
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.cardSub,
                            {
                              color:
                                orderMaterialId === item.id
                                  ? "#475569"
                                  : colors.muted,
                            },
                          ]}
                        >
                          {item.english} · {item.unit}
                          {item.size ? ` · ${item.size}` : ""}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={[styles.emptySearch, { color: colors.muted }]}>
                      لا توجد خامات محفوظة. أضف خامة من الإعدادات أولًا.
                    </Text>
                  )}
                  {orderMaterialId && (
                    <>
                      <TextInput
                        value={orderQuantity}
                        onChangeText={setOrderQuantity}
                        keyboardType="number-pad"
                        placeholder="العدد"
                        placeholderTextColor={colors.muted}
                        style={[
                          styles.search,
                          {
                            color: colors.foreground,
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      />
                      <Pressable
                        onPress={addOrderItem}
                        style={styles.primaryButton}
                      >
                        <IconSymbol name="plus" size={19} color="#FFFFFF" />
                        <Text style={styles.primaryText}>إضافة للطلب</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
              <Pressable
                onPress={() => setOrderPickerOpen((open) => !open)}
                style={[
                  styles.floatingAdd,
                  { backgroundColor: colors.primary },
                ]}
              >
                <IconSymbol
                  name={orderPickerOpen ? "chevron.down" : "plus"}
                  size={30}
                  color="#FFFFFF"
                />
              </Pressable>
            </>
          )}
        </View>
      );
    }
    if (key === "error-codes") {
      const staticResults = filteredCodes.map((item) => ({
        id: item.id,
        code: item.code,
        brand: item.brand,
        model: item.model,
        drive: item.drive,
        problem: item.title,
        solution: `${item.cause} ${item.steps.join(" ")}`,
        type: item.type,
      }));
      const customResults = filteredCustomCodes.map((item) => ({
        id: item.id,
        code: item.code,
        brand: item.brand,
        model: item.model,
        drive: item.drive,
        problem: item.problem,
        solution: item.solution,
        type: item.type,
      }));
      const results = [...staticResults, ...customResults];
      return normalizedQuery ? (
        results.length ? (
          <View>
            {results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedError(item)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <View
                  style={[styles.circleIcon, { backgroundColor: "#FFF1E8" }]}
                >
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
                <View style={styles.cardCopy}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {item.brand} · {item.problem}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {item.model} · {item.drive} · {item.type}
                  </Text>
                  <Text style={[styles.note, { color: colors.muted }]}>
                    اضغط لعرض كل التفاصيل
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            ))}
            {selectedError && (
              <View
                style={[
                  styles.errorDetails,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[styles.detailsTitle, { color: colors.foreground }]}
                >
                  تفاصيل كود العطل {selectedError.code}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  نوع الجهاز: {selectedError.type}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الماركة: {selectedError.brand}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  الموديل: {selectedError.model}
                </Text>
                <Text style={[styles.detailsRow, { color: colors.foreground }]}>
                  نوع التشغيل: {selectedError.drive}
                </Text>
                <Text style={[styles.detailsLabel, { color: colors.primary }]}>
                  وصف العطل
                </Text>
                <Text
                  style={[styles.detailsBody, { color: colors.foreground }]}
                >
                  {selectedError.problem}
                </Text>
                <Text style={[styles.detailsLabel, { color: colors.primary }]}>
                  الحل
                </Text>
                <Text
                  style={[styles.detailsBody, { color: colors.foreground }]}
                >
                  {selectedError.solution}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={[styles.emptySearch, { color: colors.muted }]}>
            لا يوجد عطل بهذا الكود لهذا النوع من الأجهزة.
          </Text>
        )
      ) : (
        <Text style={[styles.emptySearch, { color: colors.muted }]}>
          اكتب كود العطل للبحث، مثل F1 أو f1.
        </Text>
      );
    }
    if (key === "search")
      return errorCodes
        .filter(
          (x) =>
            !query ||
            `${x.code} ${x.brand} ${x.title}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setInput(item.code)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.circleIcon, { backgroundColor: "#FFF1E8" }]}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {item.brand} · {item.title}
              </Text>
              <Text style={[styles.cardSub, { color: colors.muted }]}>
                {item.english}
              </Text>
              <Text style={[styles.note, { color: colors.muted }]}>
                افحص: {item.steps[0]}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
        ));
    if (key === "calculators")
      return (
        <View style={styles.calcWrap}>
          <Text style={[styles.question, { color: colors.foreground }]}>
            المجال
          </Text>
          <Pressable
            onPress={() => setOpenCalculatorCategory((open) => !open)}
            style={[
              styles.diagnosisPicker,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.pickerPlaceholder, { color: colors.foreground }]}
            >
              {calcCategory}
            </Text>
            <IconSymbol
              name={openCalculatorCategory ? "chevron.down" : "chevron.right"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
          {openCalculatorCategory && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {Object.keys(calculatorOptions).map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    setCalcCategory(category);
                    const conversion = calculatorOptions[category][0];
                    const units = calculatorUnits[conversion];
                    setCalcConversion(conversion);
                    setCalcFromUnit(units[0]);
                    setCalcToUnit(units[1] ?? units[0]);
                    setCalcValue("");
                    setOpenCalculatorCategory(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor:
                        calcCategory === category ? "#EDE9FE" : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      {
                        color:
                          calcCategory === category
                            ? "#5B21B6"
                            : colors.foreground,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={[styles.question, { color: colors.foreground }]}>
            نوع التحويل
          </Text>
          <View style={styles.calcOptions}>
            {calculatorOptions[calcCategory].map((conversion) => (
              <Pressable
                key={conversion}
                onPress={() => {
                  const units = calculatorUnits[conversion];
                  setCalcConversion(conversion);
                  setCalcFromUnit(units[0]);
                  setCalcToUnit(units[1] ?? units[0]);
                  setCalcValue("");
                }}
                style={[
                  styles.calcOption,
                  {
                    borderColor:
                      calcConversion === conversion
                        ? colors.primary
                        : colors.border,
                    backgroundColor:
                      calcConversion === conversion
                        ? "#EDE9FE"
                        : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.calcOptionText,
                    {
                      color:
                        calcConversion === conversion
                          ? "#5B21B6"
                          : colors.foreground,
                    },
                  ]}
                >
                  {conversion}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.unitRow}>
            <View style={styles.unitBox}>
              <Text style={[styles.unitLabel, { color: colors.muted }]}>
                من وحدة
              </Text>
              {(calculatorUnits[calcConversion] ?? []).map((unit) => (
                <Pressable
                  key={`from-${unit}`}
                  onPress={() => setCalcFromUnit(unit)}
                  style={[
                    styles.unitOption,
                    {
                      borderColor:
                        calcFromUnit === unit ? colors.primary : colors.border,
                      backgroundColor:
                        calcFromUnit === unit ? "#EDE9FE" : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      {
                        color:
                          calcFromUnit === unit ? "#5B21B6" : colors.foreground,
                      },
                    ]}
                  >
                    {unit}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.unitBox}>
              <Text style={[styles.unitLabel, { color: colors.muted }]}>
                إلى وحدة
              </Text>
              {(calculatorUnits[calcConversion] ?? []).map((unit) => (
                <Pressable
                  key={`to-${unit}`}
                  onPress={() => setCalcToUnit(unit)}
                  style={[
                    styles.unitOption,
                    {
                      borderColor:
                        calcToUnit === unit ? colors.primary : colors.border,
                      backgroundColor:
                        calcToUnit === unit ? "#EDE9FE" : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      {
                        color:
                          calcToUnit === unit ? "#5B21B6" : colors.foreground,
                      },
                    ]}
                  >
                    {unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View
            style={[
              styles.calcCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <IconSymbol name="calculator" size={22} color={colors.primary} />
            <Text style={[styles.calcTitle, { color: colors.foreground }]}>
              {calcFromUnit} إلى {calcToUnit}
            </Text>
            {calcConversion === "السعة التبريدية" && (
              <Text style={[styles.calcHint, { color: colors.muted }]}>
                حصان تبريد اسمي: 1 HP تبريد = 8000 BTU/h وفق مرجع Cooling Tools.
              </Text>
            )}
            {calcConversion === "القدرة" && (
              <Text style={[styles.calcHint, { color: colors.muted }]}>
                هذه قدرة: الحصان المتري = 735.499 W، والحصان الإمبراطوري =
                745.700 W، وBTU/h وحدة قدرة.
              </Text>
            )}
            {calcConversion === "الطاقة" && (
              <Text style={[styles.calcHint, { color: colors.muted }]}>
                هذه طاقة: BTU وkWh وhp·h وحدات طاقة، وليست BTU/h أو حصان تبريد.
              </Text>
            )}
            <TextInput
              value={calcValue}
              onChangeText={setCalcValue}
              keyboardType="decimal-pad"
              placeholder={`أدخل القيمة بـ ${calcFromUnit}`}
              placeholderTextColor={colors.muted}
              style={[
                styles.calcInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
            <Text style={[styles.resultLabel, { color: colors.muted }]}>
              النتيجة
            </Text>
            <View
              style={[
                styles.resultBox,
                { backgroundColor: "#F5F3FF", borderColor: "#C4B5FD" },
              ]}
            >
              <Text style={[styles.result, { color: "#5B21B6" }]}>
                {calcResult === null
                  ? "أدخل قيمة صحيحة لعرض النتيجة"
                  : `${calcResult.toFixed(3)} ${calcToUnit}`}
              </Text>
            </View>
          </View>
        </View>
      );
    if (key === "diagnosis") {
      const selectedItems = savedDiagnoses.filter((d) => d.type === input);
      return (
        <View>
          <Text style={[styles.question, { color: colors.foreground }]}>
            نوع الجهاز
          </Text>
          <View style={styles.choiceRow}>
            {["سبليت", "مركزي", "غرف تبريد", "VRF"].map((x) => (
              <Pressable
                key={x}
                onPress={() => {
                  setInput(x);
                  setOpenType(null);
                  setSelectedDiagnosis(null);
                }}
                style={[
                  styles.choice,
                  {
                    borderColor: input === x ? colors.primary : colors.border,
                    backgroundColor: input === x ? "#D9F6FA" : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    { color: input === x ? "#063B4A" : colors.foreground },
                  ]}
                >
                  {x}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>
            المشكلة الأساسية
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="مثال: التكييف لا يبرد"
            placeholderTextColor={colors.muted}
            style={[
              styles.largeInput,
              {
                color: colors.foreground,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
          <View style={[styles.advice, { backgroundColor: "#FFF7ED" }]}>
            <IconSymbol name="warning" size={20} color="#F97316" />
            <Text style={styles.adviceText}>
              ابدأ بقياس ضغط السحب والطرد والأمبير، وقارن القراءات بمواصفات
              الجهاز وظروف التشغيل.
            </Text>
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>
            تشخيصات {input || "الجهاز"}
          </Text>
          <Pressable
            onPress={() => input && setOpenType(openType ? null : input)}
            style={[
              styles.diagnosisPicker,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.pickerPlaceholder,
                { color: selectedDiagnosis ? colors.foreground : colors.muted },
              ]}
            >
              {selectedDiagnosis
                ? selectedDiagnosis.problem
                : input
                  ? `اضغط لاختيار مشكلة محفوظة في ${input}`
                  : "اختر نوع الجهاز أولاً"}
            </Text>
            <IconSymbol
              name={openType ? "chevron.down" : "chevron.right"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
          {openType === input && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {selectedItems.length ? (
                selectedItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedDiagnosis(item);
                      setQuery(item.problem);
                      setOpenType(null);
                    }}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.savedProblem,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.problem}
                    </Text>
                    <Text
                      style={[styles.savedSolution, { color: "#164E63" }]}
                      numberOfLines={2}
                    >
                      {item.solution}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={[styles.dropdownEmpty, { color: colors.muted }]}>
                  لا توجد تشخيصات محفوظة لهذا النوع
                </Text>
              )}
            </View>
          )}
          {selectedDiagnosis && (
            <View
              style={[
                styles.selectedSolution,
                { backgroundColor: "#E8F7FA", borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.solutionLabel, { color: "#0E7490" }]}>
                الحل
              </Text>
              <Text style={[styles.selectedSolutionText, { color: "#083344" }]}>
                {selectedDiagnosis.solution}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.indicatorCard,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.indicatorTitle, { color: colors.foreground }]}>
              مؤشرات تشخيص الأعطال
            </Text>
            <Text style={[styles.indicatorHint, { color: colors.muted }]}>
              اضغط على أي صف لعرض الملاحظة الميدانية. الأسهم توضح الاتجاه العام
              مقارنة بالتشغيل الطبيعي.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.indicatorTable}>
                <View style={[styles.indicatorRow, styles.indicatorHeader]}>
                  <Text
                    style={[
                      styles.indicatorFaultCell,
                      styles.indicatorHeaderText,
                    ]}
                  >
                    الأعطال
                  </Text>
                  <Text
                    style={[styles.indicatorCell, styles.indicatorHeaderText]}
                  >
                    ضغط الطرد
                  </Text>
                  <Text
                    style={[styles.indicatorCell, styles.indicatorHeaderText]}
                  >
                    خط السحب
                  </Text>
                  <Text
                    style={[styles.indicatorCell, styles.indicatorHeaderText]}
                  >
                    السوبر هيت
                  </Text>
                  <Text
                    style={[styles.indicatorCell, styles.indicatorHeaderText]}
                  >
                    السوبر كول
                  </Text>
                  <Text
                    style={[styles.indicatorCell, styles.indicatorHeaderText]}
                  >
                    الأمبير
                  </Text>
                </View>
                {diagnosisIndicators.map((row, index) => (
                  <Pressable
                    key={row.id}
                    onPress={() =>
                      setSelectedIndicatorId(
                        selectedIndicatorId === row.id ? null : row.id,
                      )
                    }
                    style={[
                      styles.indicatorRow,
                      {
                        backgroundColor:
                          selectedIndicatorId === row.id
                            ? "#E0F7FA"
                            : index % 2
                              ? "#FFF1D6"
                              : "#FFFFFF",
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.indicatorFaultCell,
                        styles.indicatorValueText,
                        { color: "#0F172A" },
                      ]}
                    >
                      {row.fault}
                      {"\n"}
                      <Text style={styles.indicatorEnglish}>{row.english}</Text>
                    </Text>
                    <Text
                      style={[
                        styles.indicatorCell,
                        styles.indicatorValueText,
                        {
                          color: row.discharge.includes("مرتفع")
                            ? "#16A34A"
                            : "#DC2626",
                        },
                      ]}
                    >
                      {row.discharge}
                    </Text>
                    <Text
                      style={[
                        styles.indicatorCell,
                        styles.indicatorValueText,
                        {
                          color: row.suction.includes("مرتفع")
                            ? "#16A34A"
                            : "#DC2626",
                        },
                      ]}
                    >
                      {row.suction}
                    </Text>
                    <Text
                      style={[
                        styles.indicatorCell,
                        styles.indicatorValueText,
                        {
                          color: row.superheat.includes("مرتفع")
                            ? "#16A34A"
                            : "#DC2626",
                        },
                      ]}
                    >
                      {row.superheat}
                    </Text>
                    <Text
                      style={[
                        styles.indicatorCell,
                        styles.indicatorValueText,
                        {
                          color: row.subcooling.includes("مرتفع")
                            ? "#16A34A"
                            : "#DC2626",
                        },
                      ]}
                    >
                      {row.subcooling}
                    </Text>
                    <Text
                      style={[
                        styles.indicatorCell,
                        styles.indicatorValueText,
                        {
                          color: row.amp.includes("مرتفع")
                            ? "#16A34A"
                            : "#DC2626",
                        },
                      ]}
                    >
                      {row.amp}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {selectedIndicatorId && (
              <View
                style={[
                  styles.indicatorNote,
                  { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
                ]}
              >
                <Text style={[styles.solutionLabel, { color: "#047857" }]}>
                  ملاحظة ميدانية
                </Text>
                <Text
                  style={[styles.selectedSolutionText, { color: "#064E3B" }]}
                >
                  {
                    diagnosisIndicators.find(
                      (row) => row.id === selectedIndicatorId,
                    )?.note
                  }
                </Text>
              </View>
            )}
            <Text style={[styles.indicatorDisclaimer, { color: colors.muted }]}>
              هذه مؤشرات إرشادية وليست حكمًا نهائيًا؛ يجب مقارنتها بدرجة الحرارة
              والحمل وبيانات لوحة الجهاز.
            </Text>
            <View
              style={[
                styles.fieldGuideSection,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[styles.indicatorTitle, { color: colors.foreground }]}
              >
                تشخيصات الفحص السريع
              </Text>
              <Text style={[styles.indicatorHint, { color: colors.muted }]}>
                اختر الظاهرة أو العطل لعرض الأسباب وخطوات الفحص الميداني. تم نقل
                المحتوى من المراجع إلى نص قابل للقراءة والبحث.
              </Text>
              {fieldDiagnosisGuides.map((guide) => {
                const isOpen = selectedFieldGuideId === guide.id;
                return (
                  <View
                    key={guide.id}
                    style={[
                      styles.fieldGuideCard,
                      {
                        backgroundColor: isOpen ? "#E0F7FA" : colors.surface,
                        borderColor: isOpen ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        setSelectedFieldGuideId(isOpen ? null : guide.id)
                      }
                      style={styles.fieldGuideHeader}
                    >
                      <View
                        style={[
                          styles.fieldGuideBadge,
                          { backgroundColor: "#FFE4B5" },
                        ]}
                      >
                        <Text style={styles.fieldGuideBadgeText}>
                          {guide.category}
                        </Text>
                      </View>
                      <View style={styles.fieldGuideTitleWrap}>
                        <Text
                          style={[
                            styles.fieldGuideTitle,
                            { color: isOpen ? "#0F172A" : colors.foreground },
                          ]}
                        >
                          {guide.title}
                        </Text>
                        <Text
                          style={[
                            styles.fieldGuideEnglish,
                            { color: isOpen ? "#475569" : colors.muted },
                          ]}
                        >
                          {guide.english}
                        </Text>
                      </View>
                      <IconSymbol
                        name={isOpen ? "chevron.down" : "chevron.right"}
                        size={20}
                        color={colors.primary}
                      />
                    </Pressable>
                    {isOpen && (
                      <View style={styles.fieldGuideBody}>
                        <Text
                          style={[styles.fieldGuideLabel, { color: "#9A5B00" }]}
                        >
                          الأسباب / الظواهر
                        </Text>
                        {guide.causes.map((cause) => (
                          <Text
                            key={cause}
                            style={[
                              styles.fieldGuideText,
                              { color: "#0F172A" },
                            ]}
                          >
                            • {cause}
                          </Text>
                        ))}
                        <Text
                          style={[styles.fieldGuideLabel, { color: "#16A36A" }]}
                        >
                          الحل / خطوات الفحص الميداني
                        </Text>
                        {guide.steps.map((step, index) => (
                          <Text
                            key={step}
                            style={[
                              styles.fieldGuideText,
                              { color: "#0F172A" },
                            ]}
                          >
                            {index + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      );
    }
    if (key === "assistant")
      return (
        <View>
          <View style={[styles.chatBubble, { backgroundColor: "#E0F7FA" }]}>
            <Text style={[styles.chatText, { color: colors.foreground }]}>
              مرحبًا، اكتب وصف العطل وسأساعدك في ترتيب الأسئلة وقراءات الفحص.
            </Text>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            multiline
            placeholder="مثال: تكييف Carrier مش بارد والكباس شغال..."
            placeholderTextColor={colors.muted}
            style={[
              styles.largeInput,
              {
                color: colors.foreground,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                minHeight: 120,
              },
            ]}
          />
          <Pressable
            onPress={() => setInput("تم تجهيز خطوات الفحص")}
            style={styles.primaryButton}
          >
            <IconSymbol name="sparkles" size={19} color="#FFFFFF" />
            <Text style={styles.primaryText}>تحليل المشكلة</Text>
          </Pressable>
          {input ? (
            <View
              style={[
                styles.stepCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                خطوات مقترحة
              </Text>
              {[
                "افحص الفلاتر وتدفق الهواء",
                "قِس ضغط السحب والطرد",
                "قِس الأمبير وفرق الحرارة ΔT",
                "افحص المكثف والتسريب",
              ].map((x, i) => (
                <Text
                  key={x}
                  style={[styles.step, { color: colors.foreground }]}
                >
                  {i + 1}. {x}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      );
    return <View />;
  };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {current.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {current.subtitle}
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: "#E0F7FA" }]}>
            <IconSymbol name={current.icon} size={22} color={colors.primary} />
          </View>
        </View>
        {key === "error-codes" && (
          <>
            <Text style={[styles.question, { color: colors.foreground }]}>
              نوع الجهاز
            </Text>
            <View style={styles.errorDeviceRow}>
              {(["سبليت", "مركزي", "غرف تبريد", "VRF"] as HvacDeviceType[]).map(
                (item) => (
                  <Pressable
                    key={item}
                    onPress={() => setErrorDevice(item)}
                    style={[
                      styles.errorDevice,
                      {
                        backgroundColor:
                          errorDevice === item ? "#D9F6FA" : colors.surface,
                        borderColor:
                          errorDevice === item ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.errorDeviceText,
                        {
                          color:
                            errorDevice === item
                              ? "#063B4A"
                              : colors.foreground,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
              placeholder="اكتب كود العطل مثل F1 أو f1"
              placeholderTextColor={colors.muted}
              style={[
                styles.search,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            />
          </>
        )}
        {(key === "search" || key === "refrigerants") &&
          !selectedRefrigerant && (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                key === "refrigerants"
                  ? "ابحث عن الفريون مثل R32 أو R410A"
                  : "ابحث بالعربي أو English..."
              }
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={[
                styles.search,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            />
          )}
        {renderCards()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  titleBlock: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 12, marginTop: 3, textAlign: "right" },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    textAlign: "right",
    marginBottom: 14,
    fontSize: 14,
  },
  card: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 11,
    marginBottom: 10,
  },
  cardCopy: { flex: 1, alignItems: "flex-end" },
  cardTitle: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  cardSub: { fontSize: 11, marginTop: 4, textAlign: "right" },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    textAlign: "right",
    fontSize: 13,
    marginBottom: 14,
  },
  note: { fontSize: 11, marginTop: 7, lineHeight: 17, textAlign: "right" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  circleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: { color: "#C2410C", fontSize: 12, fontWeight: "900" },
  calcWrap: { gap: 10 },
  calcOptions: { gap: 8, marginBottom: 8 },
  unitRow: { flexDirection: "row-reverse", gap: 8, marginBottom: 8 },
  unitBox: { flex: 1, gap: 6 },
  unitLabel: { fontSize: 11, fontWeight: "700", textAlign: "right" },
  unitOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
    minHeight: 36,
    justifyContent: "center",
  },
  unitOptionText: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  calcOption: {
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  calcOptionText: { fontSize: 13, fontWeight: "700", textAlign: "right" },
  calcCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 8 },
  calcTitle: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  calcHint: { fontSize: 11, lineHeight: 17, textAlign: "right" },
  calcInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    textAlign: "right",
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 5,
  },
  resultBox: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    minHeight: 52,
    justifyContent: "center",
  },
  result: { fontSize: 16, fontWeight: "900", textAlign: "right" },
  question: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 10,
    marginTop: 8,
  },
  choiceRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  choice: {
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  choiceText: { fontSize: 13, fontWeight: "700" },
  largeInput: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    textAlign: "right",
    fontSize: 13,
    marginBottom: 14,
  },
  advice: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row-reverse",
    gap: 9,
    alignItems: "flex-start",
  },
  adviceText: {
    flex: 1,
    color: "#9A3412",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "right",
  },
  chatBubble: { borderRadius: 17, padding: 14, marginBottom: 14 },
  chatText: { textAlign: "right", lineHeight: 21, fontSize: 13 },
  primaryButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: "#0E7490",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  stepCard: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 10 },
  step: { fontSize: 13, textAlign: "right" },
  diagnosisPicker: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pickerPlaceholder: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
  },
  dropdownItem: { padding: 13, borderBottomWidth: 1 },
  dropdownEmpty: { padding: 14, textAlign: "right", fontSize: 12 },
  selectedSolution: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    marginTop: 10,
  },
  solutionLabel: {
    textAlign: "right",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },
  selectedSolutionText: { textAlign: "right", fontSize: 14, lineHeight: 22 },
  savedProblem: { textAlign: "right", fontSize: 13, fontWeight: "700" },
  savedSolution: {
    textAlign: "right",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  errorDeviceRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 12,
  },
  errorDevice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  errorDeviceText: { fontSize: 12, fontWeight: "800" },
  errorDetails: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    gap: 7,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 5,
  },
  detailsRow: { fontSize: 13, textAlign: "right" },
  detailsRowBox: {
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  detailsRowLabel: { fontSize: 11, fontWeight: "700", textAlign: "right" },
  detailsRowValue: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  detailsLabel: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 6,
  },
  detailsBody: { fontSize: 14, lineHeight: 22, textAlign: "right" },
  cylinderDisclaimer: {
    width: "100%",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "right",
  },
  cylinderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  cylinderSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  backRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 13, fontWeight: "800" },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 4,
  },
  sectionHint: { fontSize: 12, textAlign: "right", marginBottom: 12 },
  detailCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: "flex-end",
    gap: 9,
    marginBottom: 14,
  },
  emptySearch: { textAlign: "center", paddingVertical: 35, fontSize: 13 },
  materialActionRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 14,
  },
  materialActionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  materialActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  materialHint: { textAlign: "right", lineHeight: 22, marginBottom: 14 },
  orderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  orderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  orderCopy: { flex: 1, alignItems: "flex-end" },
  removeOrder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeOrderText: { color: "#DC2626", fontSize: 25, lineHeight: 28 },
  orderPicker: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  imageViewer: {
    width: "100%",
    height: 300,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
  },
  imageScroller: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  imageVerticalScroller: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  zoomRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 27,
  },
  zoomLabel: { fontSize: 12, fontWeight: "700" },
  indicatorCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  indicatorTitle: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 5,
  },
  indicatorHint: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: "right",
    marginBottom: 10,
  },
  indicatorTable: {
    width: 690,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  indicatorRow: {
    minHeight: 62,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  indicatorHeader: { minHeight: 58, backgroundColor: "#0C4A6E" },
  indicatorFaultCell: {
    width: 150,
    paddingHorizontal: 6,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900",
  },
  indicatorCell: {
    width: 108,
    paddingHorizontal: 4,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
  },
  indicatorHeaderText: { color: "#FFFFFF", lineHeight: 16 },
  indicatorValueText: { lineHeight: 17 },
  indicatorEnglish: { fontSize: 9, fontWeight: "700", color: "#475569" },
  indicatorNote: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
    marginTop: 10,
  },
  indicatorDisclaimer: {
    fontSize: 10,
    lineHeight: 17,
    textAlign: "right",
    marginTop: 10,
  },
  fieldGuideSection: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  fieldGuideCard: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
  },
  fieldGuideHeader: {
    minHeight: 68,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 9,
    padding: 10,
  },
  fieldGuideBadge: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    maxWidth: 106,
  },
  fieldGuideBadgeText: {
    color: "#075985",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  fieldGuideTitleWrap: { flex: 1, alignItems: "flex-end" },
  fieldGuideTitle: { fontSize: 14, fontWeight: "900", textAlign: "right" },
  fieldGuideEnglish: { fontSize: 10, marginTop: 3, textAlign: "right" },
  fieldGuideBody: { paddingHorizontal: 13, paddingBottom: 14, gap: 6 },
  fieldGuideLabel: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 5,
  },
  fieldGuideText: { fontSize: 12, lineHeight: 20, textAlign: "right" },
  pipeTable: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 14,
  },
  pipeRow: {
    flexDirection: "row-reverse",
    minHeight: 42,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  pipeHeader: { minHeight: 48 },
  pipeCell: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "700" },
  pressureCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
  pipeHeaderText: { color: "#0F172A", fontWeight: "900" },
  pipeNote: { width: "100%", borderRadius: 14, padding: 12, gap: 5 },
  pipeNoteTitle: {
    color: "#0E7490",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  pipeNoteText: {
    color: "#164E63",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
  },
  ptCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  ptChoiceRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  ptChoice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 88,
    alignItems: "center",
  },
  ptChoiceText: { fontSize: 12, fontWeight: "900" },
  ptGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  ptField: { width: "48%", minWidth: 135 },
  ptLabel: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 8,
    marginBottom: 5,
  },
  ptInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
  },
  ptResults: { gap: 8, marginTop: 14 },
  ptResult: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ptResultTitle: { fontSize: 12, fontWeight: "900", textAlign: "right" },
  ptResultValue: { fontSize: 16, fontWeight: "900" },
  ptHint: { fontSize: 10, lineHeight: 17, textAlign: "right", marginTop: 10 },
  floatingAdd: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 28,
  },
});
