import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

const PIPE_SIZES = [
  { inch: "1/4", mm: 6.35 },
  { inch: "3/8", mm: 9.52 },
  { inch: "1/2", mm: 12.7 },
  { inch: "5/8", mm: 15.88 },
  { inch: "3/4", mm: 19.05 },
  { inch: "7/8", mm: 22.23 },
  { inch: "1", mm: 25.4 },
  { inch: "1 1/8", mm: 28.58 },
  { inch: "1 3/8", mm: 34.93 },
  { inch: "1 5/8", mm: 41.28 },
  { inch: "2 1/8", mm: 53.98 },
];

type PointKey = "pipeA" | "pipeB" | "refA" | "refB";
type Points = Record<PointKey, number>;

const clamp = (value: number) => Math.max(0.02, Math.min(0.98, value));
const distance = (a: number, b: number, width: number) => Math.abs(a - b) * width;

export default function PipeMeasureScreen() {
  const router = useRouter();
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [referenceMm, setReferenceMm] = useState("100");
  const [canvasWidth, setCanvasWidth] = useState(1);
  const [points, setPoints] = useState<Points>({ pipeA: 0.34, pipeB: 0.66, refA: 0.18, refB: 0.28 });
  const [activePoint, setActivePoint] = useState<PointKey | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = clamp(event.nativeEvent.locationX / Math.max(canvasWidth, 1));
          const nearest = (Object.keys(points) as PointKey[]).reduce((best, key) =>
            Math.abs(points[key] - x) < Math.abs(points[best] - x) ? key : best,
          "pipeA");
          setActivePoint(nearest);
        },
        onPanResponderMove: (event) => {
          if (!activePoint) return;
          setPoints((current) => ({ ...current, [activePoint]: clamp(event.nativeEvent.locationX / Math.max(canvasWidth, 1)) }));
        },
        onPanResponderRelease: () => setActivePoint(null),
        onPanResponderTerminate: () => setActivePoint(null),
      }),
    [activePoint, canvasWidth, points],
  );

  const refMm = Number(referenceMm.replace(",", ".")) || 0;
  const referencePixels = distance(points.refA, points.refB, canvasWidth);
  const pipePixels = distance(points.pipeA, points.pipeB, canvasWidth);
  const measuredMm = refMm > 0 && referencePixels > 3 ? (pipePixels / referencePixels) * refMm : 0;
  const measuredInch = measuredMm / 25.4;
  const closest = PIPE_SIZES.reduce((best, item) =>
    Math.abs(item.mm - measuredMm) < Math.abs(best.mm - measuredMm) ? item : best,
  PIPE_SIZES[0]);

  const takePhoto = async () => {
    const result = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
    if (result?.uri) {
      setPhotoUri(result.uri);
      setCameraOpen(false);
    }
  };

  if (cameraOpen) {
    return (
      <SafeAreaView style={styles.cameraScreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraHint}>ضع الماسورة والمرجع المعروف في نفس المستوى</Text>
          <View style={styles.cameraActions}>
            <Pressable style={styles.cameraButton} onPress={() => setCameraOpen(false)}><Text style={styles.cameraButtonText}>رجوع</Text></Pressable>
            <Pressable style={styles.shutter} onPress={takePhoto}><View style={styles.shutterInner} /></Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted && !photoUri) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قياس قطر الماسورة</Text><View style={{ width: 30 }} /></View>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>⌾</Text>
          <Text style={[styles.permissionTitle, { color: colors.foreground }]}>نحتاج إلى الكاميرا</Text>
          <Text style={[styles.permissionText, { color: colors.muted }]}>التقط صورة للماسورة مع مسطرة أو بطاقة مرجعية معروفة المقاس.</Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}><Text style={styles.primaryText}>السماح بالكاميرا</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>قياس قطر الماسورة</Text><View style={{ width: 30 }} /></View>
        <View style={[styles.explainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.explainTitle, { color: colors.foreground }]}>قياس يدوي مُعاير</Text>
          <Text style={[styles.explainText, { color: colors.muted }]}>صوّر الماسورة بجانب مرجع معروف، ثم حرّك المؤشرين الأزرقين على حافتي المرجع والمؤشرين الأحمرين على حافتي الماسورة.</Text>
        </View>
        {!photoUri ? (
          <Pressable style={styles.primaryButton} onPress={() => setCameraOpen(true)}><Text style={styles.primaryText}>فتح الكاميرا والتقاط صورة</Text></Pressable>
        ) : (
          <>
            <View style={[styles.referenceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>طول المرجع المعروف بالملليمتر</Text>
              <TextInput value={referenceMm} onChangeText={setReferenceMm} keyboardType="decimal-pad" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="مثال: 100" placeholderTextColor={colors.muted} />
              <Text style={[styles.smallText, { color: colors.muted }]}>مثال: مسطرة 100 مم أو بطاقة معايرة معروفة.</Text>
            </View>
            <View style={styles.imageArea} onLayout={(event) => setCanvasWidth(event.nativeEvent.layout.width)} {...panResponder.panHandlers}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
              <View style={styles.lineRef} pointerEvents="none" />
              <View style={[styles.measureLine, { left: `${Math.min(points.pipeA, points.pipeB) * 100}%`, width: `${Math.abs(points.pipeA - points.pipeB) * 100}%` }]} pointerEvents="none" />
              {(Object.keys(points) as PointKey[]).map((key) => {
                const isRef = key.startsWith("ref");
                return <View key={key} pointerEvents="none" style={[styles.marker, isRef ? styles.refMarker : styles.pipeMarker, { left: `${points[key] * 100}%` }]}><Text style={styles.markerText}>{isRef ? "مرجع" : "ماسورة"}</Text></View>;
              })}
            </View>
            <Text style={[styles.dragHint, { color: colors.muted }]}>اسحب أقرب مؤشر إلى الحافة المطلوبة. الأزرق للمرجع، والأحمر للماسورة.</Text>
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.muted }]}>القطر المقاس</Text>
              <Text style={[styles.resultValue, { color: colors.primary }]}>{measuredMm > 0 ? `${measuredMm.toFixed(2)} مم` : "حرّك المؤشرات"}</Text>
              <Text style={[styles.resultSub, { color: colors.foreground }]}>{measuredMm > 0 ? `${measuredInch.toFixed(3)} بوصة` : ""}</Text>
              {measuredMm > 0 && <Text style={[styles.closest, { color: colors.foreground }]}>أقرب مقاس HVAC: {closest.inch} بوصة ({closest.mm} مم)</Text>}
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => { setPhotoUri(null); setCameraOpen(true); }}><Text style={styles.secondaryText}>التقاط صورة جديدة</Text></Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, gap: 14, paddingBottom: 40 }, header: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { fontSize: 24, fontWeight: "900" }, back: { fontSize: 42, lineHeight: 42, color: "#0891B2" }, explainCard: { borderWidth: 1, borderRadius: 20, padding: 16 }, explainTitle: { fontSize: 19, fontWeight: "900", marginBottom: 8 }, explainText: { fontSize: 15, lineHeight: 24, textAlign: "right" }, primaryButton: { backgroundColor: "#0891B2", borderRadius: 15, padding: 17, alignItems: "center" }, primaryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" }, permissionCard: { margin: 18, marginTop: 80, borderRadius: 24, padding: 24, alignItems: "center", backgroundColor: "#FFFFFF" }, permissionIcon: { fontSize: 54, color: "#0891B2" }, permissionTitle: { fontSize: 23, fontWeight: "900", marginVertical: 12 }, permissionText: { textAlign: "center", fontSize: 16, lineHeight: 25, marginBottom: 20 }, cameraScreen: { flex: 1, backgroundColor: "#000" }, cameraOverlay: { flex: 1, justifyContent: "space-between", padding: 24, paddingTop: 80 }, cameraHint: { color: "#FFF", textAlign: "center", fontSize: 17, fontWeight: "700", backgroundColor: "#0008", padding: 12, borderRadius: 12 }, cameraActions: { alignItems: "center", gap: 20 }, cameraButton: { backgroundColor: "#0009", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 }, cameraButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" }, shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" }, shutterInner: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: "#0891B2" }, referenceCard: { borderWidth: 1, borderRadius: 18, padding: 16 }, label: { fontWeight: "800", fontSize: 16, marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, textAlign: "center" }, smallText: { marginTop: 7, fontSize: 13 }, imageArea: { height: 360, borderRadius: 18, overflow: "hidden", backgroundColor: "#EEF2F7", position: "relative" }, photo: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" }, marker: { position: "absolute", top: "42%", width: 6, height: 62, marginLeft: -3, borderRadius: 4, alignItems: "center" }, pipeMarker: { backgroundColor: "#DC2626" }, refMarker: { backgroundColor: "#2563EB", top: "55%" }, markerText: { position: "absolute", top: -24, width: 56, marginLeft: -25, color: "#FFF", backgroundColor: "#0F172A", textAlign: "center", borderRadius: 5, fontSize: 10, paddingVertical: 2 }, measureLine: { position: "absolute", top: "42%", height: 3, backgroundColor: "#DC2626" }, lineRef: { position: "absolute", top: "55%", left: "18%", width: "10%", height: 3, backgroundColor: "#2563EB" }, dragHint: { textAlign: "center", fontSize: 14 }, resultCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: "center" }, resultLabel: { fontSize: 14 }, resultValue: { fontSize: 30, fontWeight: "900", marginTop: 4 }, resultSub: { fontSize: 20, fontWeight: "800", marginTop: 2 }, closest: { fontSize: 16, fontWeight: "800", marginTop: 12 }, secondaryButton: { borderWidth: 1, borderColor: "#0891B2", borderRadius: 14, padding: 15, alignItems: "center" }, secondaryText: { color: "#0891B2", fontSize: 16, fontWeight: "800" },
});

const noop = undefined;
void noop;

// The image overlay is intentionally calibrated in the same display coordinate space used by both marker pairs.
// This keeps the manual measurement deterministic across different phone widths.
void noop;

// prevent accidental tree-shaking of the calibration explanation in strict builds
void distance;
