import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StartScreen() {
  const [checking, setChecking] = useState(false);
  const [opening, setOpening] = useState(false);
  const leavingRef = useRef(false);
  const player = useAudioPlayer(
    require("@/assets/audio/start-screen-hvac-jingle.mp3"),
  );

  const stopAudioSafely = () => {
    try {
      player.pause();
    } catch {
      // The native audio object may already be released during navigation.
    }
  };

  const goToHome = () => {
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 80);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        player.volume = 0.72;
        player.play();
      } catch {
        // Audio is optional; the start screen must remain usable if it fails.
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      if (!leavingRef.current) stopAudioSafely();
    };
  }, [player]);

  const openApp = () => {
    if (opening) return;
    setOpening(true);
    leavingRef.current = true;
    stopAudioSafely();

    goToHome();
  };

  if (checking) {
    return (
      <View style={styles.loading}>
        <StatusBar hidden />
        <ActivityIndicator color="#1687FF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.glowTop} />
      <View style={styles.content}>
        <View style={styles.logoMark}>
          <Text style={styles.logoSnow}>❄</Text>
          <Text style={styles.logoBolt}>ϟ</Text>
        </View>
        <Text style={styles.title}>HVAC TECH PRO</Text>
        <Text style={styles.subtitle}>مساعدك الفني في كل مهمة</Text>
        <Text style={styles.description}>
          أدوات وحسابات وتشخيصات متخصصة لفنيي التكييف والتبريد
        </Text>
      </View>
      <View style={styles.bottomArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ابدأ الآن"
          onPress={openApp}
          disabled={opening}
          style={({ pressed }) => [
            styles.startButton,
            { opacity: pressed || opening ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.startButtonText}>{opening ? "جارٍ الفتح..." : "ابدأ الآن"}</Text>
        </Pressable>
        <Text style={styles.credit}>تصميم وتنفيذ أحمد زكريا</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#031A35",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 30,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#031A35",
  },
  glowTop: {
    position: "absolute",
    top: -180,
    alignSelf: "center",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "#0A4D91",
    opacity: 0.24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B5DB3",
    borderWidth: 2,
    borderColor: "#1687FF",
    shadowColor: "#1687FF",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoSnow: {
    color: "#BFE5FF",
    fontSize: 52,
    lineHeight: 56,
  },
  logoBolt: {
    position: "absolute",
    color: "#FFD23F",
    fontSize: 48,
    fontWeight: "900",
    transform: [{ translateY: 3 }],
  },
  title: {
    marginTop: 28,
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  subtitle: {
    marginTop: 14,
    color: "#55B7FF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    maxWidth: 330,
    marginTop: 18,
    color: "#D8E9F8",
    fontSize: 16,
    lineHeight: 27,
    textAlign: "center",
  },
  bottomArea: {
    alignItems: "center",
  },
  startButton: {
    width: "100%",
    minHeight: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1687FF",
    shadowColor: "#1687FF",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },
  credit: {
    marginTop: 18,
    color: "#9FC8E8",
    fontSize: 15,
    textAlign: "center",
  },
});
