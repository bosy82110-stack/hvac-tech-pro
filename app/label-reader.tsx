import TextRecognition from "@react-native-ml-kit/text-recognition";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

const FIELDS = [
  ["Model", "model", "Model", "طراز الجهاز كما هو مكتوب على اللوحة."],
  ["Cooling Capacity", "coolingCapacity", "Cooling Capacity", "قدرة التبريد الاسمية."],
  ["Heating Capacity", "heatingCapacity", "Heating Capacity", "قدرة التدفئة الاسمية."],
  ["Refrigerant", "refrigerant", "Refrigerant", "نوع وسيط التبريد."],
  ["Refrigerant Quantity / Charge", "charge", "Refrigerant Quantity / Charge", "كمية شحنة وسيط التبريد."],
  ["Rated Voltage", "voltage", "Rated Voltage", "الجهد الاسمي."],
  ["Phase", "phase", "Phase", "عدد الفازات."],
  ["Rated Frequency", "frequency", "Rated Frequency", "التردد الاسمي."],
  ["Rated Cooling Current", "ratedCoolingCurrent", "Rated Cooling Current", "التيار الاسمي أثناء التبريد."],
  ["Rated Heating Current", "ratedHeatingCurrent", "Rated Heating Current", "التيار الاسمي أثناء التدفئة."],
  ["Rated Power Input", "ratedPowerInput", "Rated Power Input", "القدرة الكهربائية الاسمية الداخلة."],
  ["EER", "eer", "EER", "نسبة كفاءة التبريد."],
  ["COP", "cop", "COP", "معامل أداء التدفئة."],
  ["Max. Discharge Pressure", "maxDischargePressure", "Max. Discharge Pressure", "أقصى ضغط للطرد."],
  ["Max. Suction Pressure", "maxSuctionPressure", "Max. Suction Pressure", "أقصى ضغط للسحب."],
  ["Design Pressure", "designPressure", "Design Pressure", "ضغط التصميم."],
  ["Compressor FLA", "compressorFLA", "Compressor FLA", "تيار الحمل الكامل للضاغط."],
  ["Compressor RLA", "compressorRLA", "Compressor RLA", "تيار الحمل المقنن للضاغط."],
  ["Compressor LRA", "compressorLRA", "Compressor LRA", "تيار بدء الحركة المقفل للضاغط."],
  ["MCA", "mca", "MCA", "الحد الأدنى لسعة التيار."],
  ["MOCP", "mocp", "MOCP", "الحد الأقصى لحماية التيار."],
  ["Climate Type (T1/T3)", "climateType", "Climate Type (T1/T3)", "تصنيف المناخ مثل T1 أو T3."],
  ["Max. Operating Temperature", "maxOperatingTemperature", "Max. Operating Temperature", "أقصى درجة حرارة تشغيل."],
  ["Indoor Air Volume", "indoorAirVolume", "Indoor Air Volume", "حجم تدفق الهواء للوحدة الداخلية."],
  ["Indoor Unit Weight", "indoorWeight", "Indoor Unit Weight", "وزن الوحدة الداخلية."],
  ["Outdoor Unit Weight", "outdoorWeight", "Outdoor Unit Weight", "وزن الوحدة الخارجية."],
  ["Waterproof Class / IP", "ipRating", "Waterproof Class / IP", "فئة الحماية من الماء والأجسام الصلبة."],
  ["Serial Number", "serial", "Serial Number", "الرقم التسلسلي."],
  ["Manufacturing Date", "manufactureDate", "Manufacturing Date", "تاريخ التصنيع."],
  ["Matching Indoor", "matchingIndoor", "Matching Indoor", "موديل الوحدة الداخلية المطابق."],
] as const;
type FieldKey = (typeof FIELDS)[number][1];
type FieldDefinition = readonly [string, FieldKey, string, string];
type Form = Record<FieldKey, string>;
const emptyForm = (): Form => Object.fromEntries(FIELDS.map(([, key]) => [key, ""])) as Form;

