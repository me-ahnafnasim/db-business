import { memo } from "react";

import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { AppText } from "../../../ui";

// One "colour · size · pairs" line of a dozen-pack breakdown.
//
// This was written out four times as a single ~230-character JSX expression — in the
// cart line, the checkout review, the order history and the confirmation card. The
// colour map hangs off a different property in each of those, so callers pass it in.

function AllocationLine({ allocation, colorNames, variant = "caption" }) {
  const { language } = useLanguage();
  const { t } = useTranslation();

  const colorLabel =
    (language === "bn" && colorNames?.[allocation.colorCode]?.bn) || allocation.colorCode;

  return (
    <AppText variant={variant} tone="secondary">
      {colorLabel} · {t("catalog.size")} {allocation.sizeCode} ·{" "}
      {t("cart.pairs", { count: allocation.pairsPerDozen })}
    </AppText>
  );
}

export default memo(AllocationLine);
