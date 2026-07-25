import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import { useTheme } from "../theme/ThemeProvider";

function remainingParts(endsAt) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);
  return {
    remaining,
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export default function FestivalDiscountBanner({ campaign }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [time, setTime] = useState(() => remainingParts(campaign?.endsAt));

  useEffect(() => {
    setTime(remainingParts(campaign?.endsAt));
    const timer = setInterval(() => setTime(remainingParts(campaign?.endsAt)), 1000);
    return () => clearInterval(timer);
  }, [campaign?.endsAt]);

  if (!campaign || !time.remaining) return null;
  const bangla = language === "bn";
  const festivalName = bangla && campaign.festivalNameBn ? campaign.festivalNameBn : campaign.festivalName;
  const headline = bangla && campaign.headlineBn ? campaign.headlineBn : campaign.headline;
  const units = [
    [time.days, bangla ? "দিন" : "Days"],
    [time.hours, bangla ? "ঘণ্টা" : "Hours"],
    [time.minutes, bangla ? "মিনিট" : "Min"],
    [time.seconds, bangla ? "সেকেন্ড" : "Sec"],
  ];

  return <View style={styles.card}>
    <View style={styles.headingRow}><MaterialCommunityIcons name="party-popper" size={24} color="#0a0e27"/><View style={styles.headingText}><Text style={styles.festival}>{festivalName}</Text><Text style={styles.headline}>{headline}</Text></View><View style={styles.discount}><Text style={styles.discountValue}>{campaign.discountPercent}%</Text><Text style={styles.discountLabel}>{bangla ? "ছাড়" : "OFF"}</Text></View></View>
    <View style={styles.timer}>{units.map(([value,label])=><View style={styles.timeBox} key={label}><Text style={styles.timeValue}>{String(value).padStart(2,"0")}</Text><Text style={styles.timeLabel}>{label}</Text></View>)}</View>
  </View>;
}

const getStyles = (colors) => StyleSheet.create({
  card: { marginHorizontal:20, marginTop:18, padding:16, borderRadius:22, backgroundColor:"#f4ca55", borderWidth:1, borderColor:"#d5a923" },
  headingRow: { flexDirection:"row", alignItems:"center", gap:10 },
  headingText: { flex:1 },
  festival: { color:"#0a0e27", fontSize:13, fontWeight:"800", textTransform:"uppercase" },
  headline: { color:"#352704", fontSize:15, fontWeight:"700", marginTop:2 },
  discount: { alignItems:"center", paddingHorizontal:10, paddingVertical:6, borderRadius:14, backgroundColor:"#0a0e27" },
  discountValue: { color:"#fff", fontSize:18, fontWeight:"900" },
  discountLabel: { color:"#f4ca55", fontSize:9, fontWeight:"900" },
  timer: { flexDirection:"row", gap:7, marginTop:13 },
  timeBox: { flex:1, alignItems:"center", paddingVertical:8, borderRadius:12, backgroundColor:"rgba(255,255,255,0.55)" },
  timeValue: { color:"#0a0e27", fontSize:17, fontWeight:"900" },
  timeLabel: { color:"#5b450b", fontSize:9, fontWeight:"700", marginTop:2 },
});