const clean = (value: string) => value.replace(/[|¦]/g, " ").replace(/\s+/g, " ").trim();
const normalizeLabel = (value: string) => clean(value).toLowerCase().replace(/[/:=\-#()[\].]/g, " ").replace(/\s+/g, " ").trim();
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
const labelWords = new Set(["model", "number", "no", "cooling", "heating", "capacity", "btu", "hr", "refrigerant", "quantity", "charge", "rated", "voltage", "volt", "volts", "phase", "ph", "frequency", "freq", "hz", "current", "amps", "amperage", "power", "input", "eer", "cop", "max", "discharge", "suction", "pressure", "design", "compressor", "fla", "rla", "lra", "mca", "mocp", "climate", "type", "operating", "temperature", "indoor", "air", "volume", "unit", "weight", "waterproof", "class", "ip", "serial", "manufacturing", "date", "matching"]);
const looksLikeLabel = (value: string) => {
  const normalized = normalizeLabel(value);
  return !normalized || (!/\d/.test(value) && normalized.split(" ").every((word) => labelWords.has(word)));
};

function parsePlateText(rawText: string): Form {
  const lines = rawText.split(/\r?\n/).map(clean).filter(Boolean);
  const result = emptyForm();

  const valueFor = (labels: string[]) => {
    const wanted = labels
      .map((raw) => ({ raw, normalized: normalizeLabel(raw) }))
      .sort((a, b) => b.normalized.length - a.normalized.length);
    for (let index = 0; index < lines.length; index += 1) {
      const normalized = normalizeLabel(lines[index]);
      const exact = wanted.find((label) => normalized === label.normalized);
      if (exact) {
        const next = clean(lines[index + 1] ?? "");
        if (next && !looksLikeLabel(next)) return next;
        continue;
      }
      const inlineLabel = wanted.find((label) => normalized.startsWith(`${label.normalized} `));
      if (inlineLabel) {
        const pattern = new RegExp(`^\\s*${escapeRegExp(inlineLabel.raw).replace(/\\\\ /g, "\\\\s+")}\\s*(?:[:=\\-]\\s*)?(.+)$`, "i");
        const match = lines[index].match(pattern);
        const value = clean(match?.[1] ?? "");
        if (value && !looksLikeLabel(value)) return value;
      }
    }
    return "";
  };

  const read = (key: FieldKey, labels: string[]) => {
    result[key] = valueFor(labels);
  };

  read("model", ["Model of outdoor unit", "Model Number", "Model No", "Model Name", "Model"]);
  read("coolingCapacity", ["Cooling Capacity", "Cooling Capacity Btu Hr", "Capacity Cooling"]);
  read("heatingCapacity", ["Heating Capacity", "Heating Capacity Btu Hr", "Capacity Heating"]);
  read("refrigerant", ["Refrigerant", "Refrigerant Type"]);
  read("charge", ["Refrigerant Quantity / Charge", "Refrigerant Charge", "Refrigerant Quantity", "Charge"]);
  read("voltage", ["Rated Voltage", "Rated volt", "Voltage", "Power Supply Volts Ph Hz"]);
  read("phase", ["Phase", "Ph"]);
  read("frequency", ["Rated Frequency", "Rated frequency", "Frequency", "Freq"]);
  read("ratedCoolingCurrent", ["Rated Cooling Current", "Cooling current input", "Cooling Current", "Cooling Amps", "Rated Cooling Amps"]);
  read("ratedHeatingCurrent", ["Rated Heating Current", "Heating current input", "Heating Current", "Heating Amps", "Rated Heating Amps"]);
  read("ratedPowerInput", ["Rated Power Input", "Cooling power input", "Heating power input", "Power Input", "Input Power"]);
  read("eer", ["EER", "E.E.R"]);
  read("cop", ["COP"]);
  read("maxDischargePressure", ["Max Discharge Pressure", "Maximum Discharge Pressure", "Outdoor max operating pressure of heat exchanger", "Max operating pressure"]);
  read("maxSuctionPressure", ["Max Suction Pressure", "Maximum Suction Pressure"]);
  read("designPressure", ["Design Pressure"]);
  read("compressorFLA", ["Compressor FLA", "FLA"]);
  read("compressorRLA", ["Compressor RLA", "RLA"]);
  read("compressorLRA", ["Compressor LRA", "LRA"]);
  read("mca", ["MCA", "Minimum Circuit Ampacity"]);
  read("mocp", ["MOCP", "Maximum Overcurrent Protection"]);
  read("climateType", ["Climate Type T1 T3", "Test conditions", "Climate Type", "T1 T3"]);
  read("maxOperatingTemperature", ["Max Operating Temperature", "Maximum Operating Temperature"]);
  read("indoorAirVolume", ["Indoor Air Volume", "Air Volume", "Air Flow"]);
  read("indoorWeight", ["Indoor Unit Weight"]);
  read("outdoorWeight", ["Outdoor unit weight", "Outdoor Unit Weight"]);
  read("ipRating", ["Water of proof", "Waterproof Class IP", "Waterproof Class", "IP Rating", "Waterproof", "IP"]);
  read("serial", ["Serial Number", "Serial No", "Number of manufacture", "S N", "S/N"]);
  read("manufactureDate", ["Manufacturing Date", "Manufacture Date", "Date Of Manufacture", "MFG Date"]);
  read("matchingIndoor", ["Matching Indoor", "Matching Indoor Unit", "Matched Indoor Unit"]);

  const nextLineAfter = (needle: RegExp) => {
    const index = lines.findIndex((line) => needle.test(normalizeLabel(line)));
    return index >= 0 ? clean(lines[index + 1] ?? "") : "";
  };
  const setIfEmpty = (key: FieldKey, value: string) => {
    const cleaned = clean(value);
    if (!result[key] && cleaned && !looksLikeLabel(cleaned)) result[key] = cleaned;
  };
  const pair = (value: string) => value.match(/(\d+(?:[.,]\d+)?)\s*(?:kw|w|a|amps?|psig?)?\s*[\/|]\s*(\d+(?:[.,]\d+)?)/i);

  // Power Supply: Volts - Ph - Hz / 208/230 - 1 - 60 (the three values may be on separate lines).
  const powerSupply = nextLineAfter(/power supply|volts ph hz/);
  if (powerSupply) {
    const powerParts = powerSupply.split(/\s*[\-–—]\s*/).map(clean).filter(Boolean);
    if (powerParts.length >= 3) {
      setIfEmpty("voltage", powerParts[0]);
      setIfEmpty("phase", powerParts[1]);
      setIfEmpty("frequency", powerParts[2]);
    }
  }

  // Carrier/Zamil-style tables: Capacity (Btu/hr) / EER followed by a value row.
  const coolingRow = nextLineAfter(/capacity btu hr eer/);
  if (coolingRow) {
    const capacity = coolingRow.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:btu\s*\/?\s*hr)?/i);
    if (capacity) setIfEmpty("coolingCapacity", capacity[1]);
    const efficiency = coolingRow.match(/(?:\/|\|)\s*(\d+(?:\.\d+)?)/);
    if (efficiency) setIfEmpty("eer", efficiency[1]);
  }
  const heatingRow = nextLineAfter(/capacity btu hr cop/);
  if (heatingRow) {
    const capacity = heatingRow.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:w|btu\s*\/?\s*hr)?/i);
    if (capacity) setIfEmpty("heatingCapacity", capacity[1]);
    const efficiency = heatingRow.match(/(?:\/|\|)\s*(\d+(?:\.\d+)?)/);
    if (efficiency) setIfEmpty("cop", efficiency[1]);
  }

  // Input-Power(W)/Current(Amps) rows contain both values in one cell.
  const inputRow = nextLineAfter(/input power|input power w.*current|power w.*current/);
  if (inputRow) {
    const values = pair(inputRow);
    if (values) {
      setIfEmpty("ratedPowerInput", values[1]);
      setIfEmpty("ratedCoolingCurrent", values[2]);
    }
  }

  // Refrigerant and charge are often printed in one row: Refrigerant R410a 265/-.
  const refrigerantLine = lines.find((line) => /refrigerant/i.test(line));
  if (refrigerantLine) {
    const refrigerant = refrigerantLine.match(/\b(R(?:22|32|134a|404a|407c|410a|290|600a))\b/i);
    if (refrigerant) setIfEmpty("refrigerant", refrigerant[1]);
    const afterType = refrigerantLine.replace(refrigerant?.[0] ?? "", "");
    const charge = afterType.match(/\b(\d+(?:[.,]\d+)?)\s*(?:kg|g)?\b/i);
    if (charge) setIfEmpty("charge", charge[1]);
  }

  // Compressor FLA/LRA and MCA/MOCP are slash-separated pairs.
  const compressorRow = nextLineAfter(/compressor fla.*lra/);
  const compressorValues = pair(compressorRow);
  if (compressorValues) {
    setIfEmpty("compressorFLA", compressorValues[1]);
    setIfEmpty("compressorLRA", compressorValues[2]);
  }
  const ampacityRow = nextLineAfter(/mca.*mocp/);
  const ampacityValues = pair(ampacityRow);
  if (ampacityValues) {
    setIfEmpty("mca", ampacityValues[1]);
    setIfEmpty("mocp", ampacityValues[2]);
  }

  // Design Pressure may contain H.S. and L.S. values instead of explicit max-pressure labels.
  const pressureRow = nextLineAfter(/design pressure/);
  const pressures = [...pressureRow.matchAll(/(\d+(?:[.,]\d+)?)\s*psig?\s*(h\.?s\.?|l\.?s\.?)/gi)];
  for (const match of pressures) {
    if (/h/i.test(match[2])) setIfEmpty("maxDischargePressure", match[1]);
    if (/l/i.test(match[2])) setIfEmpty("maxSuctionPressure", match[1]);
  }

  return result;
}

