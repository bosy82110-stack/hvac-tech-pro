import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

export function ScreenContainer({
  children,
  style,
  edges = ["top", "left", "right"],
  ...props
}: ViewProps & { edges?: Edge[] }) {
  const colors = useColors();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...props}>
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}
