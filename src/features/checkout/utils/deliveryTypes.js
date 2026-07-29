// The fixed vocabulary of delivery types.
//
// Mirrors server/src/modules/storefront/deliveryTypes.js. The server sends only a type code and
// a price per method; everything a buyer reads — the name, the delivery time, whether an
// address is needed — is derived here from the code.
//
// That is deliberate. These facts are identical for every courier, so shipping them per method
// per courier was payload and an opportunity for them to disagree. Change both files together.

export const DELIVERY_TYPES = Object.freeze({
  STANDARD: Object.freeze({
    code: "STANDARD", name: "Standard", nameBn: "সাধারণ",
    minDays: 3, maxDays: 5, requiresAddress: true, fixedPricePaisa: null,
  }),
  EXPRESS: Object.freeze({
    code: "EXPRESS", name: "Express", nameBn: "এক্সপ্রেস",
    minDays: 1, maxDays: 2, requiresAddress: true, fixedPricePaisa: null,
  }),
  PICKUP: Object.freeze({
    code: "PICKUP", name: "Pickup", nameBn: "নিজে সংগ্রহ",
    minDays: 0, maxDays: 0, requiresAddress: false, fixedPricePaisa: 0,
  }),
});

// Returns null for a code this build does not know. An installed APK will eventually meet a
// type added after it shipped, and the caller has to degrade rather than render `undefined` —
// the buyer sees the raw code with no delivery time, which is ugly but honest.
export function getDeliveryType(code) {
  if (!code) return null;
  return DELIVERY_TYPES[String(code).toUpperCase()] || null;
}

// Delivery needs an address; pickup does not. Defaults to true for an unknown type, because
// demanding an address the buyer did not need is recoverable and shipping to nowhere is not.
export function typeRequiresAddress(code) {
  const type = getDeliveryType(code);
  return type ? type.requiresAddress : true;
}
