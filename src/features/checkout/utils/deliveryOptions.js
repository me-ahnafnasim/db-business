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
  if (isPickup(courierId)) return PICKUP_COURIER;
  return (couriers || []).find((courier) => String(courier.id) === String(courierId)) ?? null;
}

export function findMethod(couriers, methodId) {
  if (!methodId) return null;
  // Synthetic, so it is not in the list the server sent.
  if (isPickup(methodId)) return { ...PICKUP_METHOD, courier: PICKUP_COURIER };
  for (const courier of couriers || []) {
    const method = (courier.methods || []).find((item) => String(item.id) === String(methodId));
    if (method) return { ...method, courier };
  }
  return null;
}

// Collecting in person is not a courier and has no row behind it.
//
// It used to be a delivery method owned by a courier, which meant the same free option was
// duplicated under every courier and only reachable after choosing one that had nothing to do
// with it — and whether a buyer could collect at all depended on which courier they happened to
// tap first. It is a choice of its own now, always offered, always free, always same-day.
//
// The same sentinel serves as both the courier id and the method id, so the screen's existing
// courierId / shippingMethodId state needs no new shape and everything downstream — pricing,
// labels, the address rule — keeps flowing through the paths that already exist.
export const PICKUP_ID = "PICKUP";

const PICKUP_METHOD = Object.freeze({ id: PICKUP_ID, code: "PICKUP", pricePaisa: 0 });

export const PICKUP_COURIER = Object.freeze({
  id: PICKUP_ID,
  code: "PICKUP",
  methods: [PICKUP_METHOD],
});

export function isPickup(id) {
  return String(id) === PICKUP_ID;
}

// Pickup first, then the couriers that actually have a method — one with none would be a dead
// end at checkout. Pinned by construction rather than by a sort every caller has to remember.
export function selectableCouriers(couriers) {
  const real = (couriers || []).filter((courier) => (courier.methods || []).length > 0);
  return [PICKUP_COURIER, ...real];
}

// "3-5 business days" / "৩-৫ কার্যদিবস", derived from the method's TYPE rather than from
// per-row day columns. Standard is 3-5 everywhere, so the server stopped sending it.
//
// formatNumber gives Bengali numerals in bn, which is why the values are formatted before
// interpolation rather than left to i18next.
export function formatDeliveryDays(method, language, t) {
  const type = getDeliveryType(method?.code);

  // Pickup is not measured in days — "0 business days" is a nonsense thing to tell someone
  // collecting in person. Reuses the string the old hardcoded pickup option already had.
  if (type && type.code === "PICKUP") return t("checkout.pickupDescription");

  // The courier's own range wins. Delivery time is configured per courier in the dashboard —
  // one firm's Express really is another's two-day service — and the type's range is only the
  // default the admin starts from.
  const min = Number.isFinite(Number(method?.minDays)) ? Number(method.minDays) : type?.minDays;
  const max = Number.isFinite(Number(method?.maxDays)) ? Number(method.maxDays) : type?.maxDays;

  // Neither a stored range nor a known type: an older row, or a type added after this APK
  // shipped. Show no delivery time rather than "undefined-undefined business days".
  if (!Number.isFinite(min) || !Number.isFinite(max)) return "";
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
  // The pickup entry carries no name of its own — it is labelled from its type, like a method.
  if (!entity.name && entity.code) return methodLabel(entity, language);
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
