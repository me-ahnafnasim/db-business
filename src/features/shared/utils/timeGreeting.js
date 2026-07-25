import { useTranslation } from "react-i18next";

export function getTimeGreeting(t) {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return t("header.greetingMorning");
  }

  if (hour >= 12 && hour < 17) {
    return t("header.greetingAfternoon");
  }

  if (hour >= 17 && hour < 21) {
    return t("header.greetingEvening");
  }

  return t("header.greetingNight");
}
