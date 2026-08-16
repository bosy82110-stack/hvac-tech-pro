import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export function ScreenContainer({
  children,
  style,
  edges = ["top", "left", "right"],
  ...props
}: ViewProps & { edges?: Edge[] }) {
  return (
    <View style={[{ flex: 1, backgroundColor: "#F8FAFC" }, style]} {...props}>
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}
