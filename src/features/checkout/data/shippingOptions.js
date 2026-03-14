export const SHIPPING_OPTIONS = [
  {
    id: "standard",
    label: "Standard",
    price: 8,
    eta: "3-5 business days",
    requiresAddress: true,
  },
  {
    id: "express",
    label: "Express",
    price: 18,
    eta: "1-2 business days",
    requiresAddress: true,
  },
  {
    id: "pickup",
    label: "Pickup",
    price: 0,
    eta: "Ready in 24 hours",
    requiresAddress: false,
  },
];
