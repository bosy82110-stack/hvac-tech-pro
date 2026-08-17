import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Refrigerant = "R22" | "R410A" | "R32" | "R407C" | "R134a" | "R404A";
type ChargeRow = {
  capacity: number;
  gas: string;
  liquid: string;
  r22: number;
  r410a: number;
};
type CatalogRow = {
  model: string;
  gas: string;
  liquid: string;
  maxLength: number;
  maxHeight: number;
};

// القيم الأساسية من جدول الشحن الظاهر في الصورة المرفقة. تُراجع نهائيًا مع كتالوج الموديل قبل الخدمة.
const chargeTable: ChargeRow[] = [
  { capacity: 12000, gas: "3/8", liquid: "1/4", r22: 25, r410a: 15 },
  { capacity: 18000, gas: "1/2", liquid: "1/4", r22: 30, r410a: 15 },
  { capacity: 24000, gas: "5/8", liquid: "3/8", r22: 45, r410a: 30 },
  { capacity: 30000, gas: "5/8", liquid: "3/8", r22: 45, r410a: 30 },
  { capacity: 36000, gas: "3/4", liquid: "3/8", r22: 65, r410a: 45 },
  { capacity: 48000, gas: "7/8", liquid: "3/8", r22: 85, r410a: 65 },
  { capacity: 60000, gas: "7/8", liquid: "3/8", r22: 100, r410a: 85 },
];

// بيانات الوحدات الظاهرة في جدول الكتالوج المرفق: طول المواسير الأقصى وفرق الارتفاع الأقصى بالمتر.
const catalogRows: CatalogRow[] = [
  { model: "MSFA1T-12HR-DN", gas: "3/8", liquid: "1/4", maxLength: 25, maxHeight: 10 },
  { model: "MSC1T-12HR-DN-F", gas: "1/2", liquid: "1/4", maxLength: 25, maxHeight: 10 },
  { model: "MSC1T-18HR-DN-F", gas: "1/2", liquid: "1/4", maxLength: 30, maxHeight: 20 },
  { model: "MSC1T-24HR-DN-F", gas: "5/8", liquid: "3/8", maxLength: 35, maxHeight: 20 },
  { model: "M1SABT-30HRDNFQ-08", gas: "5/8", liquid: "3/8", maxLength: 50, maxHeight: 25 },
  { model: "M1SABT-36HRDNFQ-08", gas: "5/8", liquid: "3/8", maxLength: 50, maxHeight: 25 },
  { model: "MSC1T-12HR-NF", gas: "1/2", liquid: "1/4", maxLength: 10, maxHeight: 4 },
  { model: "MSC1T-18HR-NF", gas: "1/2", liquid: "1/4", maxLength: 20, maxHeight: 10 },
  { model: "MSC1T-24HR-NF", gas: "5/8", liquid: "3/8", maxLength: 20, maxHeight: 10 },
  { model: "MSF1T-30HR-NF", gas: "5/8", liquid: "3/8", maxLength: 25, maxHeight: 10 },
  { model: "MSF1T-36HR-NF", gas: "3/4", liquid: "3/8", maxLength: 25, maxHeight: 10 },
  { model: "MSC1T-12CR-N", gas: "1/2", liquid: "1/4", maxLength: 10, maxHeight: 4 },
  { model: "MSC1T-18CR-N", gas: "1/2", liquid: "1/4", maxLength: 20, maxHeight: 10 },
  { model: "MSC1T-24CR-N", gas: "5/8", liquid: "3/8", maxLength: 20, maxHeight: 10 },
  { model: "MSZ1T-18HR-N", gas: "1/2", liquid: "1/4", maxLength: 15, maxHeight: 8 },
  { model: "MSZ1T-24HR-N", gas: "5/8", liquid: "3/8", maxLength: 10, maxHeight: 10 },
  { model: "MSZ1T-30HR-N", gas: "5/8", liquid: "3/8", maxLength: 25, maxHeight: 10 },
  { model: "MSZ1T-36HR-N", gas: "3/4", liquid: "3/8", maxLength: 25, maxHeight: 10 },
  { model: "M1FPAT-36HRN-Q8", gas: "3/4", liquid: "3/8", maxLength: 25, maxHeight: 15 },
];

