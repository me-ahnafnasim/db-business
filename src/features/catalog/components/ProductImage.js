import Feather from "@expo/vector-icons/Feather";
import { memo, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

// `resizeMode` was hardcoded to "contain", which letterboxed every product photo.
//
// Uploads keep whatever aspect the merchant supplied — Cloudinary's `crop: 'limit'` only
// downscales to fit 1200x1200 — and the fallback placeholder is 600x420. So a landscape shoe
// photo in this square frame showed `surfaceSoft` bars above and below: a grey band inside a
// white card, on an almost-white page.
//
// The default is now "cover". The rule is: CROP where the image identifies the product (grid
// cards, cart rows, thumbnails), FIT where the image informs (the product-details frame and
// the fullscreen viewer, which exist so the buyer can inspect the whole shoe). Those two
// callers pass "contain" explicitly — note the fullscreen viewer renders through this same
// component, so without the override it would silently crop.
function ProductImage({
  uri,
  accessibilityLabel,
  style,
  borderRadius = 16,
  aspectRatio = 1,
  resizeMode = "cover",
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
          resizeMode={resizeMode}
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
        <Feather name="image" size={44} color={colors.muted} />
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

export default memo(ProductImage);
