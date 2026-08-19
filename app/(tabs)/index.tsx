import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { referenceItems } from "@/shared/hvac-data";

const quickActions = [
  {
    title: "تشخيص عطل",
    subtitle: "خطوة بخطوة",
    icon: "wrench.and.screwdriver.fill" as const,
    tone: "#0E7490",
    route: "/diagnosis",
  },
  {
    title: "أكواد الأعطال",
    subtitle: "ابحث بسرعة",
    icon: "warning" as const,
    tone: "#F97316",
    route: "/error-codes",
  },
  {
    title: "الماركات والموديلات",
    subtitle: "كتالوج الأجهزة",
    icon: "fan.fill" as const,
    tone: "#2563EB",
    route: "/brands",
  },
  {
    title: "موديلات الكباسات",
    subtitle: "بيانات وقدرات الموديلات",
    icon: "fan.fill" as const,
    tone: "#0F766E",
    route: "/compressor-models",
  },
  {
    title: "حاسبات HVAC",
    subtitle: "نتيجة دقيقة",
    icon: "calculator" as const,
    tone: "#7C3AED",
    route: "/calculators",
  },
  {
    title: "حاسبة الفريون",
    subtitle: "الشحنة حسب BTU وطول المواسير",
    icon: "snowflake" as const,
    tone: "#06B6D4",
    route: "/refrigerant-calculator",
  },
  {
    title: "الفريونات والزيوت",
    subtitle: "مرجع التشغيل",
    icon: "snowflake" as const,
    tone: "#0891B2",
    route: "/refrigerants",
  },
  {
    title: "الخامات",
    subtitle: "إدارة واختيار المواد",
    icon: "settings" as const,
    tone: "#16A34A",
    route: "/materials",
  },
  {
    title: "قطع الغيار",
    subtitle: "المطابقة والبدائل",
    icon: "settings" as const,
    tone: "#475569",
    route: "/parts",
  },
  {
    title: "أقطار المواسير",
    subtitle: "بوصة وملليمتر",
    icon: "settings" as const,
    tone: "#0F766E",
    route: "/pipe-diameters",
  },
  {
    title: "قياس قطر الماسورة بالكاميرا",
    subtitle: "مرجع معروف ومؤشرات يدوية",
    icon: "settings" as const,
    tone: "#0891B2",
    route: "/pipe-measure",
  },
  {
    title: "قارئ لوحة البيانات",
    subtitle: "تصوير ومراجعة بيانات الجهاز",
    icon: "camera.fill" as const,
    tone: "#0284C7",
    route: "/label-reader",
  },
  {
    title: "دليل الضغوط والأمبير",
    subtitle: "R22 وR410A",
    icon: "bolt.fill" as const,
    tone: "#D97706",
    route: "/pressure-amp-guide",
  },
  {
    title: "مرجع الدوائر",
    subtitle: "تبريد وميكانيكا وكهرباء",
    icon: "book.fill" as const,
    tone: "#7C3AED",
    route: "/circuit-reference",
  },
  {
    title: "حاسبة PT",
    subtitle: "حساب السوبرهيت والتبريد دونيًا",
    icon: "calculator" as const,
    tone: "#0E7490",
    route: "/pt-calculator",
  },
  {
    title: "محاكي الدوائر",
    subtitle: "كوّن دائرتك واكتشف الأخطاء",
    icon: "bolt.fill" as const,
    tone: "#DC2626",
    route: "/circuit-simulator",
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      query.trim()
        ? referenceItems.filter((item) =>
            `${item.title} ${item.subtitle} ${item.category}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          )
        : [],
    [query],
  );

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.title}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>
                  HVAC TECH PRO
                </Text>
                <Text style={[styles.heading, { color: colors.foreground }]}>
                  أهلًا يا فني
                </Text>
                <Text style={[styles.subheading, { color: colors.muted }]}>
                  مساعدك الفني في كل مهمة
                </Text>
              </View>
              <View
                style={[
                  styles.status,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.onlineDot} />
                <Text style={[styles.statusText, { color: colors.foreground }]}>
                  Offline جاهز
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <IconSymbol
                name="magnifyingglass"
                size={22}
                color={colors.muted}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="ابحث عن كود، موديل، قطعة، فريون..."
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.foreground }]}
                returnKeyType="search"
              />
              <Pressable
                onPress={() => router.push("/search")}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol name="arrow.left" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {query.length > 0 && (
              <View
                style={[
                  styles.searchResults,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {results.slice(0, 4).map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push("/search")}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && { opacity: 0.65 },
                    ]}
                  >
                    <View
                      style={[
                        styles.resultIcon,
                        { backgroundColor: `${item.accent}18` },
                      ]}
                    >
                      <IconSymbol
                        name={item.icon as any}
                        size={18}
                        color={item.accent}
                      />
                    </View>
                    <View style={styles.resultCopy}>
                      <Text
                        style={[
                          styles.resultTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.resultSub, { color: colors.muted }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}
                {results.length === 0 && (
                  <Text style={[styles.noResult, { color: colors.muted }]}>
                    لا توجد نتائج محلية. جرّب كلمة أخرى.
                  </Text>
                )}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                الوصول السريع
              </Text>
              <Text style={[styles.sectionHint, { color: colors.muted }]}>
                كل ما تحتاجه في الموقع
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.route === "/pipe-measure" || item.route === "/refrigerant-calculator" || item.route === "/label-reader") {
                router.push(item.route as any);
              } else {
                router.push({
                  pathname: "/[section]",
                  params: { section: item.route.replace("/", "") },
                } as any);
              }
            }}
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: item.tone }]}>
              <IconSymbol name={item.icon} size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.actionSub, { color: colors.muted }]}>
              {item.subtitle}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.aiIcon}>
                <IconSymbol name="sparkles" size={22} color="#22D3EE" />
              </View>
              <View style={styles.aiCopy}>
                <Text style={[styles.aiTitle, { color: colors.foreground }]}>مساعد الفني</Text>
                <Text style={[styles.aiText, { color: colors.muted }]}>
                  صف المشكلة، وسنقودك للفحص الصحيح.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/assistant")}
                style={styles.aiButton}
              >
                <Text style={styles.aiButtonText}>ابدأ</Text>
              </Pressable>
            </View>
            
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
    textAlign: "right",
  },
  heading: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 3,
  },
  subheading: { fontSize: 14, textAlign: "right", marginTop: 1 },
  status: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  searchBox: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 10,
  },
  input: { flex: 1, textAlign: "right", fontSize: 13, paddingVertical: 0 },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#0E7490",
    justifyContent: "center",
    alignItems: "center",
  },
  searchResults: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  resultRow: {
    minHeight: 54,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D9E5EC",
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCopy: { flex: 1, alignItems: "flex-end" },
  resultTitle: { fontSize: 13, fontWeight: "800" },
  resultSub: { fontSize: 11, marginTop: 2, textAlign: "right" },
  noResult: { textAlign: "right", paddingVertical: 16, fontSize: 12 },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 19, fontWeight: "800" },
  sectionHint: { fontSize: 12 },
  gridRow: { gap: 12, marginBottom: 12 },
  actionCard: {
    flex: 1,
    minHeight: 134,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  actionIcon: {
    alignSelf: "flex-end",
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
    width: "100%",
    marginTop: 10,
  },
  actionSub: { fontSize: 11, textAlign: "right", width: "100%", marginTop: 2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  footer: { paddingTop: 8, paddingBottom: 22 },
  aiCard: {
    minHeight: 86,
    borderRadius: 22,
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#12304A",
    justifyContent: "center",
    alignItems: "center",
  },
  aiCopy: { flex: 1, alignItems: "flex-end" },
  aiTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  aiText: { color: "#A7C7D6", fontSize: 11, marginTop: 4, textAlign: "right" },
  aiButton: {
    backgroundColor: "#22D3EE",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  aiButtonText: { color: "#0B1F33", fontSize: 12, fontWeight: "800" },
});
