import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type MaintenanceTask = {
  id: string;
  device: string;
  brandModel: string;
  serviceDate: string;
  nextServiceDate: string;
  workDone: string;
  suctionPressure: string;
  dischargePressure: string;
  suctionTemperature: string;
  dischargeTemperature: string;
  notes: string;
};

const STORAGE_KEY = "hvac_maintenance_tasks";
const emptyForm: Omit<MaintenanceTask, "id"> = {
  device: "",
  brandModel: "",
  serviceDate: "",
  nextServiceDate: "",
  workDone: "",
  suctionPressure: "",
  dischargePressure: "",
  suctionTemperature: "",
  dischargeTemperature: "",
  notes: "",
};

export default function TasksScreen() {
  const colors = useColors();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setTasks(JSON.parse(value));
    });
  }, []);

  const update = (key: keyof typeof emptyForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const saveTask = async () => {
    if (!form.device.trim()) {
      Alert.alert("بيانات ناقصة", "اكتب اسم أو رقم الجهاز أولًا.");
      return;
    }
    const next = [{ id: Date.now().toString(), ...form }, ...tasks];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setTasks(next);
    setForm(emptyForm);
    Alert.alert("تم الحفظ", "تم حفظ سجل الصيانة داخل المهام.");
  };

  const deleteTask = (id: string) =>
    Alert.alert("حذف سجل الصيانة", "هل تريد حذف هذا السجل؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          const next = tasks.filter((item) => item.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setTasks(next);
        },
      },
    ]);

  const field = (label: string, key: keyof typeof emptyForm, placeholder: string, multiline = false) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(value) => update(key, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>العودة</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>المهام وسجل الصيانة</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>بيانات الجهاز، ما تم تنفيذه، وموعد الزيارة القادمة</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {field("اسم أو رقم الجهاز", "device", "مثال: تكييف مكتب 1")}
          {field("الماركة والموديل", "brandModel", "مثال: Carrier 2P14S225CZ")}
          <View style={styles.twoColumns}>
            <View style={styles.column}>{field("تاريخ الصيانة", "serviceDate", "يوم/شهر/سنة")}</View>
            <View style={styles.column}>{field("الصيانة القادمة", "nextServiceDate", "يوم/شهر/سنة")}</View>
          </View>
          {field("ما تم في الزيارة", "workDone", "تنظيف، شحن، تغيير قطعة...", true)}
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>قراءات التشغيل</Text>
          <View style={styles.twoColumns}>
            <View style={styles.column}>{field("ضغط السحب PSI", "suctionPressure", "مثال: 68")}</View>
            <View style={styles.column}>{field("ضغط الطرد PSI", "dischargePressure", "مثال: 240")}</View>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.column}>{field("حرارة خط السحب °C", "suctionTemperature", "مثال: 9")}</View>
            <View style={styles.column}>{field("حرارة خط الطرد °C", "dischargeTemperature", "مثال: 72")}</View>
          </View>
          {field("ملاحظات", "notes", "أي ملاحظة تريد الرجوع إليها", true)}
          <Pressable onPress={saveTask} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.75 }]}>
            <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.saveText}>حفظ سجل الصيانة</Text>
          </Pressable>
        </View>

        <Text style={[styles.listTitle, { color: colors.foreground }]}>السجلات المحفوظة ({tasks.length})</Text>
        {tasks.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد سجلات بعد. أضف أول زيارة صيانة من النموذج.</Text>
          </View>
        ) : tasks.map((task) => (
          <View key={task.id} style={[styles.record, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.recordHeader}>
              <View style={styles.recordIcon}><IconSymbol name="wrench.and.screwdriver.fill" size={20} color="#FFFFFF" /></View>
              <View style={styles.recordCopy}>
                <Text style={[styles.recordTitle, { color: colors.foreground }]}>{task.device}</Text>
                <Text style={[styles.recordSub, { color: colors.muted }]}>{task.brandModel || "بدون موديل"}</Text>
              </View>
              <Pressable onPress={() => deleteTask(task.id)}><IconSymbol name="trash" size={20} color="#DC2626" /></Pressable>
            </View>
            <Text style={[styles.recordLine, { color: colors.foreground }]}>الصيانة: {task.serviceDate || "غير محدد"}  |  القادمة: {task.nextServiceDate || "غير محدد"}</Text>
            {!!task.workDone && <Text style={[styles.recordLine, { color: colors.muted }]}>تم التنفيذ: {task.workDone}</Text>}
            <Text style={[styles.recordLine, { color: colors.muted }]}>السحب {task.suctionPressure || "-"} PSI  •  الطرد {task.dischargePressure || "-"} PSI  •  السحب الحراري {task.suctionTemperature || "-"}°C  •  الطرد الحراري {task.dischargeTemperature || "-"}°C</Text>
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
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "800", textAlign: "right", marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, textAlign: "right", fontSize: 14 },
  multiline: { minHeight: 78, paddingTop: 12, textAlignVertical: "top" },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  sectionLabel: { fontSize: 15, fontWeight: "900", textAlign: "right", marginTop: 4, marginBottom: 10 },
  saveButton: { minHeight: 50, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  listTitle: { fontSize: 19, fontWeight: "900", textAlign: "right", marginTop: 22, marginBottom: 10 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 18 },
  emptyText: { textAlign: "right", fontSize: 14, lineHeight: 22 },
  record: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  recordHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  recordIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#0E7490", alignItems: "center", justifyContent: "center" },
  recordCopy: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: "900", textAlign: "right" },
  recordSub: { fontSize: 12, textAlign: "right", marginTop: 3 },
  recordLine: { fontSize: 12, textAlign: "right", lineHeight: 20, marginTop: 8 },
});