export default function LabelReaderScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [saved, setSaved] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const readLabel = async (uri: string) => {
    setReading(true);
    setReadError("");
    try {
      const result = await TextRecognition.recognize(uri);
      const text = result.text?.trim() ?? "";
      setOcrText(text);
      if (text) {
        const extracted = parsePlateText(text);
        setForm(extracted);
        if (!Object.values(extracted).some(Boolean)) {
          setReadError("تم التقاط الصورة، لكن النص غير واضح بما يكفي لاستخراج الحقول. قرّب اللوحة وأعد التصوير بإضاءة جيدة.");
        }
      } else {
        setOcrText("");
        setReadError("لم يتم التعرف على نص في الصورة. نظّف اللوحة، قرّب الكاميرا، وثبّت الهاتف ثم أعد التصوير.");
      }
    } catch {
      setReadError("تعذر تحليل الصورة. تأكد من وضوح اللوحة ثم اضغط «تصوير لوحة جديدة» وحاول مرة أخرى.");
    } finally {
      setReading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: false });
      if (result?.uri) {
        setPhotoUri(result.uri);
        setCameraOpen(false);
        await readLabel(result.uri);
      }
    } catch {
      Alert.alert("تعذر التقاط الصورة", "حاول مرة أخرى وثبّت الهاتف على لوحة البيانات.");
    }
  };

  const save = () => {
    setSaved(true);
  };

  if (cameraOpen) return <SafeAreaView style={styles.camera}><CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" autofocus="on" /><View style={styles.overlay}><Text style={styles.hint}>ضع لوحة البيانات كاملة داخل الإطار، واجعل الكتابة واضحة ومضاءة</Text><View style={styles.cameraActions}><Pressable style={styles.cameraButton} onPress={() => setCameraOpen(false)}><Text style={styles.whiteText}>رجوع</Text></Pressable><Pressable style={styles.shutter} onPress={takePhoto}><View style={styles.shutterInner} /></Pressable></View></View></SafeAreaView>;
  if (!permission?.granted && !photoUri) return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قارئ لوحة البيانات</Text><View style={{ width: 30 }} /></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={styles.permissionIcon}>▣</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>قراءة بيانات الجهاز</Text><Text style={[styles.body, { color: colors.muted }]}>صوّر لوحة بيانات الجهاز، وسيقرأ التطبيق النص تلقائيًا ثم يملأ الحقول لتراجعها قبل الحفظ.</Text><Pressable style={styles.primary} onPress={requestPermission}><Text style={styles.whiteText}>السماح بالكاميرا</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قارئ لوحة البيانات</Text><View style={{ width: 30 }} /></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>راجع البيانات المقروءة</Text><Text style={[styles.body, { color: colors.muted }]}>بعد التصوير يقرأ التطبيق النص تلقائيًا، ثم يمكنك تصحيح أي قيمة يدويًا قبل الحفظ.</Text>{saved && <View style={styles.savedBox}><Text style={styles.savedTitle}>تم حفظ القراءة داخل هذا البوكس</Text><Text style={styles.savedBody}>الصورة والبيانات المقروءة ما زالت ظاهرة هنا ويمكنك تعديلها أو تصوير لوحة جديدة.</Text></View>}</View>{photoUri && <View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" /><Text style={[styles.photoStatus, { color: reading ? "#D97706" : "#059669" }]}>{reading ? "جارٍ قراءة لوحة البيانات..." : "تم التقاط الصورة وتحليلها"}</Text>{reading && <ActivityIndicator color="#0891B2" style={{ marginTop: 8 }} />}</View>}{ocrText ? <View style={[styles.ocrBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.ocrTitle, { color: colors.foreground }]}>النص الذي قرأته الكاميرا</Text><Text selectable style={[styles.ocrText, { color: colors.foreground }]}>{ocrText}</Text></View> : null}{readError ? <View style={styles.errorBox}><Text style={styles.errorText}>{readError}</Text></View> : null}{FIELDS.map(([label, key, _english, meaning]) => <View key={key} style={styles.field}><View style={styles.fieldHeading}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text></View><Text style={[styles.meaning, { color: colors.muted }]}>{meaning}</Text><TextInput value={form[key]} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))} placeholder={`Unread — enter ${label} manually`} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>)}<Pressable style={styles.primary} onPress={save} disabled={reading}><Text style={styles.whiteText}>حفظ البيانات</Text></Pressable><Pressable style={styles.secondary} onPress={() => { setPhotoUri(null); setForm(emptyForm()); setReadError(""); setOcrText(""); setSaved(false); setCameraOpen(true); }}><Text style={[styles.secondaryText, { color: colors.primary }]}>تصوير لوحة جديدة</Text></Pressable></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 16, gap: 12, paddingBottom: 40 }, header: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { fontSize: 23, fontWeight: "900" }, back: { fontSize: 42, lineHeight: 42, color: "#0891B2" }, card: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: "flex-end" }, cardTitle: { fontSize: 19, fontWeight: "900", textAlign: "right", width: "100%" }, body: { fontSize: 15, lineHeight: 24, textAlign: "right", width: "100%", marginTop: 8 }, permissionIcon: { fontSize: 48, color: "#0891B2" }, primary: { backgroundColor: "#0891B2", borderRadius: 15, padding: 16, alignItems: "center", marginTop: 8 }, whiteText: { color: "#FFF", fontSize: 16, fontWeight: "800" }, secondary: { borderWidth: 1, borderColor: "#0891B2", borderRadius: 15, padding: 15, alignItems: "center" }, secondaryText: { fontSize: 16, fontWeight: "800" }, field: { gap: 6 }, fieldHeading: { gap: 3, alignItems: "flex-end" }, label: { fontSize: 15, fontWeight: "800", textAlign: "right" }, englishLabel: { fontSize: 12, fontWeight: "800", textAlign: "right" }, meaning: { fontSize: 12, lineHeight: 18, textAlign: "right" }, input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16, textAlign: "right" }, photoCard: { borderWidth: 1, borderRadius: 16, padding: 10, alignItems: "center" }, photo: { width: "100%", height: 190, borderRadius: 10 }, photoStatus: { fontSize: 14, fontWeight: "800", marginTop: 8 }, ocrBox: { borderWidth: 1, borderRadius: 14, padding: 12 }, ocrTitle: { fontSize: 14, fontWeight: "900", textAlign: "right" }, ocrText: { fontSize: 13, lineHeight: 21, textAlign: "right", marginTop: 6 }, errorBox: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1, borderRadius: 14, padding: 12 }, errorText: { color: "#B91C1C", fontSize: 13, lineHeight: 21, textAlign: "right", fontWeight: "700" }, savedBox: { width: "100%", marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#6EE7B7" }, savedTitle: { color: "#047857", fontSize: 15, fontWeight: "900", textAlign: "right" }, savedBody: { color: "#065F46", fontSize: 13, lineHeight: 20, textAlign: "right", marginTop: 4 }, camera: { flex: 1, backgroundColor: "#000" }, overlay: { flex: 1, justifyContent: "space-between", padding: 24, paddingTop: 80 }, hint: { color: "#FFF", textAlign: "center", fontSize: 17, fontWeight: "700", backgroundColor: "#0009", padding: 12, borderRadius: 12 }, cameraActions: { alignItems: "center", gap: 20 }, cameraButton: { backgroundColor: "#0009", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 }, shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" }, shutterInner: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: "#0891B2" } });

void emptyForm;
void TextRecognition;
void parsePlateText;
