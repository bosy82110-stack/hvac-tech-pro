import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, height: 68, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: ({ color, size }) => <IconSymbol name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="references" options={{ title: "المراجع", tabBarIcon: ({ color, size }) => <IconSymbol name="book.fill" size={size} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: "المهام", tabBarIcon: ({ color, size }) => <IconSymbol name="wrench.and.screwdriver.fill" size={size} color={color} /> }} />
      <Tabs.Screen name="favorites" options={{ title: "المفضلة", tabBarIcon: ({ color, size }) => <IconSymbol name="star.fill" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "الإعدادات", tabBarIcon: ({ color, size }) => <IconSymbol name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}
