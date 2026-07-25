import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export function getResponsiveGrid({ width, fontScale = 1, horizontalPadding = 40, gap = 12 }) {
  const availableWidth = Math.max(0, width - horizontalPadding);
  let columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  if (width < 340 && fontScale > 1.15) columns = 1;

  return {
    columns,
    gap,
    cardWidth: Math.floor((availableWidth - gap * (columns - 1)) / columns),
  };
}

export function useResponsiveGrid(options = {}) {
  const { width, fontScale } = useWindowDimensions();
  const horizontalPadding = options.horizontalPadding ?? 40;
  const gap = options.gap ?? 12;

  return useMemo(
    () => getResponsiveGrid({ width, fontScale, horizontalPadding, gap }),
    [fontScale, gap, horizontalPadding, width]
  );
}
