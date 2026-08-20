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
  ["الماركة", "brand"], ["الموديل", "model"], ["موديل الوحدة الداخلية", "indoorModel"], ["موديل الوحدة الخارجية", "outdoorModel"],
  ["الرقم التسلسلي", "serial"], ["تاريخ التصنيع", "manufactureDate"], ["نوع الفريون", "refrigerant"], ["السعة BTU", "btu"],
  ["سعة التبريد", "coolingCapacity"], ["سعة التدفئة", "heatingCapacity"], ["جهد التشغيل", "voltage"], ["عدد الفازات", "phase"],
  ["التردد", "frequency"], ["تيار التبريد", "coolingCurrent"], ["تيار التدفئة", "heatingCurrent"], ["الأمبير", "ampere"],
  ["قدرة دخل التبريد", "coolingPower"], ["قدرة دخل التدفئة", "heatingPower"], ["القدرة", "power"], ["EER", "eer"], ["COP", "cop"],
  ["وزن الشحنة", "charge"], ["ضغط التشغيل الأقصى", "maxPressure"], ["درجة الحماية IP", "ipRating"], ["وزن الوحدة الداخلية", "indoorWeight"], ["وزن الوحدة الخارجية", "outdoorWeight"],
] as const;
type FieldKey = (typeof FIELDS)[number][1];
type Form = Record<FieldKey, string>;
const emptyForm = (): Form => Object.fromEntries(FIELDS.map(([, key]) => [key, ""])) as Form;

