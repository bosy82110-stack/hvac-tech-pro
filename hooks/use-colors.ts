import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "hvac_theme_mode";
const listeners = new Set<(mode: ThemeMode) => void>();
let currentMode: ThemeMode = "system";
let hydrated = false;

const lightColors = {
  background: "#F4F7FA",
  foreground: "#102A43",
  muted: "#52606D",
  primary: "#087F8C",
  surface: "#FFFFFF",
  border: "#BCCCDC",
  success: "#147D64",
  warning: "#B44D12",
  error: "#BA2525",
};

const darkColors = {
  background: "#0B1724",
  foreground: "#F3F7FA",
  muted: "#B8C7D6",
  primary: "#53C5CF",
  surface: "#152638",
  border: "#385168",
  success: "#5BD6A4",
  warning: "#F6B26B",
  error: "#FF8A8A",
};

function notify(mode: ThemeMode) {
  listeners.forEach((listener) => listener(mode));
}

export function setAppThemeMode(mode: ThemeMode) {
  currentMode = mode;
  hydrated = true;
  AsyncStorage.setItem(THEME_KEY, mode).catch(() => undefined);
  notify(mode);
}

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(currentMode);
  useEffect(() => {
    const listener = (nextMode: ThemeMode) => setMode(nextMode);
    listeners.add(listener);
    if (!hydrated) {
      AsyncStorage.getItem(THEME_KEY)
        .then((saved) => {
          const nextMode: ThemeMode = saved === "light" || saved === "dark" ? saved : "system";
          currentMode = nextMode;
          hydrated = true;
          setMode(nextMode);
          notify(nextMode);
        })
        .catch(() => {
          hydrated = true;
        });
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return mode;
}

export function useColors() {
  const scheme = useColorScheme();
  const mode = useThemeMode();
  const isDark = mode === "dark" || (mode === "system" && scheme === "dark");
  return isDark ? darkColors : lightColors;
}
