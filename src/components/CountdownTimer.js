import { StyleSheet, Text, View } from "react-native";

import { darkColors as colors } from "../theme/colors";

export default function CountdownTimer({ values }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ends in:</Text>
      <View style={styles.timeRow}>
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={styles.timeGroup}>
            <View style={styles.box}>
              <Text style={styles.value}>{value}</Text>
            </View>
            {index < values.length - 1 ? <Text style={styles.separator}>:</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 26,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: "#171717",
    fontSize: 22,
    fontWeight: "800",
  },
  separator: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
    marginHorizontal: 8,
  },
});