const refrigerants: Refrigerant[] = ["R22", "R410A", "R32", "R407C", "R134a", "R404A"];
const capacities = chargeTable.map((row) => row.capacity);

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function RefrigerantCalculatorScreen() {
  const colors = useColors();
  const [refrigerant, setRefrigerant] = useState<Refrigerant>("R22");
  const [capacity, setCapacity] = useState(12000);
  const [length, setLength] = useState("5");
  const [openMenu, setOpenMenu] = useState<"refrigerant" | "capacity" | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const selected = chargeTable.find((row) => row.capacity === capacity) ?? chargeTable[0];
  const lineLength = Math.max(0, Number(length.replace(",", ".")) || 0);
  const baseCharge = refrigerant === "R22" ? selected.r22 : refrigerant === "R410A" ? selected.r410a : selected.r410a;
  const extraPerMeter = refrigerant === "R22" ? 30 : refrigerant === "R410A" ? 15 : 15;
  const standardLength = 5;
  const extraLength = Math.max(0, lineLength - standardLength);
  const extraCharge = extraLength * extraPerMeter;
  const totalCharge = baseCharge + extraCharge;
  const isNonTableBlend = refrigerant !== "R22" && refrigerant !== "R410A";

  const matchingModels = useMemo(
    () => catalogRows.filter((row) => row.gas === selected.gas && row.liquid === selected.liquid),
    [selected.gas, selected.liquid],
  );

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹</Text></Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>حاسبة الفريون</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>الشحنة الأساسية والإضافة حسب طول المواسير</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}20` }]}><IconSymbol name="snowflake" size={25} color={colors.primary} /></View>
        </View>

        <View style={[styles.info, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>طريقة الحساب</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>اختر الفريون والسعة، ثم اكتب طول خط السائل/الغاز بالمتر. الحاسبة تعتبر أول 5 أمتار طولًا قياسيًا، وتضيف كمية لكل متر زائد.</Text>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>نوع الفريون</Text>
        <Pressable onPress={() => setOpenMenu(openMenu === "refrigerant" ? null : "refrigerant")} style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.selectorText, { color: colors.foreground }]}>{refrigerant}</Text><Text style={{ color: colors.muted }}>⌄</Text>
        </Pressable>
        {openMenu === "refrigerant" && <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{refrigerants.map((item) => <Pressable key={item} onPress={() => { setRefrigerant(item); setOpenMenu(null); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }]}>{item}</Text></Pressable>)}</View>}

        <Text style={[styles.label, { color: colors.foreground }]}>سعة التبريد بالـ BTU/h</Text>
        <Pressable onPress={() => setOpenMenu(openMenu === "capacity" ? null : "capacity")} style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.selectorText, { color: colors.foreground }]}>{capacity.toLocaleString("en-US")} BTU/h</Text><Text style={{ color: colors.muted }}>⌄</Text>
        </Pressable>
        {openMenu === "capacity" && <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{capacities.map((item) => <Pressable key={item} onPress={() => { setCapacity(item); setOpenMenu(null); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }]}>{item.toLocaleString("en-US")} BTU/h</Text></Pressable>)}</View>}

        <Text style={[styles.label, { color: colors.foreground }]}>طول المواسير بالمتر</Text>
        <TextInput value={length} onChangeText={setLength} keyboardType="decimal-pad" placeholder="مثال: 8" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />

        <View style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <Text style={[styles.resultCaption, { color: colors.muted }]}>النتيجة التقديرية</Text>
          <Text style={[styles.resultValue, { color: colors.primary }]}>{formatNumber(totalCharge)} جرام</Text>
          <Text style={[styles.resultLine, { color: colors.foreground }]}>الشحنة الأساسية: {formatNumber(baseCharge)} جرام</Text>
          <Text style={[styles.resultLine, { color: colors.foreground }]}>الزيادة: {formatNumber(extraCharge)} جرام ({formatNumber(extraPerMeter)} جم/م × {formatNumber(extraLength)} م)</Text>
          <Text style={[styles.resultLine, { color: colors.foreground }]}>المواسير المقترحة: غاز {selected.gas} — سائل {selected.liquid}</Text>
        </View>

        {isNonTableBlend && <View style={[styles.warning, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}><Text style={styles.warningText}>تنبيه: القيمة الافتراضية لهذا الفريون مبنية على معدل R410A الموجود في الجدول. الفريون الخليط أو البديل يجب شحنه حسب وزن ومواصفات الشركة المصنعة.</Text></View>}

        <Pressable onPress={() => setShowCatalog((value) => !value)} style={[styles.catalogButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.catalogButtonText, { color: colors.foreground }]}>بيانات الكتالوج والموديلات المطابقة</Text><Text style={{ color: colors.muted }}>{showCatalog ? "⌃" : "⌄"}</Text>
        </Pressable>
        {showCatalog && <View style={[styles.catalog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.catalogNote, { color: colors.muted }]}>البيانات التالية من جدول الموديلات المرفق، وتساعد في مراجعة الأقطار والطول الأقصى. طابق رقم الموديل مع لوحة الجهاز قبل التنفيذ.</Text>
          <Text style={[styles.matchTitle, { color: colors.primary }]}>المطابق للأقطار الحالية: {matchingModels.length} موديل</Text>
          {matchingModels.map((item) => <View key={item.model} style={[styles.modelRow, { borderBottomColor: colors.border }]}><Text style={[styles.modelName, { color: colors.foreground }]}>{item.model}</Text><Text style={[styles.modelData, { color: colors.muted }]}>غاز {item.gas} · سائل {item.liquid} · أقصى طول {item.maxLength} م · ارتفاع {item.maxHeight} م</Text></View>)}
        </View>}

        <Text style={[styles.footnote, { color: colors.muted }]}>هذه حاسبة إرشادية وليست بديلًا عن ملصق الجهاز أو كتالوج الشركة. عند اختلاف البيانات، اتبع وزن الشحنة وطول المواسير المحددين للموديل.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 36, gap: 10 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, minHeight: 64 },
  headerText: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 25, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 3, textAlign: "right" },
  back: { fontSize: 42, lineHeight: 42 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  info: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 4 },
  infoTitle: { fontSize: 16, fontWeight: "900", textAlign: "right", marginBottom: 4 },
  infoText: { fontSize: 14, lineHeight: 22, textAlign: "right" },
  label: { fontSize: 15, fontWeight: "800", textAlign: "right", marginTop: 4 },
  selector: { minHeight: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  selectorText: { fontSize: 17, fontWeight: "800" },
  menu: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginTop: -4 },
  menuItem: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  menuText: { textAlign: "right", fontSize: 16, fontWeight: "700" },
  input: { minHeight: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 19, textAlign: "center" },
  result: { borderWidth: 2, borderRadius: 20, padding: 18, alignItems: "center", marginTop: 8 },
  resultCaption: { fontSize: 14 },
  resultValue: { fontSize: 32, fontWeight: "900", marginVertical: 4 },
  resultLine: { width: "100%", textAlign: "right", fontSize: 14, lineHeight: 23 },
  warning: { borderWidth: 1, borderRadius: 14, padding: 12 },
  warningText: { color: "#92400E", textAlign: "right", lineHeight: 21, fontSize: 13, fontWeight: "700" },
  catalogButton: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  catalogButtonText: { fontSize: 15, fontWeight: "800" },
  catalog: { borderWidth: 1, borderRadius: 16, padding: 12 },
  catalogNote: { textAlign: "right", lineHeight: 21, fontSize: 13, marginBottom: 8 },
  matchTitle: { textAlign: "right", fontSize: 14, fontWeight: "900", marginBottom: 4 },
  modelRow: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  modelName: { textAlign: "right", fontWeight: "800", fontSize: 13 },
  modelData: { textAlign: "right", fontSize: 12, lineHeight: 19, marginTop: 2 },
  footnote: { textAlign: "right", fontSize: 12, lineHeight: 19, marginTop: 4 },
});
