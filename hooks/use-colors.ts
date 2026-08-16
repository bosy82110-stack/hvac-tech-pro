import { useColorScheme } from "react-native";

const lightColors = {
  background: "#F8FAFC",
  foreground: "#0F172A",
  muted: "#475569",
  primary: "#0E7490",
  surface: "#FFFFFF",
  border: "#CBD5E1",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
};

export function useColors() {
  const scheme = useColorScheme();
  return scheme === "dark"
    ? {
        ...lightColors,
        background: "#0F172A",
        foreground: "#F8FAFC",
        muted: "#CBD5E1",
        surface: "#1E293B",
        border: "#475569",
      }
    : lightColors;
}
