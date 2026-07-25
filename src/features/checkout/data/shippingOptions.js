export const SHIPPING_OPTIONS = [
  {
    id: "standard",
    label: "Standard",
    labelKey: "checkout.standard",
    descriptionKey: "checkout.standardDescription",
    price: 0,
    eta: "3-5 business days",
    requiresAddress: true,
  },
  {
    id: "express",
    label: "Express",
    labelKey: "checkout.express",
    descriptionKey: "checkout.expressDescription",
    price: 0,
    eta: "1-2 business days",
    requiresAddress: true,
  },
  {
    id: "pickup",
    label: "Pickup",
    labelKey: "checkout.pickup",
    descriptionKey: "checkout.pickupDescription",
    price: 0,
    eta: "Ready in 24 hours",
    requiresAddress: false,
  },
];
