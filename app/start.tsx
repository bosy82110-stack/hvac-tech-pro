import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

// Bumped for this onboarding fix so existing installations see the corrected start screen once.
const START_SEEN_KEY = "hvac_start_screen_seen_v3";

export default function StartScreen() {
  const { width, height } = useWindowDimensions();
  const [checking, setChecking] = useState(true);
  const [opening, setOpening] = useState(false);
  const player = useAudioPlayer(
    require("@/assets/audio/start-screen-hvac-jingle.mp3"),
  );

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(START_SEEN_KEY).then((value) => {
      if (!mounted) return;
      setChecking(false);
      if (value === "1") {
        router.replace("/(tabs)");
        return;
      }

      // Start the five-second professional HVAC jingle when this screen is visible.
      player.volume = 0.72;
      player.play();
    });

    return () => {
      mounted = false;
      player.pause();
    };
  }, [player]);

  const openApp = async () => {
    if (opening) return;
    setOpening(true);
    player.pause();
    await AsyncStorage.setItem(START_SEEN_KEY, "1");
    router.replace("/(tabs)");
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
      <Image
        source={require("@/assets/images/launch-screen.png")}
        resizeMode="cover"
        fadeDuration={0}
        style={styles.image}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ابدأ الآن"
        onPress={openApp}
        disabled={opening}
        style={({ pressed }) => [
          styles.startButton,
          {
            left: width * 0.08,
            right: width * 0.08,
            bottom: Math.max(22, height * 0.055),
            opacity: pressed || opening ? 0.02 : 0.01,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#031A35",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#031A35",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  startButton: {
    position: "absolute",
    height: 74,
    borderRadius: 28,
  },
});
