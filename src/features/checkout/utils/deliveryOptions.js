import { formatNumber, paisaToBdt } from "../../../utils/money";
import { getDeliveryType } from "./deliveryTypes";

// Delivery options come from the dashboard now, not a hardcoded array.
//
// A buyer picks a courier first, then one of that courier's methods. The price belongs to the
// pair — "Express" costs what that courier charges for it — so a method only ever makes sense
// read through its courier.
//
// The server charges the price from its own row at order time; everything here is display.

export function findCourier(couriers, courierId) {
  if (!courierId) return null;
  return (couriers || []).find((courier) => String(courier.id) === String(courierId)) ?? null;
}

export function findMethod(couriers, methodId) {
  if (!methodId) return null;
  for (const courier of couriers || []) {
    const method = (courier.methods || []).find((item) => String(item.id) === String(methodId));
    if (method) return { ...method, courier };
  }
  return null;
}

// Only couriers that actually have a method are offerable — one with none would be a dead end
// at checkout. The server already filters to active rows.
export function selectableCouriers(couriers) {
  return (couriers || []).filter((courier) => (courier.methods || []).length > 0);
}

// "3-5 business days" / "৩-৫ কার্যদিবস", derived from the method's TYPE rather than from
// per-row day columns. Standard is 3-5 everywhere, so the server stopped sending it.
//
// formatNumber gives Bengali numerals in bn, which is why the values are formatted before
// interpolation rather than left to i18next.
export function formatDeliveryDays(method, language, t) {
  const type = getDeliveryType(method?.code);
  // A type this build does not know — an older row, or one added after this APK shipped. Show
  // no delivery time rather than "undefined-undefined business days".
  if (!type) return "";

  const { minDays: min, maxDays: max } = type;
  // Two explicit keys rather than i18next plural suffixes: nothing else in this app uses them
  // and the translation checker does not recognise them.
  if (max <= min) {
    const key = min === 1 ? "checkout.daysOne" : "checkout.daysExact";
    return t(key, { value: formatNumber(min, language) });
  }
  return t("checkout.daysRange", {
    min: formatNumber(min, language),
    max: formatNumber(max, language),
  });
}

// The courier's name in the active language, falling back to English when no Bangla was
// entered — the same rule product and colour names already follow.
export function localizedName(entity, language) {
  if (!entity) return "";
  if (language === "bn") return entity.nameBn?.trim() || entity.name;
  return entity.name;
}

// A delivery method's label comes from its type, not from the row — the server no longer sends
// a name because "Express" is called that for every courier. Falls back to the raw code so an
// unrecognised type is still selectable rather than rendering as a blank row.
export function methodLabel(method, language) {
  const type = getDeliveryType(method?.code);
  if (!type) return method?.code || "";
  return localizedName(type, language);
}

export function methodPriceBdt(method) {
  return paisaToBdt(Number(method?.pricePaisa || 0));
}
