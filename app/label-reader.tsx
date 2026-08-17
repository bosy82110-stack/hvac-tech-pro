import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/use-colors";

const FIELDS = [
  ["الماركة", "brand"], ["الموديل", "model"], ["نوع الفريون", "refrigerant"],
  ["السعة BTU", "btu"], ["الجهد", "voltage"], ["التردد", "frequency"],
  ["الأمبير", "ampere"], ["القدرة", "power"], ["وزن الشحنة", "charge"],
] as const;
type FieldKey = (typeof FIELDS)[number][1];
type Form = Record<FieldKey, string>;
const emptyForm = (): Form => Object.fromEntries(FIELDS.map(([, key]) => [key, ""])) as Form;

export default function LabelReaderScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const cameraRef = useRef<CameraView>(null);

  const takePhoto = async () => {
    const result = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (result?.uri) { setPhotoUri(result.uri); setCameraOpen(false); }
  };
  const save = async () => {
    await AsyncStorage.setItem("hvac_label_reader_last", JSON.stringify({ ...form, photoUri, savedAt: new Date().toISOString() }));
  };
  if (cameraOpen) return <SafeAreaView style={styles.camera}><CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" /><View style={styles.overlay}><Text style={styles.hint}>ضع لوحة البيانات كاملة داخل الإطار</Text><View style={styles.cameraActions}><Pressable style={styles.cameraButton} onPress={() => setCameraOpen(false)}><Text style={styles.whiteText}>رجوع</Text></Pressable><Pressable style={styles.shutter} onPress={takePhoto}><View style={styles.shutterInner} /></Pressable></View></View></SafeAreaView>;
  if (!permission?.granted && !photoUri) return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قارئ لوحة البيانات</Text><View style={{ width: 30 }} /></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={styles.permissionIcon}>▣</Text><Text style={[styles.cardTitle, { color: colors.foreground }]}>قراءة بيانات الجهاز</Text><Text style={[styles.body, { color: colors.muted }]}>صوّر لوحة بيانات الجهاز، ثم راجع البيانات واكتبها في الحقول قبل حفظها.</Text><Pressable style={styles.primary} onPress={requestPermission}><Text style={styles.whiteText}>السماح بالكاميرا</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قارئ لوحة البيانات</Text><View style={{ width: 30 }} /></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>راجع البيانات قبل الحفظ</Text><Text style={[styles.body, { color: colors.muted }]}>التطبيق يحفظ الصورة والبيانات التي تدخلها محليًا على الهاتف.</Text></View>{photoUri && <View style={[styles.photoBadge, { borderColor: colors.border }]}><Text style={[styles.body, { color: colors.primary }]}>تم التقاط صورة لوحة البيانات</Text></View>}{FIELDS.map(([label, key]) => <View key={key} style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput value={form[key]} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))} placeholder={`أدخل ${label}`} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>)}<Pressable style={styles.primary} onPress={save}><Text style={styles.whiteText}>حفظ البيانات</Text></Pressable><Pressable style={styles.secondary} onPress={() => { setPhotoUri(null); setForm(emptyForm()); setCameraOpen(true); }}><Text style={[styles.secondaryText, { color: colors.primary }]}>تصوير لوحة جديدة</Text></Pressable></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 16, gap: 12, paddingBottom: 40 }, header: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { fontSize: 23, fontWeight: "900" }, back: { fontSize: 42, lineHeight: 42, color: "#0891B2" }, card: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: "flex-end" }, cardTitle: { fontSize: 19, fontWeight: "900", textAlign: "right", width: "100%" }, body: { fontSize: 15, lineHeight: 24, textAlign: "right", width: "100%", marginTop: 8 }, permissionIcon: { fontSize: 48, color: "#0891B2" }, primary: { backgroundColor: "#0891B2", borderRadius: 15, padding: 16, alignItems: "center", marginTop: 8 }, whiteText: { color: "#FFF", fontSize: 16, fontWeight: "800" }, secondary: { borderWidth: 1, borderColor: "#0891B2", borderRadius: 15, padding: 15, alignItems: "center" }, secondaryText: { fontSize: 16, fontWeight: "800" }, field: { gap: 6 }, label: { fontSize: 15, fontWeight: "800", textAlign: "right" }, input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16, textAlign: "right" }, photoBadge: { borderWidth: 1, borderRadius: 12, padding: 10, alignItems: "center" }, camera: { flex: 1, backgroundColor: "#000" }, overlay: { flex: 1, justifyContent: "space-between", padding: 24, paddingTop: 80 }, hint: { color: "#FFF", textAlign: "center", fontSize: 17, fontWeight: "700", backgroundColor: "#0009", padding: 12, borderRadius: 12 }, cameraActions: { alignItems: "center", gap: 20 }, cameraButton: { backgroundColor: "#0009", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 }, shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" }, shutterInner: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: "#0891B2" } });

void emptyForm;