const clean = (value: string) => value.replace(/[|¦]/g, " ").replace(/\s+/g, " ").trim();
const afterLabel = (line: string, labels: string[]) => {
  const lower = line.toLowerCase();
  for (const label of labels) {
    const index = lower.indexOf(label.toLowerCase());
    if (index >= 0) return clean(line.slice(index + label.length).replace(/^\s*[:=\-#]+\s*/, ""));
  }
  return "";
};

function parsePlateText(rawText: string): Form {
  const lines = rawText.split(/\r?\n/).map(clean).filter(Boolean);
  const result = emptyForm();
  const aliases: Record<FieldKey, string[]> = {
    brand: ["brand", "ماركة", "الشركة", "manufacturer"], model: ["model", "موديل", "type"],
    indoorModel: ["indoor model", "indoor unit", "موديل الوحدة الداخلية", "الوحدة الداخلية"], outdoorModel: ["outdoor model", "outdoor unit", "موديل الوحدة الخارجية", "الوحدة الخارجية"],
    serial: ["serial", "s/n", "serial no", "الرقم التسلسلي", "رقم"], manufactureDate: ["date of manufacture", "manufacture date", "mfg", "تاريخ التصنيع"],
    refrigerant: ["refrigerant", "freon", "الفريون", "غاز"], btu: ["btu", "capacity", "السعة", "تبريد"],
    coolingCapacity: ["cooling capacity", "cooling power", "سعة التبريد", "قدرة التبريد"], heatingCapacity: ["heating capacity", "heating power", "سعة التدفئة", "قدرة التدفئة"],
    voltage: ["voltage", "volt", "v", "الجهد", "الفولت"], phase: ["phase", "ph", "فاز", "فازات"], frequency: ["frequency", "freq", "hz", "التردد", "هرتز"],
    coolingCurrent: ["cooling current", "current cooling", "تيار التبريد"], heatingCurrent: ["heating current", "current heating", "تيار التدفئة"],
    ampere: ["amp", "ampere", "current", "الأمبير", "امبير"], coolingPower: ["cooling input", "cooling power input", "دخل التبريد"], heatingPower: ["heating input", "heating power input", "دخل التدفئة"],
    power: ["power", "watt", "kw", "القدرة", "وات"], eer: ["eer"], cop: ["cop"], charge: ["charge", "kg", "الشحنة", "وزن"],
    maxPressure: ["maximum operating pressure", "max pressure", "working pressure", "ضغط التشغيل", "الضغط الأقصى"], ipRating: ["ip", "ip rating", "درجة الحماية"],
    indoorWeight: ["indoor unit weight", "indoor weight", "وزن الوحدة الداخلية"], outdoorWeight: ["outdoor unit weight", "outdoor weight", "وزن الوحدة الخارجية"],
  };
  (Object.keys(aliases) as FieldKey[]).forEach((key) => {
    for (const line of lines) {
      const value = afterLabel(line, aliases[key]);
      if (value && value.length > 0 && value.length < 80) {
        result[key] = value;
        break;
      }
    }
  });
  if (!result.refrigerant) {
    const match = rawText.match(/R[- ]?(?:22|32|134a|404a|407c|410a|290|600a|454b|1234yf)/i);
    if (match) result.refrigerant = match[0].toUpperCase().replace(" ", "");
  }
  if (!result.frequency) {
    const match = rawText.match(/(?:50|60)\s*Hz/i);
    if (match) result.frequency = match[0].replace(/\s+/g, " ");
  }
  if (!result.voltage) {
    const match = rawText.match(/\b(?:1?10|115|220|230|240|380|400|415)\s*V(?:AC)?\b/i);
    if (match) result.voltage = match[0];
  }
  return result;
}

export default function LabelReaderScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [ocrText, setOcrText] = useState("");
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [saved, setSaved] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const readLabel = async (uri: string) => {
    setReading(true);
    setReadError("");
    setOcrText("");
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
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قارئ لوحة البيانات</Text><View style={{ width: 30 }} /></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>راجع البيانات المقروءة</Text><Text style={[styles.body, { color: colors.muted }]}>بعد التصوير يقرأ التطبيق النص تلقائيًا، ثم يمكنك تصحيح أي قيمة يدويًا قبل الحفظ.</Text>{saved && <View style={styles.savedBox}><Text style={styles.savedTitle}>تم حفظ القراءة داخل هذا البوكس</Text><Text style={styles.savedBody}>الصورة والبيانات المقروءة ما زالت ظاهرة هنا ويمكنك تعديلها أو تصوير لوحة جديدة.</Text></View>}</View>{photoUri && <View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" /><Text style={[styles.photoStatus, { color: reading ? "#D97706" : "#059669" }]}>{reading ? "جارٍ قراءة لوحة البيانات..." : "تم التقاط الصورة وتحليلها"}</Text>{reading && <ActivityIndicator color="#0891B2" style={{ marginTop: 8 }} />}</View>}{readError ? <View style={styles.errorBox}><Text style={styles.errorText}>{readError}</Text></View> : null}{ocrText ? <View style={[styles.ocrBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.ocrTitle, { color: colors.primary }]}>النص المقروء من اللوحة</Text><Text style={[styles.ocrText, { color: colors.foreground }]}>{ocrText}</Text></View> : null}{FIELDS.map(([label, key]) => <View key={key} style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput value={form[key]} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))} placeholder={`غير مقروء — أدخل ${label} يدويًا`} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>)}<Pressable style={styles.primary} onPress={save} disabled={reading}><Text style={styles.whiteText}>حفظ البيانات</Text></Pressable><Pressable style={styles.secondary} onPress={() => { setPhotoUri(null); setForm(emptyForm()); setOcrText(""); setReadError(""); setSaved(false); setCameraOpen(true); }}><Text style={[styles.secondaryText, { color: colors.primary }]}>تصوير لوحة جديدة</Text></Pressable></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 16, gap: 12, paddingBottom: 40 }, header: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { fontSize: 23, fontWeight: "900" }, back: { fontSize: 42, lineHeight: 42, color: "#0891B2" }, card: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: "flex-end" }, cardTitle: { fontSize: 19, fontWeight: "900", textAlign: "right", width: "100%" }, body: { fontSize: 15, lineHeight: 24, textAlign: "right", width: "100%", marginTop: 8 }, permissionIcon: { fontSize: 48, color: "#0891B2" }, primary: { backgroundColor: "#0891B2", borderRadius: 15, padding: 16, alignItems: "center", marginTop: 8 }, whiteText: { color: "#FFF", fontSize: 16, fontWeight: "800" }, secondary: { borderWidth: 1, borderColor: "#0891B2", borderRadius: 15, padding: 15, alignItems: "center" }, secondaryText: { fontSize: 16, fontWeight: "800" }, field: { gap: 6 }, label: { fontSize: 15, fontWeight: "800", textAlign: "right" }, input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16, textAlign: "right" }, photoCard: { borderWidth: 1, borderRadius: 16, padding: 10, alignItems: "center" }, photo: { width: "100%", height: 190, borderRadius: 10 }, photoStatus: { fontSize: 14, fontWeight: "800", marginTop: 8 }, ocrBox: { borderWidth: 1, borderRadius: 14, padding: 12 }, ocrTitle: { fontSize: 14, fontWeight: "900", textAlign: "right" }, ocrText: { fontSize: 13, lineHeight: 21, textAlign: "right", marginTop: 6 }, errorBox: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1, borderRadius: 14, padding: 12 }, errorText: { color: "#B91C1C", fontSize: 13, lineHeight: 21, textAlign: "right", fontWeight: "700" }, savedBox: { width: "100%", marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#6EE7B7" }, savedTitle: { color: "#047857", fontSize: 15, fontWeight: "900", textAlign: "right" }, savedBody: { color: "#065F46", fontSize: 13, lineHeight: 20, textAlign: "right", marginTop: 4 }, camera: { flex: 1, backgroundColor: "#000" }, overlay: { flex: 1, justifyContent: "space-between", padding: 24, paddingTop: 80 }, hint: { color: "#FFF", textAlign: "center", fontSize: 17, fontWeight: "700", backgroundColor: "#0009", padding: 12, borderRadius: 12 }, cameraActions: { alignItems: "center", gap: 20 }, cameraButton: { backgroundColor: "#0009", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 }, shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" }, shutterInner: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: "#0891B2" } });

void emptyForm;
void TextRecognition;
void parsePlateText;
