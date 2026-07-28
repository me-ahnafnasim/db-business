import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProductImage({
  uri,
  accessibilityLabel,
  style,
  borderRadius = 16,
  aspectRatio = 1,
}) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(!uri);

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(!uri);
  }, [uri]);

  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceSoft, borderRadius, aspectRatio }, style]}>
      {!failed ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          accessible
          accessibilityLabel={accessibilityLabel}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      ) : (
        <MaterialCommunityIcons name="shoe-sneaker" size={48} color={colors.muted} />
      )}
      {loading ? <ActivityIndicator style={styles.loader} color={colors.brand} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
  },
});
