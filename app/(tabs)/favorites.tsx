import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Favorite = { id: string; title: string; category: string; content: string };
const STORAGE_KEY = "hvac_favorites";
const emptyForm = { title: "", category: "", content: "" };

export default function FavoritesScreen() {
  const colors = useColors();
  const [items, setItems] = useState<Favorite[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setItems(JSON.parse(value));
    });
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert("بيانات ناقصة", "اكتب اسم المرجع والمعلومة التي تريد حفظها.");
      return;
    }
    const next = [{ id: Date.now().toString(), ...form }, ...items];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
    setForm(emptyForm);
  };

  const remove = (id: string) =>
    Alert.alert("حذف من المفضلة", "هل تريد حذف هذا العنصر؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => {
        const next = items.filter((item) => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setItems(next);
      } },
    ]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>العودة</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>المفضلة</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>احفظ أي معلومة أو قراءة أو مرجع للرجوع إليه بسرعة</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>اسم المرجع</Text>
          <TextInput value={form.title} onChangeText={(value) => setForm({ ...form, title: value })} placeholder="مثال: قراءة جهاز العميل" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>التصنيف</Text>
          <TextInput value={form.category} onChangeText={(value) => setForm({ ...form, category: value })} placeholder="كباس، فريون، ضغط، دائرة..." placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>المعلومة</Text>
          <TextInput value={form.content} onChangeText={(value) => setForm({ ...form, content: value })} placeholder="اكتب المعلومة أو القراءة هنا" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.multiline, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <Pressable onPress={save} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.75 }]}>
            <IconSymbol name="star.fill" size={19} color="#FFFFFF" />
            <Text style={styles.saveText}>حفظ في المفضلة</Text>
          </Pressable>
        </View>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>المحفوظات ({items.length})</Text>
        {items.length === 0 ? <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.emptyText, { color: colors.muted }]}>لم تحفظ أي عناصر بعد.</Text></View> : items.map((item) => (
          <View key={item.id} style={[styles.record, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.recordHeader}>
              <View style={styles.star}><IconSymbol name="star.fill" size={18} color="#FFFFFF" /></View>
              <View style={styles.copy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.category, { color: colors.primary }]}>{item.category || "مرجع عام"}</Text></View>
              <Pressable onPress={() => remove(item.id)}><IconSymbol name="trash" size={20} color="#DC2626" /></Pressable>
            </View>
            <Text style={[styles.recordContent, { color: colors.muted }]}>{item.content}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 42 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  backText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "900", textAlign: "right" },
  subtitle: { fontSize: 14, textAlign: "right", marginTop: 5, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 14 },
  label: { fontSize: 13, fontWeight: "800", textAlign: "right", marginBottom: 6, marginTop: 7 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, textAlign: "right", fontSize: 14 },
  multiline: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" },
  saveButton: { minHeight: 50, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  listTitle: { fontSize: 19, fontWeight: "900", textAlign: "right", marginTop: 22, marginBottom: 10 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 18 },
  emptyText: { textAlign: "right", fontSize: 14 },
  record: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  recordHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  star: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#D97706", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: "900", textAlign: "right" },
  category: { fontSize: 12, fontWeight: "700", textAlign: "right", marginTop: 3 },
  recordContent: { fontSize: 14, textAlign: "right", lineHeight: 22, marginTop: 10 },
});
