import { Stack, router, useRootNavigationState, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";

export const unstable_settings = {
  initialRouteName: "start",
};

export default function RootLayout() {
  const navigationState = useRootNavigationState();
  const pathname = usePathname();
  const forcedStartRef = useRef(false);

  useEffect(() => {
    if (!navigationState?.key || forcedStartRef.current) return;
    forcedStartRef.current = true;

    // Always begin a fresh app process on the branded start screen.
    if (pathname !== "/start") {
      router.replace("/start");
    }
  }, [navigationState?.key, pathname]);

  return (
    <>
      <StatusBar hidden />
      <Stack initialRouteName="start" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="start" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="[section]" />
        <Stack.Screen name="assistant" />
      </Stack>
    </>
  );
}
