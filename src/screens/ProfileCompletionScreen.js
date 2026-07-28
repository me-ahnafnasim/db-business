import { useRef, useState, useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
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

import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, Button, Chip, FormField, Input, KeyboardAwareScreen } from "../ui";

export default function ProfileCompletionScreen({ auth, onComplete }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = useStyles(getStyles);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [error, setError] = useState(null);

  // Geographic data
  const [divisions, setDivisions] = useState([]);

  // Focus chain across the form's nine fields.
  const phoneRef = useRef(null);
  const shopRef = useRef(null);
  const companyRef = useRef(null);
  const companyBnRef = useRef(null);
  const tradeLicenseRef = useRef(null);
  const districtRef = useRef(null);
  const thanaRef = useRef(null);
  const bazarRef = useRef(null);

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
    <FormField label={label}>
      {!geoLoading && !options.length ? (
        <AppText variant="label" tone="secondary" style={styles.emptyOption}>
          {placeholder}
        </AppText>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={language === "bn" ? opt.nameBn || opt.name : opt.name}
            selected={value === opt.id}
            onPress={() => onSelect(opt.id)}
            size="sm"
          />
        ))}
      </ScrollView>
    </FormField>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.surfaceSoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.header}>
          <AntDesign name="user" size={32} color={colors.brand} />
          <AppText variant="h2" style={styles.headerTitle}>
            {t("profileCompletion.title")}
          </AppText>
          <AppText variant="label" tone="secondary" style={styles.headerSubtitle}>
            {t("profileCompletion.subtitle")}
          </AppText>
        </View>

        <KeyboardAwareScreen contentContainerStyle={styles.scrollContent}>
          {geoError ? (
            <View style={styles.errorBox}>
              <AppText variant="label" tone="error">
                {geoError}
              </AppText>
              <Button
                title={t("profileCompletion.reloadLocations")}
                onPress={loadDivisions}
                variant="ghost"
                size="sm"
                fullWidth={false}
                style={styles.retryGeoButton}
              />
            </View>
          ) : null}
          {/* Personal Info */}
          <AppText variant="label" tone="brand" style={styles.sectionTitle}>
            {t("profileCompletion.personal")}
          </AppText>

          <FormField label={t("profileCompletion.fullName")} required>
            <Input
              value={form.name}
              onChangeText={(v) => updateForm("name", v)}
              placeholder={t("profileCompletion.fullNamePlaceholder")}
              autoComplete="name"
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </FormField>

          <FormField label={t("profileCompletion.phone")} required>
            <Input
              ref={phoneRef}
              value={form.phone}
              onChangeText={(v) => updateForm("phone", v)}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={11}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => shopRef.current?.focus()}
            />
          </FormField>

          {/* Business Info */}
          <AppText variant="label" tone="brand" style={styles.sectionTitle}>
            {t("profileCompletion.business")}
          </AppText>

          <FormField label={t("profileCompletion.shopName")} required>
            <Input
              ref={shopRef}
              value={form.shopName}
              onChangeText={(v) => updateForm("shopName", v)}
              placeholder={t("profileCompletion.shopNamePlaceholder")}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => companyRef.current?.focus()}
            />
          </FormField>

          <FormField label={t("profileCompletion.companyName")}>
            <Input
              ref={companyRef}
              value={form.companyName}
              onChangeText={(v) => updateForm("companyName", v)}
              placeholder={t("profileCompletion.companyPlaceholder")}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => companyBnRef.current?.focus()}
            />
          </FormField>

          <FormField label={t("profileCompletion.companyNameBn")}>
            <Input
              ref={companyBnRef}
              value={form.companyNameBn}
              onChangeText={(v) => updateForm("companyNameBn", v)}
              placeholder={t("profileCompletion.companyPlaceholder")}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => tradeLicenseRef.current?.focus()}
            />
          </FormField>

          <FormField label={t("profileCompletion.tradeLicense")}>
            <Input
              ref={tradeLicenseRef}
              value={form.tradeLicenseNumber}
              onChangeText={(v) => updateForm("tradeLicenseNumber", v)}
              placeholder={t("profileCompletion.tradeLicensePlaceholder")}
              autoCapitalize="characters"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => districtRef.current?.focus()}
            />
          </FormField>

          {/* Location */}
          <AppText variant="label" tone="brand" style={styles.sectionTitle}>
            {t("profileCompletion.location")}
          </AppText>

          {geoLoading && (
            <ActivityIndicator size="small" color={colors.brand} style={styles.geoLoader} />
          )}

          {renderPicker(
            t("profileCompletion.division"),
            form.divisionId,
            divisions,
            (id) => updateForm("divisionId", id),
            t("profileCompletion.selectDivision")
          )}

          <FormField label={t("profileCompletion.district")} required>
            <Input
              ref={districtRef}
              value={form.districtName}
              onChangeText={(value) => updateForm("districtName", value)}
              placeholder={t("profileCompletion.districtPlaceholder")}
              autoCapitalize="words"
              maxLength={100}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => thanaRef.current?.focus()}
            />
          </FormField>

          <FormField label={t("profileCompletion.thana")} required>
            <Input
              ref={thanaRef}
              value={form.thanaName}
              onChangeText={(value) => updateForm("thanaName", value)}
              placeholder={t("profileCompletion.thanaPlaceholder")}
              autoCapitalize="words"
              maxLength={100}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => bazarRef.current?.focus()}
            />
          </FormField>

          <FormField label={t("profileCompletion.bazar")}>
            <Input
              ref={bazarRef}
              value={form.bazarName}
              onChangeText={(v) => updateForm("bazarName", v)}
              placeholder={t("profileCompletion.bazarPlaceholder")}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </FormField>

          {error ? (
            <View style={styles.errorBox} accessibilityLiveRegion="assertive">
              <AppText variant="label" tone="error">
                {error}
              </AppText>
            </View>
          ) : null}

          <Button
            title={t("profileCompletion.save")}
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </KeyboardAwareScreen>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
      alignItems: "center",
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xxl,
    },
    headerTitle: {
      marginTop: spacing.md,
    },
    headerSubtitle: {
      marginTop: spacing.xs,
      textAlign: "center",
      fontWeight: "400",
    },
    // Bottom padding replaces the manual spacer view that used to sit after the button.
    scrollContent: {
      paddingHorizontal: spacing.xxl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.x5,
    },
    sectionTitle: {
      letterSpacing: 1,
      textTransform: "uppercase",
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    chipScroll: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    emptyOption: {
      marginBottom: spacing.sm,
      fontWeight: "400",
    },
    geoLoader: {
      marginVertical: spacing.sm + 2,
    },
    errorBox: {
      backgroundColor: colors.errorSoft,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: radius.xs,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    retryGeoButton: {
      alignSelf: "flex-start",
      marginTop: spacing.sm + 2,
      paddingHorizontal: 0,
    },
    submitBtn: {
      marginTop: spacing.sm,
    },
  });
