import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const references = [
  ["تشخيص عطل", "خطوة بخطوة", "wrench.and.screwdriver.fill", "diagnosis", "#0E7490"],
  ["أكواد الأعطال", "بحث سريع", "warning", "error-codes", "#F97316"],
  ["الماركات والموديلات", "كتالوج الأجهزة", "fan.fill", "brands", "#2563EB"],
  ["موديلات الكباسات", "بيانات وقدرات الموديلات", "fan.fill", "compressor-models", "#0F766E"],
  ["حاسبات HVAC", "نتيجة دقيقة", "calculator", "calculators", "#7C3AED"],
  ["الفريونات والزيوت", "مرجع التشغيل", "snowflake", "refrigerants", "#0891B2"],
  ["الخامات", "إدارة المواد", "settings", "materials", "#16A34A"],
  ["أقطار المواسير", "بوصة وملليمتر", "settings", "pipe-diameters", "#0F766E"],
  ["دليل الضغوط والأمبير", "قراءات التشغيل", "bolt.fill", "pressure-amp-guide", "#D97706"],
  ["مرجع الدوائر", "تبريد وكهرباء وكنترول", "book.fill", "circuit-reference", "#7C3AED"],
  ["حاسبة PT", "سوبرهيت وتبريد دوني", "calculator", "pressure-amp-guide", "#0E7490"],
  ["محاكي الدوائر", "كوّن دائرتك واكتشف الأخطاء", "bolt.fill", "circuit-simulator", "#DC2626"],
] as const;

export default function ReferencesScreen() {
  const colors = useColors();
  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <FlatList
        data={references}
        numColumns={2}
        keyExtractor={(item) => item[0]}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.title, { color: colors.foreground }]}>المراجع الفنية</Text><Text style={[styles.subtitle, { color: colors.muted }]}>كل الأدوات والبيانات في مكان واحد</Text></View>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: "/[section]", params: { section: item[3] } } as any)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.75 }]}>
            <View style={[styles.icon, { backgroundColor: item[4] }]}><IconSymbol name={item[2]} size={22} color="#FFFFFF" /></View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item[0]}</Text>
            <Text style={[styles.cardSub, { color: colors.muted }]}>{item[1]}</Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28 },
  header: { paddingVertical: 8, marginBottom: 14 },
  title: { fontSize: 27, fontWeight: "900", textAlign: "right" },
  subtitle: { fontSize: 14, textAlign: "right", marginTop: 5 },
  row: { gap: 10, marginBottom: 10 },
  card: { flex: 1, minHeight: 140, borderRadius: 18, borderWidth: 1, padding: 12, alignItems: "flex-end" },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "900", textAlign: "right" },
  cardSub: { fontSize: 11, textAlign: "right", marginTop: 5 },
});
