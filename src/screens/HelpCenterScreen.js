import { useCallback, useState } from "react";

import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import FaqItem from "../features/support/components/FaqItem";
import { helpSections } from "../features/support/data/helpTopics";
import { spacing, useStyles, useTheme } from "../theme";
import { AppText, Button, Card } from "../ui";

// Self-serve answers, so the Support section has two rows that mean different things:
// Help Center is "how does this work", Customer Service is "I need a person".
//
// Deliberately offline: every answer ships in the bundle rather than living on the web
// storefront. The moment someone needs the pack rules explained is the moment they are stuck
// in the configurator, which is not the moment to depend on a signal.

export default function HelpCenterScreen({ onBack, onContactSupport }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  // One open question at a time. A page of simultaneously expanded answers is harder to
  // scan than a list of headings, and it keeps the scroll position predictable.
  const [openKey, setOpenKey] = useState(null);
  const toggle = useCallback(
    (key) => setOpenKey((current) => (current === key ? null : key)),
    []
  );

  return (
    <StackScreenShell
      title={t("help.title")}
      subtitle={t("help.subtitle")}
      onBack={onBack}
    >
      {helpSections.map((section) => (
        <View key={section.key} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name={section.icon} size={16} color={colors.brand} />
            <AppText variant="label" tone="brand" style={styles.sectionTitle}>
              {t(section.titleKey)}
            </AppText>
          </View>

          <Card padded={false} style={styles.card}>
            {section.items.map((item, index) => {
              const key = `${section.key}.${item.key}`;
              return (
                <FaqItem
                  key={key}
                  question={t(item.q)}
                  answer={t(item.a)}
                  open={openKey === key}
                  onToggle={() => toggle(key)}
                  showDivider={index < section.items.length - 1}
                />
              );
            })}
          </Card>
        </View>
      ))}

      <Card style={styles.contact}>
        <AppText variant="bodyStrong" style={styles.contactTitle}>
          {t("help.stillStuck")}
        </AppText>
        <AppText variant="bodySm" tone="secondary" style={styles.contactBody}>
          {t("help.stillStuckBody")}
        </AppText>
        <Button
          title={t("help.contactSupport")}
          onPress={onContactSupport}
          size="lg"
          leftIcon={<Feather name="message-circle" size={16} color={colors.onBrand} />}
        />
      </Card>
    </StackScreenShell>
  );
}

const getStyles = () =>
  StyleSheet.create({
    section: {
      marginBottom: spacing.xxl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm + 2,
      paddingHorizontal: spacing.xs,
    },
    sectionTitle: {
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    card: {
      overflow: "hidden",
    },
    contact: {
      marginTop: spacing.xs,
    },
    contactTitle: {
      marginBottom: spacing.xs,
    },
    contactBody: {
      marginBottom: spacing.lg,
    },
  });
