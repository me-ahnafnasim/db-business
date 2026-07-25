import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";

import {
  createProfile,
  getDivisions,
} from "../services/api";

export default function ProfileCompletionScreen({ auth, onComplete }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [error, setError] = useState(null);

  // Geographic data
  const [divisions, setDivisions] = useState([]);

  // Form state
  const [form, setForm] = useState({
    name: auth?.displayName || "",
    phone: "",
    companyName: "",
    companyNameBn: "",
    tradeLicenseNumber: "",
    divisionId: null,
    districtName: "",
    thanaName: "",
    bazarName: "",
    shopName: "",
  });

  // Load divisions on mount
  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      setGeoLoading(true);
      setGeoError(null);
      const res = await getDivisions();
      setDivisions(res.data || []);
    } catch (e) {
      setGeoError(getLocalizedError(e, t, "profileCompletion.locationError"));
    } finally {
      setGeoLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError(t("profileCompletion.nameRequired"));
      return false;
    }
    if (!form.phone.match(/^01[3-9]\d{8}$/)) {
      setError(t("profileCompletion.phoneInvalid"));
      return false;
    }
    if (!form.divisionId) {
      setError(t("profileCompletion.divisionRequired"));
      return false;
    }
    if (!form.districtName.trim()) {
      setError(t("profileCompletion.districtRequired"));
      return false;
    }
    if (!form.thanaName.trim()) {
      setError(t("profileCompletion.thanaRequired"));
      return false;
    }
    if (!form.shopName.trim()) {
      setError(t("profileCompletion.shopRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateForm()) return;

    try {
      setLoading(true);
      await createProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim() || undefined,
        companyNameBn: form.companyNameBn.trim() || undefined,
        tradeLicenseNumber: form.tradeLicenseNumber.trim() || undefined,
        divisionId: form.divisionId,
        districtName: form.districtName.trim(),
        thanaName: form.thanaName.trim(),
        bazarName: form.bazarName.trim() || undefined,
        shopName: form.shopName.trim(),
      });
      await onComplete?.(form);
    } catch (e) {
      console.error("Profile creation failed:", e);
      setError(getLocalizedError(e, t, "profileCompletion.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (label, value, options, onSelect, placeholder) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {!geoLoading && !options.length ? <Text style={styles.emptyOption}>{placeholder}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {options.map((opt) => (
          <Pressable
            key={opt.id}
            style={[
              styles.chip,
              value === opt.id && styles.chipSelected,
            ]}
            onPress={() => onSelect(opt.id)}
          >
            <Text
              style={[
                styles.chipText,
                value === opt.id && styles.chipTextSelected,
              ]}
            >
              {language === "bn" ? opt.nameBn || opt.name : opt.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <LinearGradient
      colors={["#0a0e27", "#1a1f3a", "#0f1729"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.header}>
          <AntDesign name="user" size={32} color="#ffd700" />
          <Text style={styles.headerTitle}>{t("profileCompletion.title")}</Text>
          <Text style={styles.headerSubtitle}>{t("profileCompletion.subtitle")}</Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {geoError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{geoError}</Text>
              <Pressable style={styles.retryGeoButton} onPress={loadDivisions}>
                <Text style={styles.retryGeoText}>{t("profileCompletion.reloadLocations")}</Text>
              </Pressable>
            </View>
          ) : null}
          {/* Personal Info */}
          <Text style={styles.sectionTitle}>{t("profileCompletion.personal")}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.fullName")}</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => updateForm("name", v)}
              placeholder={t("profileCompletion.fullNamePlaceholder")}
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.phone")}</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => updateForm("phone", v)}
              placeholder="01XXXXXXXXX"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>

          {/* Business Info */}
          <Text style={styles.sectionTitle}>{t("profileCompletion.business")}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.shopName")}</Text>
            <TextInput
              style={styles.input}
              value={form.shopName}
              onChangeText={(v) => updateForm("shopName", v)}
              placeholder={t("profileCompletion.shopNamePlaceholder")}
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.companyName")}</Text>
            <TextInput
              style={styles.input}
              value={form.companyName}
              onChangeText={(v) => updateForm("companyName", v)}
              placeholder={t("profileCompletion.companyPlaceholder")}
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.companyNameBn")}</Text>
            <TextInput
              style={styles.input}
              value={form.companyNameBn}
              onChangeText={(v) => updateForm("companyNameBn", v)}
              placeholder="কোম্পানির নাম (ঐচ্ছিক)"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.tradeLicense")}</Text>
            <TextInput
              style={styles.input}
              value={form.tradeLicenseNumber}
              onChangeText={(v) => updateForm("tradeLicenseNumber", v)}
              placeholder={t("profileCompletion.tradeLicensePlaceholder")}
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>{t("profileCompletion.location")}</Text>

          {geoLoading && (
            <ActivityIndicator size="small" color="#ffd700" style={{ marginVertical: 10 }} />
          )}

          {renderPicker(
            t("profileCompletion.division"),
            form.divisionId,
            divisions,
            (id) => updateForm("divisionId", id),
            t("profileCompletion.selectDivision")
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.district")}</Text>
            <TextInput
              style={styles.input}
              value={form.districtName}
              onChangeText={(value) => updateForm("districtName", value)}
              placeholder={t("profileCompletion.districtPlaceholder")}
              placeholderTextColor="#64748b"
              maxLength={100}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.thana")}</Text>
            <TextInput
              style={styles.input}
              value={form.thanaName}
              onChangeText={(value) => updateForm("thanaName", value)}
              placeholder={t("profileCompletion.thanaPlaceholder")}
              placeholderTextColor="#64748b"
              maxLength={100}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("profileCompletion.bazar")}</Text>
            <TextInput
              style={styles.input}
              value={form.bazarName}
              onChangeText={(v) => updateForm("bazarName", v)}
              placeholder={t("profileCompletion.bazarPlaceholder")}
              placeholderTextColor="#64748b"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              loading && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0a0e27" />
            ) : (
              <Text style={styles.submitBtnText}>{t("profileCompletion.save")}</Text>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e8e8e8",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#b0bac9",
    marginTop: 4,
    textAlign: "center",
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffd700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 12,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#b0bac9",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#e8e8e8",
  },
  chipScroll: { flexDirection: "row" },
  chip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: "#ffd700",
  },
  chipText: {
    fontSize: 13,
    color: "#b0bac9",
    fontWeight: "500",
  },
  chipTextSelected: { color: "#ffd700" },
  emptyOption: { color: "#94a3b8", fontSize: 13, marginBottom: 8 },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#ef4444", fontSize: 13, fontWeight: "500" },
  retryGeoButton: { alignSelf: "flex-start", marginTop: 10, borderColor: "#ffd700", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  retryGeoText: { color: "#ffd700", fontSize: 13, fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#ffd700",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnPressed: {
    backgroundColor: "#d4af37",
    transform: [{ scale: 0.97 }],
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0e27",
    letterSpacing: 0.5,
  },
});
