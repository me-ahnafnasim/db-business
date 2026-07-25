export function paisaToBdt(value) {
  return Number(value || 0) / 100;
}

export function formatNumber(value, language = "en", options = {}) {
  const locale = language === "bn" ? "bn-BD" : "en-BD";
  return new Intl.NumberFormat(locale, options).format(Number(value || 0));
}

export function formatBdt(value, language = "en") {
  return `৳${formatNumber(value, language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value, language = "en") {
  const locale = language === "bn" ? "bn-BD" : "en-BD";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
