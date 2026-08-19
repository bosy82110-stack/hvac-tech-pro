import { useEffect, useMemo, useState } from "react";
import {
  Image,
  PanResponder,
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
import Svg, { Line } from "react-native-svg";

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

const compressorWorkbookGuidance = [
  "راجع القدرة المطلوبة أكثر من مرة قبل اعتمادها في العمل.",
  "البيانات مستخرجة في الغالب من كتالوجات الشركات، وبعضها جُمِع من مصادر فنية عند صعوبة الوصول إلى الكتالوج.",
  "قد تظهر فروق بسيطة في قدرة الموديل الواحد بسبب اختلاف الكتالوجات أو طريقة التشغيل.",
  "قد يعمل بعض الموديلات بريلاي ومكثف تشغيل، بينما يعمل موديل آخر بريلاي فقط؛ لذلك راجع بيانات الموديل قبل الاستبدال.",
  "الملف الأصلي قابل للتحديث، وهذه البيانات مرجع مساعد وليست بديلًا عن تعليمات الشركة المصنعة.",
];

type SimulatorPartType = "breaker1" | "breaker3" | "fuse" | "switch" | "thermostat" | "highPressure" | "lowPressure" | "contactor" | "contactor3" | "overload" | "overload3" | "compressor" | "compressor3" | "transformer";
type SimulatorTerminal = { label: string; role: "power" | "control" | "motor" };
type SimulatorPart = { id: string; type: SimulatorPartType; name: string; terminals: number; terminalLabels: SimulatorTerminal[] };
const simulatorPartCatalog: Array<{ type: SimulatorPartType; name: string; terminals: number; terminalLabels: SimulatorTerminal[]; color: string }> = [
  { type: "breaker1", name: "قاطع 1 فاز", terminals: 2, terminalLabels: [{ label: "L", role: "power" }, { label: "T", role: "power" }], color: "#2563EB" },
  { type: "breaker3", name: "قاطع 3 فاز", terminals: 6, terminalLabels: [{ label: "L1", role: "power" }, { label: "L2", role: "power" }, { label: "L3", role: "power" }, { label: "T1", role: "power" }, { label: "T2", role: "power" }, { label: "T3", role: "power" }], color: "#1D4ED8" },
  { type: "fuse", name: "فيوز", terminals: 2, terminalLabels: [{ label: "IN", role: "power" }, { label: "OUT", role: "power" }], color: "#F59E0B" },
  { type: "switch", name: "مفتاح ON/OFF", terminals: 2, terminalLabels: [{ label: "L", role: "control" }, { label: "T", role: "control" }], color: "#64748B" },
  { type: "thermostat", name: "ثرموستات", terminals: 2, terminalLabels: [{ label: "R", role: "control" }, { label: "Y", role: "control" }], color: "#0E7490" },
  { type: "highPressure", name: "هاي برشر", terminals: 2, terminalLabels: [{ label: "IN", role: "control" }, { label: "OUT", role: "control" }], color: "#DC2626" },
  { type: "lowPressure", name: "لو برشر", terminals: 2, terminalLabels: [{ label: "IN", role: "control" }, { label: "OUT", role: "control" }], color: "#7C3AED" },
  { type: "contactor", name: "كونتاكتور", terminals: 3, terminalLabels: [{ label: "L1", role: "power" }, { label: "T1", role: "power" }, { label: "A1", role: "control" }], color: "#0891B2" },
  { type: "contactor3", name: "كونتاكتور 3 فاز", terminals: 8, terminalLabels: [{ label: "L1", role: "power" }, { label: "L2", role: "power" }, { label: "L3", role: "power" }, { label: "T1", role: "power" }, { label: "T2", role: "power" }, { label: "T3", role: "power" }, { label: "A1", role: "control" }, { label: "A2", role: "control" }], color: "#0284C7" },
  { type: "overload", name: "أوفرلود", terminals: 2, terminalLabels: [{ label: "IN", role: "power" }, { label: "OUT", role: "motor" }], color: "#EA580C" },
  { type: "overload3", name: "أوفرلود 3 فاز", terminals: 6, terminalLabels: [{ label: "IN1", role: "power" }, { label: "IN2", role: "power" }, { label: "IN3", role: "power" }, { label: "OUT1", role: "motor" }, { label: "OUT2", role: "motor" }, { label: "OUT3", role: "motor" }], color: "#C2410C" },
  { type: "compressor", name: "كباس", terminals: 3, terminalLabels: [{ label: "C", role: "motor" }, { label: "R", role: "motor" }, { label: "S", role: "motor" }], color: "#16A34A" },
  { type: "compressor3", name: "كباس 3 فاز", terminals: 3, terminalLabels: [{ label: "U", role: "motor" }, { label: "V", role: "motor" }, { label: "W", role: "motor" }], color: "#15803D" },
  { type: "transformer", name: "ترانس", terminals: 4, terminalLabels: [{ label: "L", role: "power" }, { label: "N", role: "power" }, { label: "24V", role: "control" }, { label: "COM", role: "control" }], color: "#475569" },
];
const simulatorCommonOrder: SimulatorPartType[] = ["breaker1", "breaker3", "fuse", "switch", "thermostat", "highPressure", "lowPressure", "contactor", "contactor3", "overload", "overload3", "compressor", "compressor3"];
const simulatorAssetMap: Partial<Record<SimulatorPartType, ReturnType<typeof require>>> = {
  compressor: require("../assets/simulator/compressor-crs.jpg"),
  compressor3: require("../assets/simulator/compressor-crs.jpg"),
  breaker3: require("../assets/simulator/contactor-3terminals.jpg"),
  contactor3: require("../assets/simulator/contactor-3terminals.jpg"),
  overload3: require("../assets/simulator/overload.jpg"),
  contactor: require("../assets/simulator/contactor-3terminals.jpg"),
  overload: require("../assets/simulator/overload.jpg"),
  thermostat: require("../assets/simulator/thermostat-pressure.jpg"),
  highPressure: require("../assets/simulator/thermostat-pressure.jpg"),
  lowPressure: require("../assets/simulator/thermostat-pressure.jpg"),
};
const simulatorNodeLayout: Partial<Record<SimulatorPartType, { x: number; y: number; w: number; h: number }>> = {
  breaker1: { x: 0.04, y: 0.06, w: 0.18, h: 0.14 },
  fuse: { x: 0.27, y: 0.06, w: 0.18, h: 0.14 },
  contactor: { x: 0.56, y: 0.04, w: 0.34, h: 0.25 },
  thermostat: { x: 0.05, y: 0.31, w: 0.22, h: 0.23 },
  highPressure: { x: 0.33, y: 0.31, w: 0.18, h: 0.18 },
  lowPressure: { x: 0.33, y: 0.53, w: 0.18, h: 0.18 },
  overload: { x: 0.07, y: 0.68, w: 0.20, h: 0.20 },
  compressor: { x: 0.54, y: 0.56, w: 0.34, h: 0.29 },
  switch: { x: 0.05, y: 0.56, w: 0.18, h: 0.14 },
  transformer: { x: 0.76, y: 0.31, w: 0.18, h: 0.18 },
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
  "pt-calculator": {
    title: "حاسبة PT",
    subtitle: "حساب السوبرهيت والتبريد دونيًا",
    icon: "calculator",
  },
  "circuit-reference": {
    title: "مرجع الدوائر",
    subtitle: "رسومات وشرح دوائر التبريد والميكانيكا والكهرباء",
    icon: "book.fill",
  },
  "circuit-simulator": {
    title: "محاكي الدوائر",
    subtitle: "كوّن دائرة كباس 1 فاز واكتشف أخطاء التوصيل",
    icon: "bolt.fill",
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

// جدول PT كامل مطابق للمرجع: الضغط PSIG مقابل درجة التشبع °C.
// قيم الفراغ الحمراء في المرجع مستبعدة من مدخل PSIG؛ والاستيفاء خطي بين الصفوف الفعلية.
const ptTables: Record<string, PtPoint[]> = {
  r22: [
    { tempC: -40.0, psig: 0.6 },
    { tempC: -37.2, psig: 2.6 },
    { tempC: -34.4, psig: 4.9 },
    { tempC: -31.7, psig: 7.5 },
    { tempC: -28.9, psig: 10.2 },
    { tempC: -27.8, psig: 11.4 },
    { tempC: -26.7, psig: 12.6 },
    { tempC: -25.6, psig: 13.9 },
    { tempC: -24.4, psig: 15.2 },
    { tempC: -23.3, psig: 16.5 },
    { tempC: -22.2, psig: 17.9 },
    { tempC: -21.1, psig: 19.4 },
    { tempC: -20.0, psig: 20.9 },
    { tempC: -18.9, psig: 22.4 },
    { tempC: -17.8, psig: 24.0 },
    { tempC: -17.2, psig: 24.8 },
    { tempC: -16.7, psig: 25.7 },
    { tempC: -16.1, psig: 26.5 },
    { tempC: -15.6, psig: 27.4 },
    { tempC: -15.0, psig: 28.3 },
    { tempC: -14.4, psig: 29.1 },
    { tempC: -13.9, psig: 30.0 },
    { tempC: -13.3, psig: 31.0 },
    { tempC: -12.8, psig: 31.9 },
    { tempC: -12.2, psig: 32.8 },
    { tempC: -11.7, psig: 33.8 },
    { tempC: -11.1, psig: 34.8 },
    { tempC: -10.6, psig: 35.8 },
    { tempC: -10.0, psig: 36.8 },
    { tempC: -9.4, psig: 37.8 },
    { tempC: -8.9, psig: 38.8 },
    { tempC: -8.3, psig: 39.9 },
    { tempC: -7.8, psig: 40.9 },
    { tempC: -7.2, psig: 42.0 },
    { tempC: -6.7, psig: 43.1 },
    { tempC: -6.1, psig: 44.2 },
    { tempC: -5.6, psig: 45.3 },
    { tempC: -5.0, psig: 46.5 },
    { tempC: -4.4, psig: 47.6 },
    { tempC: -3.9, psig: 48.8 },
    { tempC: -3.3, psig: 50.0 },
    { tempC: -2.8, psig: 51.2 },
    { tempC: -2.2, psig: 52.4 },
    { tempC: -1.7, psig: 53.7 },
    { tempC: -1.1, psig: 54.9 },
    { tempC: -0.6, psig: 56.2 },
    { tempC: 0.0, psig: 57.5 },
    { tempC: 0.6, psig: 58.8 },
    { tempC: 1.1, psig: 60.2 },
    { tempC: 1.7, psig: 61.5 },
    { tempC: 2.2, psig: 62.9 },
    { tempC: 2.8, psig: 64.3 },
    { tempC: 3.3, psig: 65.7 },
    { tempC: 3.9, psig: 67.1 },
    { tempC: 4.4, psig: 68.6 },
    { tempC: 5.0, psig: 70.0 },
    { tempC: 5.6, psig: 71.5 },
    { tempC: 6.1, psig: 73.0 },
    { tempC: 6.7, psig: 74.5 },
    { tempC: 7.2, psig: 76.1 },
    { tempC: 7.8, psig: 77.6 },
    { tempC: 8.3, psig: 79.2 },
    { tempC: 8.9, psig: 80.8 },
    { tempC: 9.4, psig: 82.4 },
    { tempC: 10.0, psig: 84.1 },
    { tempC: 12.8, psig: 92.6 },
    { tempC: 15.6, psig: 101.6 },
    { tempC: 18.3, psig: 111.3 },
    { tempC: 21.1, psig: 121.5 },
    { tempC: 23.9, psig: 132.2 },
    { tempC: 26.7, psig: 143.7 },
    { tempC: 29.4, psig: 155.7 },
    { tempC: 32.2, psig: 168.4 },
    { tempC: 35.0, psig: 181.9 },
    { tempC: 37.8, psig: 196.0 },
    { tempC: 40.6, psig: 210.8 },
    { tempC: 43.3, psig: 226.4 },
    { tempC: 46.1, psig: 242.8 },
    { tempC: 48.9, psig: 260.0 },
    { tempC: 51.7, psig: 278.1 },
    { tempC: 54.4, psig: 297.0 },
    { tempC: 57.2, psig: 316.7 },
    { tempC: 60.0, psig: 337.4 },
    { tempC: 62.8, psig: 359.1 },
    { tempC: 65.6, psig: 381.7 },
    { tempC: 68.3, psig: 405.4 },
  ],
  r410a: [
    { tempC: -40.0, psig: 10.1 },
    { tempC: -37.2, psig: 13.5 },
    { tempC: -34.4, psig: 17.2 },
    { tempC: -31.7, psig: 21.4 },
    { tempC: -28.9, psig: 25.9 },
    { tempC: -27.8, psig: 27.8 },
    { tempC: -26.7, psig: 29.7 },
    { tempC: -25.6, psig: 31.8 },
    { tempC: -24.4, psig: 33.9 },
    { tempC: -23.3, psig: 36.1 },
    { tempC: -22.2, psig: 38.4 },
    { tempC: -21.1, psig: 40.7 },
    { tempC: -20.0, psig: 43.1 },
    { tempC: -18.9, psig: 45.6 },
    { tempC: -17.8, psig: 48.2 },
    { tempC: -17.2, psig: 49.5 },
    { tempC: -16.7, psig: 50.9 },
    { tempC: -16.1, psig: 52.2 },
    { tempC: -15.6, psig: 53.6 },
    { tempC: -15.0, psig: 55.0 },
    { tempC: -14.4, psig: 56.4 },
    { tempC: -13.9, psig: 57.9 },
    { tempC: -13.3, psig: 59.3 },
    { tempC: -12.8, psig: 60.8 },
    { tempC: -12.2, psig: 62.3 },
    { tempC: -11.7, psig: 63.9 },
    { tempC: -11.1, psig: 65.4 },
    { tempC: -10.6, psig: 67.0 },
    { tempC: -10.0, psig: 68.6 },
    { tempC: -9.4, psig: 70.2 },
    { tempC: -8.9, psig: 71.9 },
    { tempC: -8.3, psig: 73.5 },
    { tempC: -7.8, psig: 75.2 },
    { tempC: -7.2, psig: 77.0 },
    { tempC: -6.7, psig: 78.7 },
    { tempC: -6.1, psig: 80.5 },
    { tempC: -5.6, psig: 82.3 },
    { tempC: -5.0, psig: 84.1 },
    { tempC: -4.4, psig: 85.9 },
    { tempC: -3.9, psig: 87.8 },
    { tempC: -3.3, psig: 89.7 },
    { tempC: -2.8, psig: 91.6 },
    { tempC: -2.2, psig: 93.5 },
    { tempC: -1.7, psig: 95.5 },
    { tempC: -1.1, psig: 97.5 },
    { tempC: -0.6, psig: 99.5 },
    { tempC: 0.0, psig: 101.6 },
    { tempC: 0.6, psig: 103.6 },
    { tempC: 1.1, psig: 105.7 },
    { tempC: 1.7, psig: 107.9 },
    { tempC: 2.2, psig: 110.0 },
    { tempC: 2.8, psig: 112.2 },
    { tempC: 3.3, psig: 114.4 },
    { tempC: 3.9, psig: 116.7 },
    { tempC: 4.4, psig: 118.9 },
    { tempC: 5.0, psig: 121.8 },
    { tempC: 5.6, psig: 123.6 },
    { tempC: 6.1, psig: 125.9 },
    { tempC: 6.7, psig: 128.3 },
    { tempC: 7.2, psig: 130.7 },
    { tempC: 7.8, psig: 133.2 },
    { tempC: 8.3, psig: 135.6 },
    { tempC: 8.9, psig: 138.2 },
    { tempC: 9.4, psig: 140.7 },
    { tempC: 10.0, psig: 143.3 },
    { tempC: 12.8, psig: 156.6 },
    { tempC: 15.6, psig: 170.7 },
    { tempC: 18.3, psig: 185.7 },
    { tempC: 21.1, psig: 201.5 },
    { tempC: 23.9, psig: 218.2 },
    { tempC: 26.7, psig: 235.9 },
    { tempC: 29.4, psig: 254.6 },
    { tempC: 32.2, psig: 274.3 },
    { tempC: 35.0, psig: 295.0 },
    { tempC: 37.8, psig: 316.9 },
    { tempC: 40.6, psig: 339.9 },
    { tempC: 43.3, psig: 364.1 },
    { tempC: 46.1, psig: 289.6 },
    { tempC: 48.9, psig: 416.4 },
    { tempC: 51.7, psig: 444.5 },
    { tempC: 54.4, psig: 474.0 },
    { tempC: 57.2, psig: 505.0 },
    { tempC: 60.0, psig: 537.6 },
    { tempC: 62.8, psig: 571.7 },
    { tempC: 65.6, psig: 607.6 },
    { tempC: 68.3, psig: 645.2 },
  ],
  r407c: [
    { tempC: -40.0, psig: 4.8 },
    { tempC: -37.2, psig: 1.1 },
    { tempC: -34.4, psig: 1.5 },
    { tempC: -31.7, psig: 3.7 },
    { tempC: -28.9, psig: 6.2 },
    { tempC: -27.8, psig: 7.2 },
    { tempC: -26.7, psig: 8.4 },
    { tempC: -25.6, psig: 9.5 },
    { tempC: -24.4, psig: 10.7 },
    { tempC: -23.3, psig: 11.9 },
    { tempC: -22.2, psig: 13.2 },
    { tempC: -21.1, psig: 14.6 },
    { tempC: -20.0, psig: 15.9 },
    { tempC: -18.9, psig: 17.4 },
    { tempC: -17.8, psig: 18.9 },
    { tempC: -17.2, psig: 19.6 },
    { tempC: -16.7, psig: 20.4 },
    { tempC: -16.1, psig: 21.2 },
    { tempC: -15.6, psig: 22.0 },
    { tempC: -15.0, psig: 22.8 },
    { tempC: -14.4, psig: 23.7 },
    { tempC: -13.9, psig: 24.5 },
    { tempC: -13.3, psig: 25.4 },
    { tempC: -12.8, psig: 26.2 },
    { tempC: -12.2, psig: 27.1 },
    { tempC: -11.7, psig: 28.0 },
    { tempC: -11.1, psig: 29.0 },
    { tempC: -10.6, psig: 29.9 },
    { tempC: -10.0, psig: 30.9 },
    { tempC: -9.4, psig: 31.8 },
    { tempC: -8.9, psig: 32.8 },
    { tempC: -8.3, psig: 33.8 },
    { tempC: -7.8, psig: 34.8 },
    { tempC: -7.2, psig: 35.9 },
    { tempC: -6.7, psig: 36.9 },
    { tempC: -6.1, psig: 38.0 },
    { tempC: -5.6, psig: 39.1 },
    { tempC: -5.0, psig: 40.2 },
    { tempC: -4.4, psig: 41.3 },
    { tempC: -3.9, psig: 42.4 },
    { tempC: -3.3, psig: 43.6 },
    { tempC: -2.8, psig: 44.7 },
    { tempC: -2.2, psig: 45.9 },
    { tempC: -1.7, psig: 47.1 },
    { tempC: -1.1, psig: 48.4 },
    { tempC: -0.6, psig: 49.6 },
    { tempC: 0.0, psig: 50.9 },
    { tempC: 0.6, psig: 52.1 },
    { tempC: 1.1, psig: 53.4 },
    { tempC: 1.7, psig: 54.8 },
    { tempC: 2.2, psig: 56.1 },
    { tempC: 2.8, psig: 57.5 },
    { tempC: 3.3, psig: 58.9 },
    { tempC: 3.9, psig: 60.3 },
    { tempC: 4.4, psig: 61.7 },
    { tempC: 5.0, psig: 63.1 },
    { tempC: 5.6, psig: 64.6 },
    { tempC: 6.1, psig: 66.1 },
    { tempC: 6.7, psig: 67.6 },
    { tempC: 7.2, psig: 69.1 },
    { tempC: 7.8, psig: 70.6 },
    { tempC: 8.3, psig: 72.2 },
    { tempC: 8.9, psig: 73.8 },
    { tempC: 9.4, psig: 75.4 },
    { tempC: 10.0, psig: 77.1 },
    { tempC: 12.8, psig: 106.0 },
    { tempC: 15.6, psig: 116.2 },
    { tempC: 18.3, psig: 127.0 },
    { tempC: 21.1, psig: 138.5 },
    { tempC: 23.9, psig: 150.6 },
    { tempC: 26.7, psig: 163.5 },
    { tempC: 29.4, psig: 177.0 },
    { tempC: 32.2, psig: 191.3 },
    { tempC: 35.0, psig: 206.4 },
    { tempC: 37.8, psig: 222.3 },
    { tempC: 40.6, psig: 239.0 },
    { tempC: 43.3, psig: 256.5 },
    { tempC: 46.1, psig: 274.9 },
    { tempC: 48.9, psig: 294.2 },
    { tempC: 51.7, psig: 314.5 },
    { tempC: 54.4, psig: 335.7 },
    { tempC: 57.2, psig: 357.8 },
    { tempC: 60.0, psig: 380.9 },
    { tempC: 62.8, psig: 405.1 },
    { tempC: 65.6, psig: 430.3 },
    { tempC: 68.3, psig: 456.6 },
  ],
  r134a: [
    { tempC: -25.6, psig: 0.4 },
    { tempC: -24.4, psig: 1.2 },
    { tempC: -23.3, psig: 2.0 },
    { tempC: -22.2, psig: 2.8 },
    { tempC: -21.1, psig: 3.7 },
    { tempC: -20.0, psig: 4.6 },
    { tempC: -18.9, psig: 5.5 },
    { tempC: -17.8, psig: 6.5 },
    { tempC: -17.2, psig: 7.0 },
    { tempC: -16.7, psig: 7.5 },
    { tempC: -16.1, psig: 8.0 },
    { tempC: -15.6, psig: 8.6 },
    { tempC: -15.0, psig: 9.1 },
    { tempC: -14.4, psig: 9.7 },
    { tempC: -13.9, psig: 10.2 },
    { tempC: -13.3, psig: 10.8 },
    { tempC: -12.8, psig: 11.4 },
    { tempC: -12.2, psig: 12.0 },
    { tempC: -11.7, psig: 12.6 },
    { tempC: -11.1, psig: 13.2 },
    { tempC: -10.6, psig: 13.8 },
    { tempC: -10.0, psig: 14.4 },
    { tempC: -9.4, psig: 15.1 },
    { tempC: -8.9, psig: 15.7 },
    { tempC: -8.3, psig: 16.4 },
    { tempC: -7.8, psig: 17.1 },
    { tempC: -7.2, psig: 17.7 },
    { tempC: -6.7, psig: 18.4 },
    { tempC: -6.1, psig: 19.2 },
    { tempC: -5.6, psig: 19.9 },
    { tempC: -5.0, psig: 20.6 },
    { tempC: -4.4, psig: 21.4 },
    { tempC: -3.9, psig: 22.1 },
    { tempC: -3.3, psig: 22.9 },
    { tempC: -2.8, psig: 23.7 },
    { tempC: -2.2, psig: 24.5 },
    { tempC: -1.7, psig: 25.3 },
    { tempC: -1.1, psig: 26.1 },
    { tempC: -0.6, psig: 26.9 },
    { tempC: 0.0, psig: 27.8 },
    { tempC: 0.6, psig: 28.6 },
    { tempC: 1.1, psig: 29.5 },
    { tempC: 1.7, psig: 30.4 },
    { tempC: 2.2, psig: 31.3 },
    { tempC: 2.8, psig: 32.2 },
    { tempC: 3.3, psig: 33.1 },
    { tempC: 3.9, psig: 34.1 },
    { tempC: 4.4, psig: 35.0 },
    { tempC: 5.0, psig: 36.0 },
    { tempC: 5.6, psig: 37.0 },
    { tempC: 6.1, psig: 38.0 },
    { tempC: 6.7, psig: 39.0 },
    { tempC: 7.2, psig: 40.0 },
    { tempC: 7.8, psig: 41.1 },
    { tempC: 8.3, psig: 42.2 },
    { tempC: 8.9, psig: 43.2 },
    { tempC: 9.4, psig: 44.3 },
    { tempC: 10.0, psig: 45.4 },
    { tempC: 12.8, psig: 51.2 },
    { tempC: 15.6, psig: 57.4 },
    { tempC: 18.3, psig: 64.0 },
    { tempC: 21.1, psig: 71.1 },
    { tempC: 23.9, psig: 78.6 },
    { tempC: 26.7, psig: 86.7 },
    { tempC: 29.4, psig: 95.2 },
    { tempC: 32.2, psig: 104.3 },
    { tempC: 35.0, psig: 113.9 },
    { tempC: 37.8, psig: 124.1 },
    { tempC: 40.6, psig: 134.9 },
    { tempC: 43.3, psig: 146.3 },
    { tempC: 46.1, psig: 158.4 },
    { tempC: 48.9, psig: 171.1 },
    { tempC: 51.7, psig: 184.5 },
    { tempC: 54.4, psig: 198.7 },
    { tempC: 57.2, psig: 213.5 },
    { tempC: 60.0, psig: 229.2 },
    { tempC: 62.8, psig: 245.6 },
    { tempC: 65.6, psig: 262.8 },
    { tempC: 68.3, psig: 281.0 },
  ],
  r404a: [
    { tempC: -40.0, psig: 4.9 },
    { tempC: -37.2, psig: 7.5 },
    { tempC: -34.4, psig: 10.3 },
    { tempC: -31.7, psig: 13.5 },
    { tempC: -28.9, psig: 16.8 },
    { tempC: -27.8, psig: 18.3 },
    { tempC: -26.7, psig: 19.8 },
    { tempC: -25.6, psig: 21.3 },
    { tempC: -24.4, psig: 22.9 },
    { tempC: -23.3, psig: 24.6 },
    { tempC: -22.2, psig: 26.3 },
    { tempC: -21.1, psig: 28.0 },
    { tempC: -20.0, psig: 29.8 },
    { tempC: -18.9, psig: 31.7 },
    { tempC: -17.8, psig: 33.7 },
    { tempC: -17.2, psig: 34.7 },
    { tempC: -16.7, psig: 35.7 },
    { tempC: -16.1, psig: 36.7 },
    { tempC: -15.6, psig: 37.7 },
    { tempC: -15.0, psig: 38.8 },
    { tempC: -14.4, psig: 39.8 },
    { tempC: -13.9, psig: 40.9 },
    { tempC: -13.3, psig: 42.0 },
    { tempC: -12.8, psig: 43.1 },
    { tempC: -12.2, psig: 44.3 },
    { tempC: -11.7, psig: 45.4 },
    { tempC: -11.1, psig: 46.6 },
    { tempC: -10.6, psig: 47.8 },
    { tempC: -10.0, psig: 49.0 },
    { tempC: -9.4, psig: 50.2 },
    { tempC: -8.9, psig: 51.5 },
    { tempC: -8.3, psig: 52.7 },
    { tempC: -7.8, psig: 54.0 },
    { tempC: -7.2, psig: 55.3 },
    { tempC: -6.7, psig: 56.6 },
    { tempC: -6.1, psig: 57.9 },
    { tempC: -5.6, psig: 59.3 },
    { tempC: -5.0, psig: 60.6 },
    { tempC: -4.4, psig: 62.0 },
    { tempC: -3.9, psig: 63.4 },
    { tempC: -3.3, psig: 64.8 },
    { tempC: -2.8, psig: 66.2 },
    { tempC: -2.2, psig: 67.7 },
    { tempC: -1.7, psig: 69.2 },
    { tempC: -1.1, psig: 70.7 },
    { tempC: -0.6, psig: 72.1 },
    { tempC: 0.0, psig: 73.8 },
    { tempC: 0.6, psig: 75.3 },
    { tempC: 1.1, psig: 76.9 },
    { tempC: 1.7, psig: 78.5 },
    { tempC: 2.2, psig: 80.2 },
    { tempC: 2.8, psig: 81.7 },
    { tempC: 3.3, psig: 83.5 },
    { tempC: 3.9, psig: 85.2 },
    { tempC: 4.4, psig: 86.9 },
    { tempC: 5.0, psig: 88.6 },
    { tempC: 5.6, psig: 90.4 },
    { tempC: 6.1, psig: 92.2 },
    { tempC: 6.7, psig: 94.0 },
    { tempC: 7.2, psig: 95.8 },
    { tempC: 7.8, psig: 97.6 },
    { tempC: 8.3, psig: 99.5 },
    { tempC: 8.9, psig: 101.4 },
    { tempC: 9.4, psig: 103.3 },
    { tempC: 10.0, psig: 105.3 },
    { tempC: 12.8, psig: 115.3 },
    { tempC: 15.6, psig: 126.0 },
    { tempC: 18.3, psig: 137.4 },
    { tempC: 21.1, psig: 149.3 },
    { tempC: 23.9, psig: 161.9 },
    { tempC: 26.7, psig: 175.4 },
    { tempC: 29.4, psig: 189.6 },
    { tempC: 32.2, psig: 204.5 },
    { tempC: 35.0, psig: 220.2 },
    { tempC: 37.8, psig: 236.8 },
    { tempC: 40.6, psig: 254.2 },
    { tempC: 43.3, psig: 272.5 },
    { tempC: 46.1, psig: 291.9 },
    { tempC: 48.9, psig: 312.1 },
    { tempC: 51.7, psig: 333.4 },
    { tempC: 54.4, psig: 355.6 },
    { tempC: 57.2, psig: 379.1 },
    { tempC: 60.0, psig: 403.7 },
    { tempC: 62.8, psig: 429.6 },
    { tempC: 65.6, psig: 456.8 },
    { tempC: 68.3, psig: 484.8 },
  ]
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
  const [simulatorParts, setSimulatorParts] = useState<SimulatorPart[]>([]);
  const [simulatorPartPositions, setSimulatorPartPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [simulatorCatalogOpen, setSimulatorCatalogOpen] = useState(false);
  const [simulatorConnections, setSimulatorConnections] = useState<Array<[string, string]>>([]);
  const [simulatorSelectedId, setSimulatorSelectedId] = useState<string | null>(null);
  const [simulatorSelectedTerminal, setSimulatorSelectedTerminal] = useState<string | null>(null);
  const [simulatorCanvasWidth, setSimulatorCanvasWidth] = useState(0);
  const [simulatorDragStart, setSimulatorDragStart] = useState<string | null>(null);
  const [simulatorDragPoint, setSimulatorDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorMessage, setSimulatorMessage] = useState("أضف المكونات ثم اضغط على مكوّنين لعمل توصيل.");
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
    models?: string[];
    drive: string;
    roomReceiverCode?: string;
    deviceReceiverCode?: string;
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
        if (errorsValue) { const loadedErrors = JSON.parse(errorsValue) as CustomErrorCode[]; const cleanedErrors = loadedErrors.map((item) => { const models = getCustomErrorModels(item); return { ...item, models, model: models.join('، ') }; }); setCustomErrorCodes(cleanedErrors); AsyncStorage.setItem('hvac_custom_error_codes', JSON.stringify(cleanedErrors)).catch(() => undefined); }
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
  const getCustomErrorModels = (item: CustomErrorCode) => { const source = item.models?.length ? item.models : (item.model ?? '').split(/[،,]/); return Array.from(new Set(source.map((value) => value.trim()).filter(Boolean))); };
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
      `${x.code} ${x.roomReceiverCode ?? ''} ${x.deviceReceiverCode ?? ''} ${x.brand} ${getCustomErrorModels(x).join(' ')} ${x.problem}`
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
    if (key === "circuit-simulator") {
      const addSimulatorPart = (type: SimulatorPartType) => {
        const catalog = simulatorPartCatalog.find((item) => item.type === type);
        if (!catalog) return;
        const part: SimulatorPart = {
          id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          name: catalog.name,
          terminals: catalog.terminals,
          terminalLabels: catalog.terminalLabels,
        };
        const defaultPosition = simulatorNodeLayout[type] ?? { x: 0.08, y: 0.08, w: 0.22, h: 0.16 };
        setSimulatorPartPositions((previous) => ({ ...previous, [part.id]: { x: defaultPosition.x, y: defaultPosition.y } }));
        setSimulatorParts((previous) => [...previous, part]);
        setSimulatorRunning(false);
        setSimulatorMessage("تمت إضافة المكوّن. اضغط على مكوّنين لعمل توصيل.");
      };
      const removeSimulatorPart = (partId: string) => {
        setSimulatorParts((previous) => previous.filter((part) => part.id !== partId));
        setSimulatorPartPositions((previous) => {
          const next = { ...previous };
          delete next[partId];
          return next;
        });
        setSimulatorConnections((previous) => previous.filter(([first, second]) => !first.startsWith(`${partId}:`) && !second.startsWith(`${partId}:`)));
        setSimulatorSelectedId((current) => current === partId ? null : current);
        setSimulatorSelectedTerminal((current) => current?.startsWith(`${partId}:`) ? null : current);
        setSimulatorDragStart((current) => current?.startsWith(`${partId}:`) ? null : current);
        setSimulatorDragPoint(null);
        setSimulatorRunning(false);
        setSimulatorMessage("تم حذف المكوّن والأسلاك المرتبطة به.");
      };
      const selectSimulatorTerminal = (partId: string, terminalIndex: number) => {
        const terminalId = `${partId}:${terminalIndex}`;
        setSimulatorSelectedId(partId);
        if (!simulatorSelectedTerminal) {
          setSimulatorSelectedTerminal(terminalId);
          setSimulatorMessage("تم اختيار الطرف الأول. اختر طرفًا من مكوّن آخر لإنشاء السلك.");
          return;
        }
        if (simulatorSelectedTerminal === terminalId) {
          setSimulatorSelectedTerminal(null);
          setSimulatorSelectedId(null);
          return;
        }
        const [firstPartId] = simulatorSelectedTerminal.split(":");
        if (firstPartId === partId) {
          setSimulatorMessage("اختر طرفًا من مكوّن آخر، وليس طرفًا آخر من نفس المكوّن.");
          return;
        }
        const exists = simulatorConnections.some(
          ([a, b]) => (a === simulatorSelectedTerminal && b === terminalId) || (a === terminalId && b === simulatorSelectedTerminal),
        );
        if (!exists) setSimulatorConnections((previous) => [...previous, [simulatorSelectedTerminal, terminalId]]);
        setSimulatorSelectedTerminal(null);
        setSimulatorSelectedId(null);
        setSimulatorRunning(false);
        setSimulatorMessage("تم إنشاء السلك بين الطرفين. أكمل التوصيلات ثم اضغط تشغيل.");
      };
      const runSimulator = () => {
        const types = new Set(simulatorParts.map((part) => part.type));
        const has = (type: SimulatorPartType) => types.has(type);
        const connected = (type: SimulatorPartType) => {
          const part = simulatorParts.find((item) => item.type === type);
          return !!part && simulatorConnections.some(([a, b]) => a.startsWith(`${part.id}:`) || b.startsWith(`${part.id}:`));
        };
        const errors: string[] = [];
        const terminalId = (type: SimulatorPartType, label: string) => {
          const part = simulatorParts.find((item) => item.type === type);
          const index = part?.terminalLabels.findIndex((terminal) => terminal.label === label) ?? -1;
          return part && index >= 0 ? `${part.id}:${index}` : null;
        };
        const hasLink = (first: string | null, second: string | null) =>
          !!first && !!second && simulatorConnections.some(([a, b]) => (a === first && b === second) || (a === second && b === first));
        const hasThreePhase = has("breaker3") || has("contactor3") || has("overload3") || has("compressor3");
        if (hasThreePhase) {
          if (!has("breaker3")) errors.push("أضف قاطع 3 فاز كمصدر للفازات الثلاث.");
          if (!has("contactor3")) errors.push("أضف كونتاكتور 3 فاز.");
          if (!has("overload3")) errors.push("أضف أوفرلود 3 فاز.");
          if (!has("compressor3")) errors.push("أضف كباس 3 فاز.");
          const phasePairs = [["T1", "L1"], ["T2", "L2"], ["T3", "L3"]] as const;
          phasePairs.forEach(([sourceLabel, contactorLabel]) => {
            if (!hasLink(terminalId("breaker3", sourceLabel), terminalId("contactor3", contactorLabel))) errors.push(`صل خرج الفاز ${sourceLabel} من القاطع إلى دخل ${contactorLabel} في الكونتاكتور.`);
          });
          [["T1", "IN1"], ["T2", "IN2"], ["T3", "IN3"]].forEach(([from, to]) => {
            if (!hasLink(terminalId("contactor3", from), terminalId("overload3", to))) errors.push(`صل ${from} من الكونتاكتور إلى ${to} في الأوفرلود.`);
          });
          [["OUT1", "U"], ["OUT2", "V"], ["OUT3", "W"]].forEach(([from, to]) => {
            if (!hasLink(terminalId("overload3", from), terminalId("compressor3", to))) errors.push(`صل ${from} من الأوفرلود إلى طرف ${to} في الكباس 3 فاز.`);
          });
          if (has("contactor3") && has("thermostat") && !hasLink(terminalId("thermostat", "Y"), terminalId("contactor3", "A1"))) errors.push("صل خرج الثرموستات Y إلى A1 في كونتاكتور 3 فاز.");
        } else {
          if (!has("breaker1")) errors.push("أضف قاطع 1 فاز كمصدر حماية.");
          if (!has("compressor")) errors.push("أضف كباسًا إلى الدائرة.");
          if (!has("contactor")) errors.push("أضف كونتاكتورًا للتحكم في تشغيل الكباس.");
          if (!has("overload")) errors.push("أضف أوفرلود لحماية الكباس.");
        }
        ["breaker1", "contactor", "overload", "compressor"].forEach((type) => {
          if (has(type as SimulatorPartType) && !connected(type as SimulatorPartType)) errors.push(`المكوّن ${simulatorPartCatalog.find((item) => item.type === type)?.name ?? type} غير موصل.`);
        });
        if (has("breaker1") && has("contactor")) {
          const sourceOut = has("fuse") ? terminalId("fuse", "OUT") : terminalId("breaker1", "T");
          const sourceIn = has("fuse") ? terminalId("breaker1", "T") : null;
          if (has("fuse") && !hasLink(sourceIn, terminalId("fuse", "IN"))) errors.push("صل خرج القاطع إلى دخل الفيوز.");
          if (!hasLink(sourceOut, terminalId("contactor", "L1"))) errors.push("صل خط القدرة إلى طرف L1 في الكونتاكتور.");
        }
        if (has("overload") && has("contactor") && !hasLink(terminalId("contactor", "T1"), terminalId("overload", "IN"))) errors.push("صل طرف T1 من الكونتاكتور إلى دخل الأوفرلود.");
        if (has("overload") && has("compressor") && !hasLink(terminalId("overload", "OUT"), terminalId("compressor", "C"))) errors.push("صل خرج الأوفرلود إلى الطرف C في الكباس.");
        if (has("thermostat") && has("contactor") && !hasLink(terminalId("thermostat", "Y"), terminalId("contactor", "A1"))) errors.push("صل خرج الثرموستات Y إلى طرف التحكم A1 في الكونتاكتور.");
        if (has("highPressure") && has("thermostat") && !hasLink(terminalId("thermostat", "Y"), terminalId("highPressure", "IN"))) errors.push("صل الثرموستات إلى دخل الهاي برشر.");
        if (has("highPressure") && has("contactor") && !hasLink(terminalId("highPressure", "OUT"), terminalId("contactor", "A1"))) errors.push("صل خرج الهاي برشر إلى A1.");
        if (has("lowPressure") && has("thermostat") && !hasLink(terminalId("thermostat", "Y"), terminalId("lowPressure", "IN"))) errors.push("صل الثرموستات إلى دخل اللو برشر.");
        if (has("lowPressure") && has("contactor") && !hasLink(terminalId("lowPressure", "OUT"), terminalId("contactor", "A1"))) errors.push("صل خرج اللو برشر إلى A1.");
        setSimulatorRunning(true);
        setSimulatorMessage(errors.length ? `الدائرة لا تعمل: ${errors.join(" ")}` : "الدائرة تعمل مبدئيًا. راجع مخطط الشركة المصنعة قبل التطبيق العملي.");
      };
      return (
        <View>
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: "#DC2626" }]}>
            <View style={[styles.circleIcon, { backgroundColor: "#FEE2E2" }]}>
              <IconSymbol name="bolt.fill" size={24} color="#DC2626" />
            </View>
            <Text style={[styles.detailsTitle, { color: colors.foreground }]}>محاكي الدوائر</Text>
            <Text style={[styles.detailsBody, { color: colors.muted }]}>الإصدار الأول: كوّن دائرة كباس 1 فاز، اختر المكونات، ثم اضغط على مكوّنين لإنشاء سلك بينهما.</Text>
          </View>
          <Text style={[styles.simulatorSectionTitle, { color: colors.foreground }]}>المكونات</Text>
          <Pressable onPress={() => setSimulatorCatalogOpen((open) => !open)} style={[styles.simulatorDropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.simulatorDropdownArrow, { color: colors.muted }]}>{simulatorCatalogOpen ? "▲" : "▼"}</Text>
            <Text style={[styles.simulatorDropdownText, { color: colors.foreground }]}>اختر مكوّنًا لإضافته إلى اللوحة</Text>
          </Pressable>
          {simulatorCatalogOpen && <View style={[styles.simulatorDropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {simulatorPartCatalog.map((item) => (
              <Pressable key={item.type} onPress={() => { addSimulatorPart(item.type); setSimulatorCatalogOpen(false); }} style={({ pressed }) => [styles.simulatorCatalogItem, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.82 }]}>
                <View style={[styles.simulatorColorDot, { backgroundColor: item.color }]} />
                <Text style={[styles.simulatorCatalogText, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.simulatorAddText, { color: item.color }]}>+</Text>
              </Pressable>
            ))}
          </View>}
          <View style={[styles.simulatorBoard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.simulatorBoardHeader}>
              <Text style={[styles.simulatorSectionTitle, { color: colors.foreground }]}>لوحة الدائرة</Text>
              <Pressable onPress={() => {           setSimulatorParts([]); setSimulatorPartPositions({}); setSimulatorConnections([]); setSimulatorSelectedId(null); setSimulatorSelectedTerminal(null); setSimulatorRunning(false); setSimulatorMessage("أضف المكونات ثم اضغط على مكوّنين لعمل توصيل."); }}>
                <Text style={[styles.simulatorClearText, { color: colors.error }]}>مسح الكل</Text>
              </Pressable>
            </View>
            {simulatorParts.length === 0 ? (
              <Text style={[styles.simulatorEmpty, { color: colors.muted }]}>لم تتم إضافة مكونات بعد.</Text>
            ) : (() => {
              const canvasHeight = 455;
              const width = simulatorCanvasWidth || 360;
              const geometryFor = (part: SimulatorPart, index: number) => {
                const base = simulatorNodeLayout[part.type] ?? { x: 0.08, y: 0.08 + index * 0.08, w: 0.22, h: 0.16 };
                const position = simulatorPartPositions[part.id] ?? { x: base.x, y: base.y };
                return { left: position.x * width, top: position.y * canvasHeight, width: base.w * width, height: base.h * canvasHeight };
              };
              const terminalPoint = (terminalId: string) => {
                const [partId, rawIndex] = terminalId.split(":");
                const partIndex = simulatorParts.findIndex((item) => item.id === partId);
                const part = simulatorParts[partIndex];
                if (!part) return null;
                const box = geometryFor(part, partIndex);
                const index = Number(rawIndex);
                const label = part.terminalLabels[index]?.label ?? "";
                const positions: Record<string, [number, number]> = {
                  C: [0.25, 0.22], R: [0.5, 0.18], S: [0.75, 0.22],
                  L1: [0.2, 0.2], T1: [0.5, 0.2], A1: [0.8, 0.78],
                  IN: [0.25, 0.2], OUT: [0.75, 0.2],
                  L: [0.25, 0.5], T: [0.75, 0.5], Y: [0.75, 0.78], R1: [0.25, 0.78],
                  N: [0.75, 0.5], "24V": [0.25, 0.78], COM: [0.75, 0.78],
                };
                const [px, py] = positions[label] ?? [0.5, 0.5];
                return { x: box.left + box.width * px, y: box.top + box.height * py };
              };
              const nearestTerminal = (point: { x: number; y: number }) => {
                let closestId: string | null = null;
                let closestDistance = 38;
                simulatorParts.forEach((part) => part.terminalLabels.forEach((_, terminalIndex) => {
                  const id = `${part.id}:${terminalIndex}`;
                  const target = terminalPoint(id);
                  if (!target) return;
                  const distance = Math.hypot(target.x - point.x, target.y - point.y);
                  if (distance <= closestDistance) {
                    closestId = id;
                    closestDistance = distance;
                  }
                }));
                return closestId;
              };
              const completeDragConnection = (start: string, end: string | null) => {
                if (!end || start === end) return;
                const [firstPartId] = start.split(":");
                const [secondPartId] = end.split(":");
                if (firstPartId === secondPartId) {
                  setSimulatorMessage("لا يمكن توصيل طرفين من نفس المكوّن.");
                  return;
                }
                const exists = simulatorConnections.some(([a, b]) => (a === start && b === end) || (a === end && b === start));
                if (!exists) setSimulatorConnections((previous) => [...previous, [start, end]]);
                setSimulatorSelectedTerminal(null);
                setSimulatorSelectedId(null);
                setSimulatorRunning(false);
                setSimulatorMessage("تم سحب السلك وتوصيله بين الطرفين. أكمل الدائرة ثم اضغط تشغيل.");
              };
              const createNodeResponder = (part: SimulatorPart, index: number) => {
                const base = simulatorNodeLayout[part.type] ?? { x: 0.08, y: 0.08 + index * 0.08, w: 0.22, h: 0.16 };
                const currentPosition = simulatorPartPositions[part.id] ?? { x: base.x, y: base.y };
                return PanResponder.create({
                  onStartShouldSetPanResponder: () => true,
                  onMoveShouldSetPanResponder: () => true,
                  onPanResponderMove: (_, gesture) => {
                    const nextX = Math.max(0, Math.min(1 - base.w, currentPosition.x + gesture.dx / width));
                    const nextY = Math.max(0, Math.min(1 - base.h, currentPosition.y + gesture.dy / canvasHeight));
                    setSimulatorPartPositions((previous) => ({ ...previous, [part.id]: { x: nextX, y: nextY } }));
                    setSimulatorRunning(false);
                  },
                  onPanResponderRelease: () => setSimulatorMessage("تم تحريك المكوّن. يمكنك الآن توصيل أطرافه أو تشغيل الدائرة."),
                });
              };
              const createTerminalResponder = (terminalId: string) => PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: () => {
                  setSimulatorDragStart(terminalId);
                  setSimulatorDragPoint(terminalPoint(terminalId));
                },
                onPanResponderMove: (_, gesture) => {
                  const start = terminalPoint(terminalId);
                  if (start) setSimulatorDragPoint({ x: start.x + gesture.dx, y: start.y + gesture.dy });
                },
                onPanResponderRelease: (_, gesture) => {
                  const start = terminalPoint(terminalId);
                  const endPoint = start ? { x: start.x + gesture.dx, y: start.y + gesture.dy } : null;
                  completeDragConnection(terminalId, endPoint ? nearestTerminal(endPoint) : null);
                  setSimulatorDragStart(null);
                  setSimulatorDragPoint(null);
                },
                onPanResponderTerminate: () => {
                  setSimulatorDragStart(null);
                  setSimulatorDragPoint(null);
                },
              });
              return (
                <View style={styles.simulatorCanvas} onLayout={(event) => setSimulatorCanvasWidth(event.nativeEvent.layout.width)}>
                  <View style={styles.simulatorGridLayer} pointerEvents="none" />
                  <Svg width={width} height={canvasHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
                    {simulatorConnections.filter(([first, second]) => simulatorParts.some((part) => first.startsWith(`${part.id}:`)) && simulatorParts.some((part) => second.startsWith(`${part.id}:`))).map(([first, second], index) => {
                      const a = terminalPoint(first);
                      const b = terminalPoint(second);
                      if (!a || !b) return null;
                      const wireColors = ["#2563EB", "#DC2626", "#F59E0B", "#16A34A", "#7C3AED"];
                      return <Line key={`${first}-${second}-${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={wireColors[index % wireColors.length]} strokeWidth={5} strokeLinecap="round" />;
                    })}
                    {simulatorDragStart && simulatorDragPoint && (() => {
                      const start = terminalPoint(simulatorDragStart);
                      return start ? <Line x1={start.x} y1={start.y} x2={simulatorDragPoint.x} y2={simulatorDragPoint.y} stroke="#F59E0B" strokeWidth={6} strokeLinecap="round" strokeDasharray="10 7" /> : null;
                    })()}
                  </Svg>
                  {simulatorParts.map((part, index) => {
                    const box = geometryFor(part, index);
                    const nodeResponder = createNodeResponder(part, index);
                    const catalog = simulatorPartCatalog.find((item) => item.type === part.type);
                    const asset = simulatorAssetMap[part.type];
                    const isSelected = simulatorSelectedId === part.id;
                    return (
                      <View key={part.id} {...nodeResponder.panHandlers} style={[styles.simulatorNode, { left: box.left, top: box.top, width: box.width, height: box.height, borderColor: isSelected ? "#DC2626" : `${catalog?.color ?? colors.primary}70` }]}>
                        <Pressable onPress={() => removeSimulatorPart(part.id)} style={styles.simulatorDeleteButton} hitSlop={8}>
                          <Text style={styles.simulatorDeleteButtonText}>حذف</Text>
                        </Pressable>
                        {asset ? <Image source={asset} resizeMode="contain" style={styles.simulatorNodeImage} /> : <View style={[styles.simulatorFallbackImage, { backgroundColor: `${catalog?.color ?? colors.primary}22` }]}><Text style={[styles.simulatorFallbackText, { color: catalog?.color ?? colors.primary }]}>{part.name}</Text></View>}
                        <Text style={styles.simulatorNodeCaption}>{part.name}</Text>
                        {part.terminalLabels.map((terminal, terminalIndex) => {
                          const terminalId = `${part.id}:${terminalIndex}`;
                          const selected = simulatorSelectedTerminal === terminalId;
                          const position: Record<string, [number, number]> = { C: [0.25, 0.22], R: [0.5, 0.18], S: [0.75, 0.22], L1: [0.2, 0.2], T1: [0.5, 0.2], A1: [0.8, 0.78], IN: [0.25, 0.2], OUT: [0.75, 0.2], L: [0.25, 0.5], T: [0.75, 0.5], Y: [0.75, 0.78], R1: [0.25, 0.78], N: [0.75, 0.5], "24V": [0.25, 0.78], COM: [0.75, 0.78] };
                          const [px, py] = position[terminal.label] ?? [0.5, 0.5];
                          const roleColor = terminal.role === "power" ? "#2563EB" : terminal.role === "control" ? "#7C3AED" : "#DC2626";
                          return <Pressable key={terminalId} {...createTerminalResponder(terminalId).panHandlers} onPress={() => selectSimulatorTerminal(part.id, terminalIndex)} style={[styles.simulatorRealTerminal, { left: `${px * 100}%`, top: `${py * 100}%`, borderColor: selected ? "#FFFFFF" : roleColor, backgroundColor: selected ? "#DC2626" : "#EF4444" }]}><Text style={styles.simulatorRealTerminalText}>{terminal.label}</Text></Pressable>;
                        })}
                      </View>
                    );
                  })}
                  <View style={styles.simulatorPowerLabel}><Text style={styles.simulatorPowerLabelText}>Power / Control</Text></View>
                </View>
              );
            })()}
            <Text style={[styles.simulatorHint, { color: colors.muted }]}>{simulatorSelectedTerminal ? "تم اختيار طرف. اختر طرفًا من مكوّن آخر لإكمال السلك." : "اضغط على أطراف المكونات لإنشاء أسلاك واقعية."}</Text>
            {simulatorConnections.length > 0 && <Text style={[styles.simulatorConnections, { color: colors.muted }]}>عدد الأسلاك: {simulatorConnections.length}</Text>}
          </View>
          <Pressable onPress={runSimulator} style={({ pressed }) => [styles.simulatorRunButton, pressed && { opacity: 0.82 }]}>
            <IconSymbol name="bolt.fill" size={20} color="#FFFFFF" />
            <Text style={styles.simulatorRunText}>تشغيل الدائرة</Text>
          </Pressable>
          <View style={[styles.simulatorResult, { backgroundColor: simulatorRunning && simulatorMessage.startsWith("الدائرة تعمل") ? "#DCFCE7" : "#FEF3C7", borderColor: simulatorRunning && simulatorMessage.startsWith("الدائرة تعمل") ? "#16A34A" : "#D97706" }]}>
            <Text style={[styles.simulatorResultText, { color: colors.foreground }]}>{simulatorMessage}</Text>
          </View>
        </View>
      );
    }
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
                    directionalLockEnabled={false}
                    showsHorizontalScrollIndicator
                    contentContainerStyle={styles.imageScroller}
                  >
                    <ScrollView
                      nestedScrollEnabled
                      directionalLockEnabled={false}
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
                          height: Math.round((520 / 1.5) * circuitZoom),
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
                اسحب الصورة لرؤية الحواف • التكبير: {Math.round(circuitZoom * 100)}%
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
    const ptCalculatorCard = (
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
              <View style={[styles.ptReference, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.ptReferenceTitle, { color: colors.foreground }]}>الجدول المرجعي للضغط ودرجة الحرارة</Text>
                <Text style={[styles.ptReferenceNote, { color: colors.muted }]}>القيم بالضغط Gauge (PSIG)، ودرجة الحرارة بالفهرنهايت والمئوية.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.ptReferenceScroll}>
                  <View style={styles.ptTable}>
                    <View style={styles.ptTableRow}>
                      {['°F', '°C', 'R-22', 'R-410A', 'R-407C', 'R-134a', 'R-404A'].map((label) => (
                        <Text key={label} style={[styles.ptTableCell, styles.ptTableHeader, { color: '#0F172A', backgroundColor: '#BAE6FD' }]}>{label}</Text>
                      ))}
                    </View>
                    {Array.from(new Set(Object.values(ptTables).flatMap((table) => table.map((point) => point.tempC))))
                      .sort((a, b) => a - b)
                      .map((tempC) => (
                        <View key={`pt-row-${tempC}`} style={styles.ptTableRow}>
                          <Text style={[styles.ptTableCell, { color: colors.foreground }]}>{(tempC * 9 / 5 + 32).toFixed(0)}</Text>
                          <Text style={[styles.ptTableCell, { color: colors.foreground }]}>{tempC.toFixed(1)}</Text>
                          {(['r22', 'r410a', 'r407c', 'r134a', 'r404a'] as const).map((id) => {
                            const point = ptTables[id].find((item) => Math.abs(item.tempC - tempC) < 0.05);
                            return <Text key={`${id}-${tempC}`} style={[styles.ptTableCell, { color: point ? colors.foreground : colors.muted }]}>{point ? point.psig.toFixed(1) : '—'}</Text>;
                          })}
                        </View>
                      ))}
                  </View>
                </ScrollView>
              </View>
            </View>
    );
    if (key === "pt-calculator") {
      return <View>{ptCalculatorCard}</View>;
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
                <Text style={[styles.pressureCell, styles.pipeHeaderText]}>
                  حرارة الجو
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
                  <Text
                    style={[styles.pressureCell, { color: colors.foreground }]}
                  >
                    30°C
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.pipeNoteText, { color: colors.muted }]}>القيم الحالية مرجعية عند درجة حرارة جو 30°C، وتتغير حسب الحمل وحالة الجهاز.</Text>
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
          <View
            style={[
              styles.workbookGuidanceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.workbookGuidanceTitle, { color: colors.foreground }]}>إرشادات مهمة عن بيانات الكباسات</Text>
            {compressorWorkbookGuidance.map((note) => (
              <Text key={note} style={[styles.workbookGuidanceText, { color: colors.muted }]}>• {note}</Text>
            ))}
          </View>
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
        models: undefined,
        type: item.type,
      }));
      const customResults = filteredCustomCodes.map((item) => ({
        id: item.id,
        code: item.code,
        brand: item.brand,
        model: item.model,
        models: getCustomErrorModels(item),
        drive: item.drive,
        roomReceiverCode: item.roomReceiverCode,
        deviceReceiverCode: item.deviceReceiverCode,
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
                    {item.models?.length ? item.models.join('\n') : item.model} · {item.drive} · {item.type}
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
                <Text style={[styles.detailsTitle, { color: colors.primary }]}>
                  تفاصيل كود العطل <Text style={{ color: colors.foreground }}>{selectedError.code}</Text>
                </Text>
                <Text style={[styles.detailsRow, { color: colors.primary }]}>
                  نوع الجهاز: <Text style={{ color: colors.foreground }}>{selectedError.type}</Text>
                </Text>
                <Text style={[styles.detailsRow, { color: colors.primary }]}>
                  الماركة: <Text style={{ color: colors.foreground }}>{selectedError.brand}</Text>
                </Text>
                <Text style={[styles.detailsRow, { color: colors.primary }]}>
                  الموديلات: <Text style={{ color: colors.foreground }}>{selectedError.models?.length ? selectedError.models.map((modelName) => `${modelName}\n`).join('') : selectedError.model}</Text>
                </Text>
                <Text style={[styles.detailsRow, { color: colors.primary }]}>
                  نوع التشغيل: <Text style={{ color: colors.foreground }}>{selectedError.drive}</Text>
                </Text>
                {selectedError.roomReceiverCode ? <Text style={[styles.detailsRow, { color: colors.primary }]}>كود رسيفر الغرفة: <Text style={{ color: colors.foreground }}>{selectedError.roomReceiverCode}</Text></Text> : null}
                {selectedError.deviceReceiverCode ? <Text style={[styles.detailsRow, { color: colors.primary }]}>كود رسيفر الجهاز: <Text style={{ color: colors.foreground }}>{selectedError.deviceReceiverCode}</Text></Text> : null}
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
            {["سبليت", "مركزي", "غرف تبريد", "VRF", "كونسيلد"].map((x) => (
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
                const isPressureGuide = guide.category === "الضغط والأمبير";
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
                        {!isPressureGuide && (
                          <>
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
                                  { color: "#7C2D12", fontWeight: "700" },
                                ]}
                              >
                                • {cause}
                              </Text>
                            ))}
                          </>
                        )}
                        <Text
                          style={[styles.fieldGuideLabel, { color: "#16A36A" }]}
                        >
                          {isPressureGuide ? "الحل" : "الحل / خطوات الفحص الميداني"}
                        </Text>
                        {guide.steps.map((step, index) => (
                          <Text
                            key={step}
                            style={[
                              styles.fieldGuideText,
                              { color: "#065F46", fontWeight: "700" },
                            ]}
                          >
                            {isPressureGuide ? step : `${index + 1}. ${step}`}
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
              {(["سبليت", "مركزي", "غرف تبريد", "VRF", "كونسيلد"] as HvacDeviceType[]).map(
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
  workbookGuidanceCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    gap: 6,
  },
  workbookGuidanceTitle: { fontSize: 15, fontWeight: "900", textAlign: "right", marginBottom: 4 },
  workbookGuidanceText: { fontSize: 12, lineHeight: 20, textAlign: "right" },
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
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingHorizontal: 8,
    minWidth: "100%",
  },
  imageVerticalScroller: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
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
  fieldGuideTitle: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    color: "#0E7490",
  },
  fieldGuideEnglish: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "right",
  },
  fieldGuideBody: { paddingHorizontal: 13, paddingBottom: 14, gap: 7 },
  fieldGuideLabel: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 5,
  },
  fieldGuideText: {
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "right",
  },
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
  ptReference: { borderWidth: 1, borderRadius: 12, marginTop: 14, padding: 8, overflow: "hidden" },
  ptReferenceTitle: { fontSize: 13, fontWeight: "900", textAlign: "right", marginBottom: 3 },
  ptReferenceNote: { fontSize: 10, lineHeight: 16, textAlign: "right", marginBottom: 8 },
  ptReferenceScroll: { paddingBottom: 2 },
  ptTable: { minWidth: 520, borderWidth: 1, borderColor: "#64748B", borderRadius: 6, overflow: "hidden" },
  ptTableRow: { flexDirection: "row", minHeight: 29, borderBottomWidth: 1, borderBottomColor: "#CBD5E1" },
  ptTableCell: { width: 72, paddingHorizontal: 5, paddingVertical: 6, textAlign: "center", fontSize: 10, fontWeight: "800", borderRightWidth: 1, borderRightColor: "#CBD5E1" },
  ptTableHeader: { fontWeight: "900" },
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
  simulatorSectionTitle: { fontSize: 16, fontWeight: "900", textAlign: "right", marginTop: 14, marginBottom: 8 },
  simulatorCatalog: { gap: 8 },
  simulatorDropdownButton: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  simulatorDropdownMenu: { borderWidth: 1, borderRadius: 14, padding: 8, gap: 8, marginBottom: 10 },
  simulatorDropdownText: { flex: 1, fontSize: 14, fontWeight: "800", textAlign: "right" },
  simulatorDropdownArrow: { fontSize: 17, fontWeight: "900", marginRight: 4 },
  simulatorCatalogItem: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  simulatorColorDot: { width: 13, height: 13, borderRadius: 7 },
  simulatorCatalogText: { flex: 1, fontSize: 13, fontWeight: "800", textAlign: "right" },
  simulatorAddText: { fontSize: 24, fontWeight: "900", lineHeight: 26 },
  simulatorBoard: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 14 },
  simulatorCanvas: { height: 455, borderRadius: 14, overflow: "hidden", backgroundColor: "#F8FAFC", position: "relative", marginTop: 10 },
  simulatorGridLayer: { ...StyleSheet.absoluteFillObject, opacity: 0.35, backgroundColor: "#E2E8F0" },
  simulatorNode: { position: "absolute", borderWidth: 2, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.88)", overflow: "visible" },
  simulatorNodeImage: { width: "100%", height: "100%", borderRadius: 8 },
  simulatorFallbackImage: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  simulatorFallbackText: { fontSize: 10, fontWeight: "900", textAlign: "center" },
  simulatorNodeCaption: { position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: 9, fontWeight: "900", color: "#0F172A" },
  simulatorDeleteButton: { position: "absolute", top: 3, right: 3, zIndex: 20, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, backgroundColor: "#DC2626" },
  simulatorDeleteButtonText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
  simulatorRealTerminal: { position: "absolute", width: 28, height: 28, marginLeft: -14, marginTop: -14, borderWidth: 2, borderRadius: 14, alignItems: "center", justifyContent: "center", zIndex: 5, elevation: 5 },
  simulatorRealTerminalText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
  simulatorPowerLabel: { position: "absolute", top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.72)" },
  simulatorPowerLabelText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  simulatorBoardHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  simulatorClearText: { fontSize: 12, fontWeight: "900" },
  simulatorEmpty: { fontSize: 13, textAlign: "center", paddingVertical: 24 },
  simulatorPartRow: { minHeight: 48, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, marginTop: 8, flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  simulatorRealPart: { borderWidth: 1, borderRadius: 15, padding: 10, marginTop: 9 },
  simulatorRealPartHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  simulatorComponentGraphic: { width: 58, height: 48, borderWidth: 2, borderRadius: 12, justifyContent: "center", alignItems: "center", position: "relative" },
  simulatorGraphicCore: { width: 24, height: 24, borderRadius: 12, opacity: 0.85 },
  simulatorGraphicLine: { position: "absolute", width: 38, height: 3, borderRadius: 2, transform: [{ rotate: "28deg" }] },
  simulatorRealPartCopy: { flex: 1, alignItems: "flex-end" },
  simulatorPartName: { flex: 1, fontSize: 13, fontWeight: "900", textAlign: "right" },
  simulatorTerminalHint: { fontSize: 10, textAlign: "right", marginTop: 8 },
  simulatorTerminalRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 7, marginTop: 8 },
  simulatorTerminal: { minWidth: 54, minHeight: 32, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 8, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 5 },
  simulatorTerminalDot: { width: 9, height: 9, borderRadius: 5 },
  simulatorTerminalText: { fontSize: 12, fontWeight: "900" },
  simulatorLinkCount: { fontSize: 11, fontWeight: "700" },
  simulatorHint: { fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 12 },
  simulatorConnections: { fontSize: 12, fontWeight: "800", textAlign: "right", marginTop: 6 },
  simulatorRunButton: { minHeight: 50, borderRadius: 13, backgroundColor: "#DC2626", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  simulatorRunText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  simulatorResult: { borderWidth: 1, borderRadius: 13, padding: 12, marginTop: 10, marginBottom: 24 },
  simulatorResultText: { fontSize: 12, lineHeight: 20, textAlign: "right", fontWeight: "700" },
});
