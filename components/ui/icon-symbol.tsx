import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"] | string;

const aliases: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  warning: "warning-outline",
  "fan.fill": "sync-outline",
  snowflake: "snow-outline",
  settings: "settings-outline",
  "bolt.fill": "flash-outline",
  "book.fill": "book-outline",
  calculator: "calculator-outline",
  "wrench.and.screwdriver.fill": "construct-outline",
  sparkles: "sparkles-outline",
  magnifyingglass: "search-outline",
  build: "build-outline",
  "chevron.right": "chevron-forward-outline",
  "chevron.down": "chevron-down-outline",
  plus: "add-outline",
  "arrow.left": "arrow-back-outline",
  "arrow.right": "arrow-forward-outline",
  checkmark: "checkmark-outline",
  close: "close-outline",
};

export function IconSymbol({
  name,
  size = 24,
  color = "#0F172A",
  ...props
}: { name: IconName; size?: number; color?: string } & Omit<ComponentProps<typeof Ionicons>, "name" | "size" | "color">) {
  const iconName = aliases[String(name)] ?? (name as ComponentProps<typeof Ionicons>["name"]);
  return <Ionicons name={iconName} size={size} color={color} {...props} />;
}
